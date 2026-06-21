import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, hashString, scopedSeed } from "../protokit-core/index.js";

export const DETERMINISTIC_REPLAY_HARNESS_VERSION = "0.2.0";

function canonicalize(value) {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function descriptorHash(value) {
  return hashString(JSON.stringify(canonicalize(value))).toString(36);
}

function createInitialState(options = {}) {
  return {
    version: DETERMINISTIC_REPLAY_HARNESS_VERSION,
    seed: options.seed ?? "replay-seed",
    runs: {},
    latestRunId: null,
    reports: [],
    requiredFields: asList(options.requiredFields ?? ["seed", "spec", "descriptor", "budget"]),
    lastReason: "initialized"
  };
}

function makeRun(input = {}, state = createInitialState()) {
  const runId = input.id ?? input.runId ?? `replay-${Object.keys(state.runs ?? {}).length + 1}`;
  const seed = input.seed ?? scopedSeed(state.seed, runId);
  const descriptor = clone(input.descriptor ?? input.snapshot ?? {});
  const budget = clone(input.budget ?? input.budgetSnapshot ?? {});
  const spec = clone(input.spec ?? input.objectSpec ?? {});
  const hash = input.hash ?? descriptorHash({ seed, spec, descriptor, budget });
  return { id: runId, seed, spec, descriptor, budget, hash, metadata: clone(input.metadata ?? {}) };
}

function compareRuns(a = {}, b = {}) {
  const warnings = [];
  if (a.seed !== b.seed) warnings.push({ type: "seed-mismatch", a: a.seed, b: b.seed });
  if (descriptorHash(a.spec) !== descriptorHash(b.spec)) warnings.push({ type: "spec-mismatch" });
  if (descriptorHash(a.descriptor) !== descriptorHash(b.descriptor)) warnings.push({ type: "descriptor-mismatch" });
  if (descriptorHash(a.budget) !== descriptorHash(b.budget)) warnings.push({ type: "budget-mismatch" });
  if (a.hash !== b.hash) warnings.push({ type: "output-hash-mismatch", a: a.hash, b: b.hash });
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings, hashA: a.hash, hashB: b.hash };
}

export function createDeterministicReplayHarness(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const ReplayHarnessState = resource(options.resourceName ?? "deterministicReplay.state");
  const ReplayRunRecorded = event("deterministicReplay.runRecorded");
  const ReplayCompared = event("deterministicReplay.compared");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "deterministic-replay-harness",
    resources: { ReplayHarnessState },
    events: { ReplayRunRecorded, ReplayCompared },
    provides: ["qa:replay", "idempotency-report", "output-hash-report", "replay-snapshot"],
    initWorld({ world }) { ensureResource(world, ReplayHarnessState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ReplayHarnessState, () => createInitialState(options));
      const publish = (next) => { world.setResource(ReplayHarnessState, next); return next; };
      engine[options.apiName ?? "deterministicReplay"] = {
        getState: state,
        recordRun(input = {}) {
          const next = state();
          const run = makeRun(input, next);
          next.runs[run.id] = run;
          next.latestRunId = run.id;
          next.lastReason = "run-recorded";
          publish(next);
          world.emit(ReplayRunRecorded, { run: clone(run) });
          return clone(run);
        },
        compare(aId, bId) {
          const next = state();
          const a = next.runs[aId ?? next.latestRunId];
          const b = next.runs[bId];
          const report = a && b ? { id: `compare-${next.reports.length + 1}`, aId: a.id, bId: b.id, ...compareRuns(a, b) } : { id: `compare-${next.reports.length + 1}`, ok: false, warnings: [{ type: "missing-run", aId, bId }] };
          next.reports.push(report);
          next.lastReason = "runs-compared";
          publish(next);
          world.emit(ReplayCompared, { report: clone(report) });
          return clone(report);
        },
        verify(input = {}) {
          const first = this.recordRun({ ...input, id: input.firstId ?? `${input.id ?? "proof"}:a` });
          const second = this.recordRun({ ...input, id: input.secondId ?? `${input.id ?? "proof"}:b` });
          return this.compare(first.id, second.id);
        },
        latestReport() { return clone(state().reports.at(-1) ?? null); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: DETERMINISTIC_REPLAY_HARNESS_VERSION, purpose: "Bounded same-seed replay, descriptor hash, idempotency, and output hash reporting." }
  });
}

export default createDeterministicReplayHarness;
