import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const SESSION_FACADE_KIT_VERSION = "0.1.0";

export function createSessionFacadeState(options = {}) {
  return {
    version: SESSION_FACADE_KIT_VERSION,
    id: options.sessionId ?? options.id ?? "session",
    mode: "active",
    commands: [],
    snapshots: [],
    validation: { ok: true, errors: [] },
    smokeActions: asList(options.smokeActions ?? options.smoke).map(String)
  };
}

export function createValidationSnapshot(state = {}, extra = {}) {
  return {
    id: state.id,
    mode: state.mode,
    commandCount: state.commands?.length ?? 0,
    snapshotCount: state.snapshots?.length ?? 0,
    lastCommand: state.commands?.at?.(-1) ?? null,
    validation: clone(state.validation ?? { ok: true, errors: [] }),
    ...clone(extra)
  };
}

export function recordSessionCommand(state = createSessionFacadeState(), command = {}, result = {}) {
  const id = String(command.id ?? `command-${state.commands.length}`);
  const record = { id, action: String(command.action ?? command.type ?? "command"), payload: clone(command.payload ?? {}), result: clone(result) };
  return { ...state, commands: [...state.commands.slice(-127), record], lastCommand: record };
}

export function recordSessionSnapshot(state = createSessionFacadeState(), snapshot = {}, label = "snapshot") {
  const record = { id: `${state.id}:snapshot:${state.snapshots.length}`, label, snapshot: clone(snapshot) };
  return { ...state, snapshots: [...state.snapshots.slice(-31), record], lastSnapshot: record };
}

export function createSessionFacadeKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const SessionFacadeState = resource(options.resourceName ?? "sessionFacade.state");
  const SessionCommandDispatched = event("sessionFacade.commandDispatched");
  const SessionSnapshotCaptured = event("sessionFacade.snapshotCaptured");
  const SessionRestarted = event("sessionFacade.restarted");
  const createState = () => createSessionFacadeState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "session-facade-kit",
    resources: { SessionFacadeState },
    events: { SessionCommandDispatched, SessionSnapshotCaptured, SessionRestarted },
    provides: ["session-facade", "host-input-facade", "validation-snapshot", "smoke-runner-contract"],
    initWorld({ world }) { ensureResource(world, SessionFacadeState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, SessionFacadeState, createState);
      engine.sessionFacade = {
        dispatch(action, payload = {}) {
          const command = typeof action === "object" ? action : { action, payload };
          const next = recordSessionCommand(state(), command, { accepted: true });
          world.setResource(SessionFacadeState, next);
          world.emit(SessionCommandDispatched, { command: clone(next.lastCommand) });
          return clone(next);
        },
        capture(label = "snapshot", snapshot = {}) {
          const resolved = Object.keys(snapshot).length ? snapshot : { scene: engine.sceneLifecycle?.snapshot?.(), deploy: engine.deployRegistry?.snapshot?.() };
          const next = recordSessionSnapshot(state(), resolved, label);
          world.setResource(SessionFacadeState, next);
          world.emit(SessionSnapshotCaptured, { snapshot: clone(next.lastSnapshot) });
          return clone(next.lastSnapshot);
        },
        restart() {
          const next = createState();
          world.setResource(SessionFacadeState, next);
          world.emit(SessionRestarted, { sessionId: next.id });
          return clone(next);
        },
        runSmoke() {
          let next = state();
          for (const action of next.smokeActions) next = recordSessionCommand(next, { action }, { smoke: true });
          next.validation = { ok: true, errors: [] };
          world.setResource(SessionFacadeState, next);
          return createValidationSnapshot(next, { smokeActions: next.smokeActions });
        },
        getValidationState(extra = {}) { return createValidationSnapshot(state(), extra); },
        getSnapshot() { return clone(state()); },
        getState() { return clone(state()); }
      };
    },
    metadata: { version: SESSION_FACADE_KIT_VERSION, purpose: "Small host-facing session facade for dispatch, snapshots, restart, smoke, and validation state." }
  });
}

export default createSessionFacadeKit;
