import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const SAVE_DELTA_KIT_VERSION = "0.1.0";

export function createSaveDeltaState(options = {}) {
  return {
    version: SAVE_DELTA_KIT_VERSION,
    profileId: options.profileId ?? "default-profile",
    worldId: options.worldId ?? "default-world",
    sceneDeltas: {},
    history: []
  };
}

export function normalizeScenePatch(input = {}) {
  const sceneId = String(input.sceneId ?? "").trim();
  if (!sceneId) throw new TypeError("Save delta patch requires sceneId.");
  const objectId = input.objectId == null ? null : String(input.objectId);
  return {
    id: String(input.id ?? `${sceneId}:patch:${input.index ?? "next"}`),
    sceneId,
    objectId,
    type: String(input.type ?? "merge"),
    path: asList(input.path).map(String),
    value: clone(input.value ?? input.partial ?? {}),
    metadata: clone(input.metadata ?? {})
  };
}

function setPath(target, path, value) {
  if (!path.length) return value;
  const next = Array.isArray(target) ? target.slice() : { ...(target ?? {}) };
  let cursor = next;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    cursor[key] = Array.isArray(cursor[key]) ? cursor[key].slice() : { ...(cursor[key] ?? {}) };
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = clone(value);
  return next;
}

export function applyScenePatch(base = {}, patchInput = {}) {
  const patch = normalizeScenePatch({ sceneId: patchInput.sceneId ?? base.id ?? "scene", ...patchInput });
  if (patch.type === "replace") return patch.path.length ? setPath(base, patch.path, patch.value) : clone(patch.value);
  if (patch.type === "delete") {
    const next = clone(base);
    if (patch.path.length) {
      let cursor = next;
      for (const key of patch.path.slice(0, -1)) cursor = cursor?.[key];
      if (cursor && Object.prototype.hasOwnProperty.call(cursor, patch.path.at(-1))) delete cursor[patch.path.at(-1)];
    } else if (patch.objectId && next.objects) delete next.objects[patch.objectId];
    return next;
  }
  if (patch.objectId) {
    const next = clone(base);
    next.objects = { ...(next.objects ?? {}) };
    next.objects[patch.objectId] = { ...(next.objects[patch.objectId] ?? {}), ...clone(patch.value) };
    return next;
  }
  return { ...(base ?? {}), ...clone(patch.value) };
}

export function recordScenePatch(state = createSaveDeltaState(), patchInput = {}) {
  const patch = normalizeScenePatch({ ...patchInput, index: state.history?.length ?? 0 });
  const scene = state.sceneDeltas[patch.sceneId] ?? { sceneId: patch.sceneId, patches: [], changedObjectIds: [] };
  const changedObjectIds = patch.objectId ? [...new Set([...(scene.changedObjectIds ?? []), patch.objectId])] : scene.changedObjectIds ?? [];
  return {
    ...state,
    sceneDeltas: {
      ...state.sceneDeltas,
      [patch.sceneId]: { ...scene, patches: [...scene.patches, patch], changedObjectIds }
    },
    history: [...(state.history ?? []).slice(-127), { type: "patch", sceneId: patch.sceneId, patchId: patch.id }]
  };
}

export function mergeSceneDelta(baseScene = {}, delta = {}) {
  return asList(delta.patches).reduce((scene, patch) => applyScenePatch(scene, patch), clone(baseScene));
}

export function createSaveDeltaKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const SaveDeltaState = resource(options.resourceName ?? "saveDelta.state");
  const SaveDeltaPatched = event("saveDelta.patched");
  const SaveDeltaReset = event("saveDelta.reset");
  const createState = () => createSaveDeltaState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "save-delta-kit",
    resources: { SaveDeltaState },
    events: { SaveDeltaPatched, SaveDeltaReset },
    provides: ["save-delta", "scene-delta", "delta-only-save"],
    initWorld({ world }) { ensureResource(world, SaveDeltaState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, SaveDeltaState, createState);
      engine.saveDelta = {
        patch(patchInput = {}) {
          const next = recordScenePatch(state(), patchInput);
          world.setResource(SaveDeltaState, next);
          world.emit(SaveDeltaPatched, { patch: normalizeScenePatch({ ...patchInput, index: next.history.length }) });
          return clone(next);
        },
        merge(baseScene = {}, sceneId = baseScene.id) { return mergeSceneDelta(baseScene, state().sceneDeltas?.[sceneId] ?? {}); },
        resetScene(sceneId) {
          const next = state();
          delete next.sceneDeltas[sceneId];
          next.history.push({ type: "reset-scene", sceneId });
          world.setResource(SaveDeltaState, next);
          world.emit(SaveDeltaReset, { sceneId });
          return clone(next);
        },
        getState() { return clone(state()); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: SAVE_DELTA_KIT_VERSION, purpose: "Delta-only scene save patches, changed object tracking, and base scene merge helpers." }
  });
}

export default createSaveDeltaKit;
