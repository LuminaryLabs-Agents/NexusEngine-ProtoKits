export const SCAN_AFFORDANCE_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createScanAffordanceDomainKit requires NexusEngine.${key}.`);
  }
}

function createState(config = {}) {
  return { version: SCAN_AFFORDANCE_DOMAIN_KIT_VERSION, id: config.stateId ?? "scan-affordance-domain", domain: "scan-affordance", targets: Object.fromEntries((config.targets ?? []).map((target) => [target.id, { ...target, progress: 0, scanned: false }])), completed: [], rejected: [], lastResult: null };
}

export function createScanAffordanceDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const ScanAffordanceState = defineResource(config.resourceName ?? "scanAffordanceDomain.state");
  const ScanRequested = defineEvent("scanAffordance.requested");
  const ScanCompleted = defineEvent("scanAffordance.completed");
  const ScanRejected = defineEvent("scanAffordance.rejected");

  function system(world) {
    let state = world.getResource(ScanAffordanceState) ?? createState(config);
    for (const event of world.readEvents(ScanRequested)) {
      const targetId = String(event.targetId ?? "");
      const target = state.targets[targetId];
      if (!target) {
        const rejection = { targetId, reason: "missing-scan-target" };
        state = { ...state, rejected: [...state.rejected, rejection], lastResult: rejection };
        world.emit(ScanRejected, rejection);
        continue;
      }
      const amount = Math.max(0, toNumber(event.amount, toNumber(config.scanAmount, 1)));
      const progress = Math.min(1, toNumber(target.progress, 0) + amount);
      const updated = { ...target, progress, scanned: progress >= 1 || target.scanned };
      const targets = { ...state.targets, [targetId]: updated };
      state = { ...state, targets, lastResult: { targetId, progress, scanned: updated.scanned } };
      if (updated.scanned && !state.completed.includes(targetId)) {
        state = { ...state, completed: [...state.completed, targetId] };
        world.emit(ScanCompleted, { targetId, progress: 1 });
      }
    }
    world.setResource(ScanAffordanceState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "scan-affordance-domain-kit",
    provides: ["n:scan-affordance", "interaction:scan"],
    resources: { ScanAffordanceState },
    events: { ScanRequested, ScanCompleted, ScanRejected },
    systems: [{ phase: config.phase ?? "simulate", name: "scanAffordanceDomainSystem", system }],
    initWorld({ world }) { world.setResource(ScanAffordanceState, createState(config)); },
    install({ engine, world }) {
      engine.scanAffordanceDomain = {
        scan(targetId, payload = {}) { world.emit(ScanRequested, { targetId, ...payload }); return world.getResource(ScanAffordanceState); },
        getState() { return clone(world.getResource(ScanAffordanceState)); }
      };
    },
    metadata: { domain: "scan-affordance", parentDomain: "interaction", scope: "atomic-domain", extendsBase: "DomainServiceKit", composes: ["affordance-descriptor-domain-kit", "spatial-interaction-domain-kit", "objective-flow-domain-kit"], ownsLoop: false, purpose: "Owns scan target progress and scan completion events for scannable objects." }
  });
}

export default createScanAffordanceDomainKit;
