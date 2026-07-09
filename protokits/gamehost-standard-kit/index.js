import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const GAMEHOST_STANDARD_KIT_VERSION = "0.2.0";

function createInitialState(options = {}) {
  return {
    version: GAMEHOST_STANDARD_KIT_VERSION,
    status: "ready",
    proofPackets: {},
    snapshots: [],
    smokeResults: [],
    contract: {
      exposesSnapshot: true,
      exposesRestart: true,
      exposesValidation: true,
      rendererPresentationOnly: true,
      ...clone(options.contract ?? {})
    }
  };
}

function makeHostSnapshot(engine, state, payload = {}) {
  return {
    id: payload.id ?? `host-snapshot-${state.snapshots.length + 1}`,
    status: state.status,
    packetRef: payload.packetRef ?? null,
    gameData: engine.gameData?.objectProofSnapshot?.() ?? engine.gameData?.snapshot?.() ?? null,
    layeredObjects: engine.layeredObjects?.snapshot?.() ?? null,
    materialPalette: engine.materialPalette?.snapshot?.() ?? null,
    performanceBudget: engine.performanceBudget?.snapshot?.() ?? null,
    instancedRender: engine.instancedRender?.snapshot?.() ?? null,
    visualFidelity: engine.visualFidelity?.snapshot?.() ?? null,
    scenarioQa: engine.scenarioQa?.snapshot?.() ?? null,
    deterministicReplay: engine.deterministicReplay?.snapshot?.() ?? null,
    metadata: clone(payload.metadata ?? {})
  };
}

function smoke(snapshot = {}) {
  const warnings = [];
  if (!snapshot.gameData) warnings.push("missing-game-data");
  if (!snapshot.layeredObjects) warnings.push("missing-layered-objects");
  if (!snapshot.performanceBudget) warnings.push("missing-performance-budget");
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings };
}

export function createGamehostStandardKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const GamehostStandardState = resource(options.resourceName ?? "gamehostStandard.state");
  const HostSnapshotCreated = event("gamehostStandard.snapshotCreated");
  const SmokeResultCreated = event("gamehostStandard.smokeResultCreated");
  const HostRestarted = event("gamehostStandard.restarted");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "gamehost-standard-kit",
    resources: { GamehostStandardState },
    events: { HostSnapshotCreated, SmokeResultCreated, HostRestarted },
    provides: ["qa:gamehost-standard", "host-snapshot", "smoke-result", "standard-proof-contract"],
    initWorld({ world }) { ensureResource(world, GamehostStandardState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, GamehostStandardState, () => createInitialState(options));
      const publish = (next) => { world.setResource(GamehostStandardState, next); return next; };
      engine[options.apiName ?? "gamehostStandard"] = {
        getState: state,
        registerProofPacket(packetRef, payload = {}) {
          const next = state();
          next.proofPackets[packetRef] = { packetRef, status: payload.status ?? "ready-for-prototype", ...clone(payload) };
          publish(next);
          return clone(next.proofPackets[packetRef]);
        },
        snapshot(payload = {}) {
          const next = state();
          const snapshot = makeHostSnapshot(engine, next, payload);
          next.snapshots.push(snapshot);
          next.snapshots = next.snapshots.slice(-32);
          publish(next);
          world.emit(HostSnapshotCreated, { snapshot: clone(snapshot) });
          return clone(snapshot);
        },
        runSmoke(payload = {}) {
          const snapshot = this.snapshot(payload);
          const result = { id: `smoke-${state().smokeResults.length + 1}`, packetRef: payload.packetRef ?? null, ...smoke(snapshot), snapshotId: snapshot.id };
          const next = state();
          next.smokeResults.push(result);
          next.smokeResults = next.smokeResults.slice(-64);
          next.status = result.ok ? "ready" : "warning";
          publish(next);
          world.emit(SmokeResultCreated, { result: clone(result) });
          return clone(result);
        },
        validate(payload = {}) {
          const smokeResult = this.runSmoke(payload);
          const scenario = payload.packetRef && engine.scenarioQa?.runObjectProof ? engine.scenarioQa.runObjectProof(payload.packetRef, payload.context ?? {}) : null;
          return { ok: smokeResult.ok && (scenario?.ok ?? true), smoke: smokeResult, scenario };
        },
        restart(payload = {}) {
          const next = createInitialState({ ...options, contract: state().contract });
          publish(next);
          world.emit(HostRestarted, payload);
          return clone(next);
        },
        contract() { return clone(state().contract); }
      };
    },
    metadata: { version: GAMEHOST_STANDARD_KIT_VERSION, purpose: "Bounded host contract container for snapshots, smoke tests, validation, restart, and object proof packets." }
  });
}

export default createGamehostStandardKit;
