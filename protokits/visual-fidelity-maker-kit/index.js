import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const VISUAL_FIDELITY_MAKER_KIT_VERSION = "0.2.0";

export const DEFAULT_FIDELITY_PASSES = Object.freeze([
  { id: "material-pass", focus: "material", order: 10 },
  { id: "texture-pass", focus: "texture", order: 20 },
  { id: "lighting-pass", focus: "lighting", order: 30 },
  { id: "surface-overlay-pass", focus: "surface-overlay", order: 40 },
  { id: "readability-pass", focus: "readability", order: 50 },
  { id: "optimization-pass", focus: "optimization", order: 60 }
]);

function createInitialState(options = {}) {
  return {
    version: VISUAL_FIDELITY_MAKER_KIT_VERSION,
    passes: asList(options.passes ?? DEFAULT_FIDELITY_PASSES).map((pass, index) => ({ order: index * 10, status: "pending", ...pass })),
    reports: [],
    latestReportId: null
  };
}

function scorePass(pass = {}, input = {}) {
  const budget = input.budget ?? {};
  const visual = input.visual ?? {};
  const warnings = [];
  if (pass.focus === "material" && !visual.materialId && !visual.material) warnings.push("missing-material");
  if (pass.focus === "texture" && input.textureOptimized === false) warnings.push("texture-not-optimized");
  if (pass.focus === "lighting" && !input.lighting && !visual.lighting) warnings.push("missing-lighting-rig");
  if (pass.focus === "readability" && number(input.readabilityScore, 1) < 0.65) warnings.push("low-readability");
  if (pass.focus === "optimization" && budget.ok === false) warnings.push("budget-overrun");
  return { passId: pass.id, focus: pass.focus, ok: warnings.length === 0, warnings };
}

export function createFidelityPassDescriptor(input = {}) {
  const passes = asList(input.passes ?? DEFAULT_FIDELITY_PASSES).sort((a, b) => number(a.order) - number(b.order));
  const results = passes.map((pass) => scorePass(pass, input));
  return {
    id: input.id ?? "fidelity-pass-descriptor",
    proofId: input.proofId ?? null,
    packetRef: input.packetRef ?? input.proofPacket ?? null,
    passOrder: passes.map((pass) => pass.id),
    results,
    ok: results.every((result) => result.ok),
    warningCount: results.reduce((sum, result) => sum + result.warnings.length, 0)
  };
}

export function createVisualFidelityMakerKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const VisualFidelityState = resource(options.resourceName ?? "visualFidelity.state");
  const FidelityPassRun = event("visualFidelity.passRun");
  const FidelityReportCreated = event("visualFidelity.reportCreated");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "visual-fidelity-maker-kit",
    resources: { VisualFidelityState },
    events: { FidelityPassRun, FidelityReportCreated },
    provides: ["maker:visual-fidelity", "fidelity-pass-descriptors", "comparison-snapshots"],
    initWorld({ world }) { ensureResource(world, VisualFidelityState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, VisualFidelityState, () => createInitialState(options));
      const publish = (next) => { world.setResource(VisualFidelityState, next); return next; };
      engine[options.apiName ?? "visualFidelity"] = {
        getState: state,
        runPass(passId, input = {}) {
          const next = state();
          const pass = next.passes.find((entry) => entry.id === passId) ?? { id: passId, focus: passId };
          const result = scorePass(pass, input);
          pass.status = result.ok ? "passed" : "warning";
          pass.lastResult = result;
          publish(next);
          world.emit(FidelityPassRun, { passId, result: clone(result) });
          return clone(result);
        },
        createReport(input = {}) {
          const next = state();
          const report = { reportId: input.reportId ?? `fidelity-report-${next.reports.length + 1}`, ...createFidelityPassDescriptor({ ...input, passes: next.passes }) };
          next.reports.push(report);
          next.latestReportId = report.reportId;
          publish(next);
          world.emit(FidelityReportCreated, { report: clone(report) });
          return clone(report);
        },
        compare(before = {}, after = {}, payload = {}) {
          const report = this.createReport({ ...payload, visual: after.visual ?? after, budget: after.budget, readabilityScore: after.readabilityScore });
          return { ...report, before: clone(before), after: clone(after) };
        },
        latestReport() { return clone(state().reports.at(-1) ?? null); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: VISUAL_FIDELITY_MAKER_KIT_VERSION, purpose: "Bounded fidelity pass container for material, texture, lighting, surface overlay, readability, and optimization passes." }
  });
}

export default createVisualFidelityMakerKit;
