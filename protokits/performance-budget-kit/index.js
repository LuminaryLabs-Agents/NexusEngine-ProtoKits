import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const PERFORMANCE_BUDGET_KIT_VERSION = "0.2.0";

export const DEFAULT_QUALITY_TIERS = Object.freeze({
  low: { pixelRatioMax: 1, patchRadius: 1, maxActivePatches: 9, maxInstancesPerPatch: 180, shadowMapSize: 512, lod: true, debugMetrics: false },
  medium: { pixelRatioMax: 1.5, patchRadius: 2, maxActivePatches: 25, maxInstancesPerPatch: 420, shadowMapSize: 1024, lod: true, debugMetrics: false },
  high: { pixelRatioMax: 2, patchRadius: 3, maxActivePatches: 49, maxInstancesPerPatch: 900, shadowMapSize: 2048, lod: true, debugMetrics: true },
  ultra: { pixelRatioMax: 2, patchRadius: 4, maxActivePatches: 81, maxInstancesPerPatch: 1600, shadowMapSize: 4096, lod: true, debugMetrics: true }
});

export const DEFAULT_OBJECT_PROOF_BUDGETS = Object.freeze({
  maxTriangles: 2400,
  maxMaterials: 4,
  maxTextureBytes: 1024 * 1024,
  maxDrawCalls: 3,
  maxLodLevels: 4,
  maxTransparencyCost: 2,
  maxComparisonPasses: 6,
  minInstancingValue: 2
});

export function createBudgetState(options = {}) {
  const tierName = options.tier ?? options.quality ?? "adaptive";
  const base = tierName === "adaptive" ? DEFAULT_QUALITY_TIERS.medium : (DEFAULT_QUALITY_TIERS[tierName] ?? DEFAULT_QUALITY_TIERS.medium);
  return {
    version: PERFORMANCE_BUDGET_KIT_VERSION,
    tier: tierName,
    adaptive: tierName === "adaptive",
    metrics: { fps: 60, frameMs: 16.67, drawCalls: 0, activePatches: 0, instanceCount: 0 },
    budgets: { ...base, ...(options.budgets ?? {}) },
    objectProofBudgets: { ...DEFAULT_OBJECT_PROOF_BUDGETS, ...(options.objectProofBudgets ?? {}) },
    objectReports: {},
    tiers: { ...DEFAULT_QUALITY_TIERS, ...(options.tiers ?? {}) }
  };
}

export function chooseAdaptiveTier(metrics = {}, tiers = DEFAULT_QUALITY_TIERS) {
  const fps = number(metrics.fps, 60);
  if (fps < 38) return "low";
  if (fps < 52) return "medium";
  if (fps < 70) return "high";
  return "ultra";
}

export function evaluateObjectBudget(metrics = {}, budgets = DEFAULT_OBJECT_PROOF_BUDGETS) {
  const report = {
    triangles: number(metrics.triangles ?? metrics.triangleCount, 0),
    materials: number(metrics.materials ?? metrics.materialCount, 0),
    textureBytes: number(metrics.textureBytes ?? metrics.textureMemory, 0),
    drawCalls: number(metrics.drawCalls, 0),
    lodLevels: number(metrics.lodLevels ?? metrics.lodLevelCount, 0),
    transparencyCost: number(metrics.transparencyCost, 0),
    comparisonPasses: number(metrics.comparisonPasses, 0),
    instancingValue: number(metrics.instancingValue, 0)
  };
  const warnings = [];
  if (report.triangles > budgets.maxTriangles) warnings.push({ field: "triangles", value: report.triangles, max: budgets.maxTriangles });
  if (report.materials > budgets.maxMaterials) warnings.push({ field: "materials", value: report.materials, max: budgets.maxMaterials });
  if (report.textureBytes > budgets.maxTextureBytes) warnings.push({ field: "textureBytes", value: report.textureBytes, max: budgets.maxTextureBytes });
  if (report.drawCalls > budgets.maxDrawCalls) warnings.push({ field: "drawCalls", value: report.drawCalls, max: budgets.maxDrawCalls });
  if (report.lodLevels > budgets.maxLodLevels) warnings.push({ field: "lodLevels", value: report.lodLevels, max: budgets.maxLodLevels });
  if (report.transparencyCost > budgets.maxTransparencyCost) warnings.push({ field: "transparencyCost", value: report.transparencyCost, max: budgets.maxTransparencyCost });
  if (report.comparisonPasses > budgets.maxComparisonPasses) warnings.push({ field: "comparisonPasses", value: report.comparisonPasses, max: budgets.maxComparisonPasses });
  if (report.instancingValue > 0 && report.instancingValue < budgets.minInstancingValue) warnings.push({ field: "instancingValue", value: report.instancingValue, min: budgets.minInstancingValue });
  return { ...report, ok: warnings.length === 0, warningCount: warnings.length, warnings };
}

export function createPerformanceBudgetKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const PerformanceBudgetState = resource(options.resourceName ?? "performanceBudget.state");
  const PerformanceBudgetUpdated = event("performanceBudget.updated");
  const ObjectBudgetReported = event("performanceBudget.objectBudgetReported");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "performance-budget-kit",
    resources: { PerformanceBudgetState },
    events: { PerformanceBudgetUpdated, ObjectBudgetReported },
    provides: ["performance-budget", "quality-budget", "object-budget-descriptors", "lod-budget-descriptors"],
    initWorld({ world }) { ensureResource(world, PerformanceBudgetState, () => createBudgetState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, PerformanceBudgetState, () => createBudgetState(options));
      const publish = (next, reason) => { world.setResource(PerformanceBudgetState, next); world.emit(PerformanceBudgetUpdated, { reason, state: clone(next) }); return next; };
      engine.performanceBudget = {
        getState: state,
        getBudget: (key, fallback) => state().budgets?.[key] ?? state().objectProofBudgets?.[key] ?? fallback,
        setTier(tier) {
          const next = state();
          const base = next.tiers[tier] ?? next.tiers.medium;
          next.tier = tier;
          next.adaptive = tier === "adaptive";
          next.budgets = { ...base, ...next.budgets, ...(tier === "adaptive" ? {} : base) };
          return publish(next, "tier");
        },
        setObjectProofBudget(key, value) {
          const next = state();
          next.objectProofBudgets[key] = value;
          return publish(next, "object-proof-budget");
        },
        report(metrics = {}) {
          const next = state();
          next.metrics = { ...next.metrics, ...metrics };
          if (next.adaptive) {
            const tier = chooseAdaptiveTier(next.metrics, next.tiers);
            next.budgets = { ...next.tiers[tier], adaptiveTier: tier };
          }
          return publish(next, "metrics");
        },
        reportObjectProof(objectId, metrics = {}, payload = {}) {
          const next = state();
          const report = { objectId, ...evaluateObjectBudget(metrics, next.objectProofBudgets), metadata: payload.metadata ?? {} };
          next.objectReports[objectId] = report;
          publish(next, "object-proof-report");
          world.emit(ObjectBudgetReported, { objectId, report: clone(report) });
          return clone(report);
        },
        evaluateObjectBudget(metrics = {}) { return evaluateObjectBudget(metrics, state().objectProofBudgets); },
        listObjectReports() { return Object.values(state().objectReports ?? {}).map(clone); },
        clampInstances: (count) => clamp(count, 0, state().budgets.maxInstancesPerPatch),
        snapshot: () => clone(state())
      };
    },
    metadata: { version: PERFORMANCE_BUDGET_KIT_VERSION, purpose: "Renderer-agnostic quality tiers, patch budgets, object proof budgets, LOD limits, and metrics." }
  });
}
