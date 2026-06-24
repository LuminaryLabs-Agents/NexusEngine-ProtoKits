import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const SCENE_GRAPH_DOMAIN_KIT_VERSION = "0.1.0";

const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const vec3 = (value = {}, fallback = {}) => ({ x: toNumber(value.x, toNumber(fallback.x, 0)), y: toNumber(value.y, toNumber(fallback.y, 0)), z: toNumber(value.z, toNumber(fallback.z, 0)) });
const quat = (value = {}, fallback = {}) => ({ x: toNumber(value.x, toNumber(fallback.x, 0)), y: toNumber(value.y, toNumber(fallback.y, 0)), z: toNumber(value.z, toNumber(fallback.z, 0)), w: toNumber(value.w, toNumber(fallback.w, 1)) });

export function normalizeSceneTransform(value = {}) {
  return { position: vec3(value.position), rotation: quat(value.rotation), scale: vec3(value.scale, { x: 1, y: 1, z: 1 }) };
}

export function normalizeSceneObject(value = {}, index = 0) {
  const id = String(value.id ?? `scene-object-${index}`).trim();
  if (!id) throw new TypeError("Scene object requires a stable id.");
  return {
    id,
    type: String(value.type ?? "scene.object"),
    name: String(value.name ?? id),
    tags: asList(value.tags).map(String).filter(Boolean),
    parentId: value.parentId ?? null,
    transform: normalizeSceneTransform(value.transform ?? {}),
    capabilities: {
      selectable: value.capabilities?.selectable !== false,
      interactable: value.capabilities?.interactable !== false,
      persistent: value.capabilities?.persistent !== false,
      renderable: value.capabilities?.renderable !== false,
      ...(value.capabilities ?? {})
    },
    descriptors: asList(value.descriptors),
    metadata: clone(value.metadata ?? {})
  };
}

export function createSceneGraphState(options = {}) {
  const objects = {};
  for (const [index, object] of asList(options.objects).entries()) {
    const normalized = normalizeSceneObject(object, index);
    objects[normalized.id] = normalized;
  }
  return { version: SCENE_GRAPH_DOMAIN_KIT_VERSION, sceneId: options.sceneId ?? "scene", objects, dirtyObjectIds: [], patches: [], rejectedPatches: [] };
}

export function applySceneGraphPatch(state = createSceneGraphState(), patch = {}) {
  const id = patch.id ?? `patch-${state.patches.length}`;
  const next = { ...state, objects: { ...(state.objects ?? {}) } };
  if (patch.type === "createObject") {
    const object = normalizeSceneObject(patch.object, Object.keys(next.objects).length);
    next.objects[object.id] = object;
    next.dirtyObjectIds = [...new Set([...(state.dirtyObjectIds ?? []), object.id])];
    next.patches = [...(state.patches ?? []), { ...clone(patch), id, status: "applied" }];
    return next;
  }
  if (patch.type === "updateObject" && next.objects[patch.objectId]) {
    const current = next.objects[patch.objectId];
    const partial = clone(patch.partial ?? {});
    next.objects[patch.objectId] = { ...current, ...partial, id: patch.objectId, transform: partial.transform ? normalizeSceneTransform(partial.transform) : current.transform };
    next.dirtyObjectIds = [...new Set([...(state.dirtyObjectIds ?? []), patch.objectId])];
    next.patches = [...(state.patches ?? []), { ...clone(patch), id, status: "applied" }];
    return next;
  }
  if (patch.type === "removeObject" && next.objects[patch.objectId]) {
    const { [patch.objectId]: removed, ...remaining } = next.objects;
    next.objects = remaining;
    next.dirtyObjectIds = [...new Set([...(state.dirtyObjectIds ?? []), patch.objectId])];
    next.patches = [...(state.patches ?? []), { ...clone(patch), id, status: "applied", removed: Boolean(removed) }];
    return next;
  }
  return { ...state, rejectedPatches: [...(state.rejectedPatches ?? []), { ...clone(patch), id, status: "rejected", reason: "invalid-patch" }] };
}

export function createSceneGraphDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const SceneGraphState = resource(options.resourceName ?? "sceneGraph.state");
  const SceneGraphPatched = event("sceneGraph.patched");
  const createState = () => createSceneGraphState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "scene-graph-domain-kit",
    resources: { SceneGraphState },
    events: { SceneGraphPatched },
    provides: ["scene-graph", "scene-objects", "scene-patches", "scene-dirty-set"],
    initWorld({ world }) { ensureResource(world, SceneGraphState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, SceneGraphState, createState);
      const applyPatch = (payload) => {
        const next = applySceneGraphPatch(state(), payload);
        world.setResource(SceneGraphState, next);
        world.emit(SceneGraphPatched, { patch: clone(next.patches.at(-1) ?? null), dirtyObjectIds: [...(next.dirtyObjectIds ?? [])] });
        return clone(next);
      };
      engine.sceneGraph = {
        createObject(object = {}) { return applyPatch({ type: "createObject", object }); },
        updateObject(objectId, partial = {}) { return applyPatch({ type: "updateObject", objectId, partial }); },
        removeObject(objectId) { return applyPatch({ type: "removeObject", objectId }); },
        applyPatch,
        getObject(id) { return clone(state().objects?.[id] ?? null); },
        listObjects() { return Object.values(state().objects ?? {}).map(clone); },
        getState() { return clone(state()); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: SCENE_GRAPH_DOMAIN_KIT_VERSION, purpose: "General JSON-safe scene object graph, transforms, capabilities, dirty patches, and snapshots." }
  });
}

export default createSceneGraphDomainKit;
