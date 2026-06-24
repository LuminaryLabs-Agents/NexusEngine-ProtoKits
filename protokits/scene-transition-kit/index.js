import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const SCENE_TRANSITION_KIT_VERSION = "0.1.0";

export function createSceneTransitionState(options = {}) {
  return { version: SCENE_TRANSITION_KIT_VERSION, active: null, history: [], defaultStyle: options.defaultStyle ?? "fade" };
}

export function createSceneTransitionRequest(input = {}) {
  const fromSceneId = input.fromSceneId ?? null;
  const toSceneId = String(input.toSceneId ?? input.targetSceneId ?? "").trim();
  if (!toSceneId) throw new TypeError("Scene transition requires toSceneId.");
  const id = String(input.id ?? `transition:${fromSceneId ?? "none"}->${toSceneId}`).trim();
  return {
    id,
    fromSceneId,
    toSceneId,
    style: String(input.style ?? "fade"),
    duration: Number.isFinite(Number(input.duration)) ? Number(input.duration) : 0.35,
    preload: input.preload !== false,
    payload: clone(input.payload ?? {})
  };
}

export function requestSceneTransition(state = createSceneTransitionState(), input = {}) {
  const request = createSceneTransitionRequest(input);
  return { ...state, active: { ...request, status: "requested" }, history: [...(state.history ?? []).slice(-63), { ...request, status: "requested" }] };
}

export function completeSceneTransition(state = createSceneTransitionState(), payload = {}) {
  if (!state.active) return state;
  const completed = { ...state.active, ...clone(payload), status: "completed" };
  return { ...state, active: null, history: [...(state.history ?? []).slice(-63), completed] };
}

export function cancelSceneTransition(state = createSceneTransitionState(), reason = "cancelled") {
  if (!state.active) return state;
  const cancelled = { ...state.active, status: "cancelled", reason };
  return { ...state, active: null, history: [...(state.history ?? []).slice(-63), cancelled] };
}

export function createSceneTransitionKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const SceneTransitionState = resource(options.resourceName ?? "sceneTransition.state");
  const SceneTransitionRequested = event("sceneTransition.requested");
  const SceneTransitionCompleted = event("sceneTransition.completed");
  const SceneTransitionCancelled = event("sceneTransition.cancelled");
  const createState = () => createSceneTransitionState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "scene-transition-kit",
    resources: { SceneTransitionState },
    events: { SceneTransitionRequested, SceneTransitionCompleted, SceneTransitionCancelled },
    provides: ["scene-transition", "transition-preload-contract"],
    initWorld({ world }) { ensureResource(world, SceneTransitionState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, SceneTransitionState, createState);
      engine.sceneTransition = {
        request(input = {}) {
          const next = requestSceneTransition(state(), { style: state().defaultStyle, ...input });
          world.setResource(SceneTransitionState, next);
          world.emit(SceneTransitionRequested, { transition: clone(next.active) });
          return clone(next.active);
        },
        complete(payload = {}) {
          const active = clone(state().active);
          const next = completeSceneTransition(state(), payload);
          world.setResource(SceneTransitionState, next);
          world.emit(SceneTransitionCompleted, { transition: active, payload: clone(payload) });
          return clone(next);
        },
        cancel(reason = "cancelled") {
          const active = clone(state().active);
          const next = cancelSceneTransition(state(), reason);
          world.setResource(SceneTransitionState, next);
          world.emit(SceneTransitionCancelled, { transition: active, reason });
          return clone(next);
        },
        getState() { return clone(state()); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: SCENE_TRANSITION_KIT_VERSION, purpose: "Scene transition requests, preload intent, completion, and cancellation state." }
  });
}

export default createSceneTransitionKit;
