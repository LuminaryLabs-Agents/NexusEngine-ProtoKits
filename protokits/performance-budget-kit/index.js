import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const PERFORMANCE_BUDGET_KIT_VERSION = "0.1.0";

export const DEFAULT_QUALITY_TIERS = Object.freeze({
  low: { pixelRatioMax: 1, patchRadius: 1, maxActivePatches: 9, maxInstancesPerPatch: 180, shadowMapSize: 512, lod: true, debugMetrics: false },
  medium: { pixelRatioMax: 1.5, patchRadius: 2, maxActivePatches: 25, maxInstancesPerPatch: 420, shadowMapSize: 1024, lod: true, debugMetrics: false },
  high: { pixelRatioMax: 2, patchRadius: 3, maxActivePatches: 49, maxInstancesPerPatch: 900, shadowMapSize: 2048, lod: true, debugMetrics: true },
  ultra: { pixelRatioMax: 2, patchRadius: 4, maxActivePatches: 81, maxInstancesPerPatch: 1600, shadowMapSize: 4096, lod: true, debugMetrics: true }
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

export function createPerformanceBudgetKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const PerformanceBudgetState = resource(options.resourceName ?? "performanceBudget.state");
  const PerformanceBudgetUpdated = event("performanceBudget.updated");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "performance-budget-kit",
    resources: { PerformanceBudgetState },
    events: { PerformanceBudgetUpdated },
    provides: ["performance-budget", "quality-budget"],
    initWorld({ world }) { ensureResource(world, PerformanceBudgetState, () => createBudgetState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, PerformanceBudgetState, () => createBudgetState(options));
      const publish = (next, reason) => { world.setResource(PerformanceBudgetState, next); world.emit(PerformanceBudgetUpdated, { reason, state: clone(next) }); return next; };
      engine.performanceBudget = {
        getState: state,
        getBudget: (key, fallback) => state().budgets?.[key] ?? fallback,
        setTier(tier) {
          const next = state();
          const base = next.tiers[tier] ?? next.tiers.medium;
          next.tier = tier;
          next.adaptive = tier === "adaptive";
          next.budgets = { ...base, ...next.budgets, ...(tier === "adaptive" ? {} : base) };
          return publish(next, "tier");
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
        clampInstances: (count) => clamp(count, 0, state().budgets.maxInstancesPerPatch),
        snapshot: () => clone(state())
      };
    },
    metadata: { version: PERFORMANCE_BUDGET_KIT_VERSION, purpose: "Renderer-agnostic quality tiers, patch budgets, LOD limits, and metrics." }
  });
}
