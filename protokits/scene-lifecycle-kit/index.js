import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";
import { normalizeDeployManifest } from "../deploy-manifest-kit/index.js";

export const SCENE_LIFECYCLE_KIT_VERSION = "0.1.0";
export const SCENE_LIFECYCLE_STATES = Object.freeze(["idle", "loading", "active", "paused", "exiting", "disposed"]);

export function createSceneLifecycleState(options = {}) {
  return {
    version: SCENE_LIFECYCLE_KIT_VERSION,
    status: "idle",
    currentSceneId: options.currentSceneId ?? null,
    previousSceneId: null,
    enteredAtFrame: null,
    history: []
  };
}

function transitionState(state, status, payload = {}) {
  return {
    ...state,
    status,
    ...payload,
    history: [...(state.history ?? []).slice(-63), { status, ...clone(payload) }]
  };
}

export function enterScene(state = createSceneLifecycleState(), sceneManifest = {}, frame = null) {
  const manifest = normalizeDeployManifest(sceneManifest);
  return transitionState(state, "active", {
    previousSceneId: state.currentSceneId ?? null,
    currentSceneId: manifest.id,
    currentScene: manifest,
    enteredAtFrame: frame
  });
}

export function pauseScene(state = createSceneLifecycleState(), reason = "pause") {
  return transitionState(state, "paused", { reason });
}

export function resumeScene(state = createSceneLifecycleState(), reason = "resume") {
  return transitionState(state, "active", { reason });
}

export function exitScene(state = createSceneLifecycleState(), reason = "exit") {
  return transitionState(state, "exiting", { reason });
}

export function disposeScene(state = createSceneLifecycleState(), reason = "dispose") {
  return transitionState(state, "disposed", { reason, previousSceneId: state.currentSceneId ?? null, currentSceneId: null, currentScene: null });
}

export function createSceneLifecycleKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const SceneLifecycleState = resource(options.resourceName ?? "sceneLifecycle.state");
  const SceneEntered = event("sceneLifecycle.entered");
  const ScenePaused = event("sceneLifecycle.paused");
  const SceneResumed = event("sceneLifecycle.resumed");
  const SceneExited = event("sceneLifecycle.exited");
  const SceneDisposed = event("sceneLifecycle.disposed");
  const createState = () => createSceneLifecycleState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "scene-lifecycle-kit",
    resources: { SceneLifecycleState },
    events: { SceneEntered, ScenePaused, SceneResumed, SceneExited, SceneDisposed },
    provides: ["scene-lifecycle", "scene-enter-exit", "scene-state-snapshot"],
    initWorld({ world }) { ensureResource(world, SceneLifecycleState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, SceneLifecycleState, createState);
      const set = (next, evt, payload) => { world.setResource(SceneLifecycleState, next); world.emit(evt, payload); return clone(next); };
      engine.sceneLifecycle = {
        enter(sceneManifest = {}) { const next = enterScene(state(), sceneManifest, world?.__nexusClock?.frame ?? null); return set(next, SceneEntered, { scene: next.currentScene }); },
        pause(reason = "pause") { const next = pauseScene(state(), reason); return set(next, ScenePaused, { reason, sceneId: next.currentSceneId }); },
        resume(reason = "resume") { const next = resumeScene(state(), reason); return set(next, SceneResumed, { reason, sceneId: next.currentSceneId }); },
        exit(reason = "exit") { const next = exitScene(state(), reason); return set(next, SceneExited, { reason, sceneId: next.currentSceneId }); },
        dispose(reason = "dispose") { const next = disposeScene(state(), reason); return set(next, SceneDisposed, { reason, previousSceneId: next.previousSceneId }); },
        getState() { return clone(state()); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: SCENE_LIFECYCLE_KIT_VERSION, purpose: "Renderer-agnostic scene load, enter, pause, resume, exit, dispose lifecycle state." }
  });
}

export default createSceneLifecycleKit;
