import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const PROMOTION_READINESS_HARNESS_VERSION = "0.1.0";

const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;

function createInitialState(options = {}) {
  return { version: PROMOTION_READINESS_HARNESS_VERSION, kits: {}, testResults: {}, experimentProofs: {}, reports: {}, order: [], criteria: asList(options.criteria ?? defaultCriteria()), lastReason: "initialized" };
}

function defaultCriteria() {
  return ["explicit-export", "readme", "version", "factory", "resources-events-systems", "requires-provides", "reset-snapshot", "headless-tests", "multi-config-proof", "boundary-lint", "promotion-criteria"];
}

function normalizeKit(manifest = {}) {
  const id = idOf(manifest.id ?? manifest.kitId ?? manifest.name, "kit");
  return { id, exportPath: manifest.exportPath ?? null, readmePath: manifest.readmePath ?? null, versionConstant: manifest.versionConstant ?? null, factoryExport: manifest.factoryExport ?? null, resources: asList(manifest.resources).map(String), events: asList(manifest.events).map(String), systems: asList(manifest.systems).map(String), requires: asList(manifest.requires).map(String), provides: asList(manifest.provides).map(String), reset: manifest.reset ?? manifest.resetPolicy ?? null, snapshot: manifest.snapshot ?? manifest.snapshotPolicy ?? null, promotionCriteria: asList(manifest.promotionCriteria).map(String), metadata: clone(manifest.metadata ?? {}) };
}

function evaluateKit(kit = {}, tests = [], proofs = [], criteria = defaultCriteria()) {
  const checks = [];
  const add = (id, ok, detail = {}) => { if (criteria.includes(id)) checks.push({ id, ok: Boolean(ok), ...detail }); };
  add("explicit-export", Boolean(kit.exportPath));
  add("readme", Boolean(kit.readmePath));
  add("version", Boolean(kit.versionConstant));
  add("factory", Boolean(kit.factoryExport));
  add("resources-events-systems", kit.resources.length > 0 && kit.events.length > 0 && kit.systems != null, { resources: kit.resources.length, events: kit.events.length, systems: kit.systems.length });
  add("requires-provides", kit.provides.length > 0, { requires: kit.requires.length, provides: kit.provides.length });
  add("reset-snapshot", Boolean(kit.reset) && Boolean(kit.snapshot));
  add("headless-tests", tests.some((test) => test.ok !== false));
  add("multi-config-proof", proofs.some((proof) => proof.ok !== false && (proof.configCount ?? 0) >= 2));
  add("boundary-lint", !tests.some((test) => test.kind === "boundary-lint" && test.ok === false));
  add("promotion-criteria", kit.promotionCriteria.length > 0);
  const failed = checks.filter((check) => !check.ok);
  return { ok: failed.length === 0, status: failed.length === 0 ? "ready" : "needs-work", score: checks.length ? (checks.length - failed.length) / checks.length : 0, checks, failedChecks: failed.map((check) => check.id) };
}

export function createPromotionReadinessHarness(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const PromotionReadinessState = resource(options.resourceName ?? "promotionReadiness.state");
  const KitRegistered = event("promotionReadiness.kitRegistered");
  const TestResultAttached = event("promotionReadiness.testResultAttached");
  const ExperimentProofAttached = event("promotionReadiness.experimentProofAttached");
  const ReadinessEvaluated = event("promotionReadiness.evaluated");
  const PromotionReadinessReset = event("promotionReadiness.reset");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "promotion-readiness-harness",
    resources: { PromotionReadinessState },
    events: { KitRegistered, TestResultAttached, ExperimentProofAttached, ReadinessEvaluated, PromotionReadinessReset },
    provides: ["qa:promotion-readiness", "kit:promotion-report", "kit:readiness-gate", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, PromotionReadinessState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, PromotionReadinessState, () => createInitialState(options));
      const publish = (next) => { world.setResource(PromotionReadinessState, next); return clone(next); };
      engine[options.apiName ?? "promotionReadiness"] = {
        registerKit(manifest = {}) {
          const next = state();
          const kit = normalizeKit(manifest);
          next.kits[kit.id] = kit;
          next.order = [kit.id, ...next.order.filter((id) => id !== kit.id)];
          next.lastReason = "kit-registered";
          publish(next);
          world.emit(KitRegistered, { kit: clone(kit) });
          return clone(kit);
        },
        attachTestResult(kitId, result = {}) {
          const next = state();
          const id = idOf(kitId);
          const record = { id: result.id ?? `${id}:test-${(next.testResults[id] ?? []).length + 1}`, kitId: id, ok: result.ok !== false, kind: result.kind ?? "headless", ...clone(result) };
          next.testResults[id] = [record, ...(next.testResults[id] ?? [])].slice(0, Number(options.testLimit ?? 64));
          next.lastReason = "test-attached";
          publish(next);
          world.emit(TestResultAttached, { result: clone(record) });
          return clone(record);
        },
        attachExperimentProof(kitId, proof = {}) {
          const next = state();
          const id = idOf(kitId);
          const record = { id: proof.id ?? `${id}:proof-${(next.experimentProofs[id] ?? []).length + 1}`, kitId: id, ok: proof.ok !== false, configCount: Number(proof.configCount ?? 1), ...clone(proof) };
          next.experimentProofs[id] = [record, ...(next.experimentProofs[id] ?? [])].slice(0, Number(options.proofLimit ?? 64));
          next.lastReason = "proof-attached";
          publish(next);
          world.emit(ExperimentProofAttached, { proof: clone(record) });
          return clone(record);
        },
        evaluate(kitId) {
          const next = state();
          const id = idOf(kitId);
          const kit = next.kits[id];
          const report = kit ? { id: `${id}:readiness-${Object.keys(next.reports).length + 1}`, kitId: id, ...evaluateKit(kit, next.testResults[id] ?? [], next.experimentProofs[id] ?? [], next.criteria) } : { id: `${id}:readiness-missing`, kitId: id, ok: false, status: "missing-kit", score: 0, checks: [], failedChecks: ["missing-kit"] };
          next.reports[id] = report;
          next.lastReason = report.status;
          publish(next);
          world.emit(ReadinessEvaluated, { report: clone(report) });
          return clone(report);
        },
        latestReport(kitId) { return clone(state().reports[idOf(kitId)] ?? null); },
        getState() { return clone(state()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(PromotionReadinessState, next); world.emit(PromotionReadinessReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: PROMOTION_READINESS_HARNESS_VERSION, domain: "promotion-readiness", extendsBase: "DomainServiceKit", ownsLoop: false, purpose: "Aggregates docs, exports, tests, proof, and lint signals into promotion readiness reports." }
  });
}

export default createPromotionReadinessHarness;
