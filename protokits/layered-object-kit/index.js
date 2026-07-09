import { asList, byId, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number, scopedSeed, stableId } from "../protokit-core/index.js";

export const LAYERED_OBJECT_KIT_VERSION = "0.2.0";

const OBJECT_LAYER_KINDS = Object.freeze(["mesh", "material", "textureOverlay", "visualState", "physicalState", "attachment", "socket"]);

function createInitialState(options = {}) {
  const layers = asList(options.layers).map((layer, index) => ({ id: layer.id ?? `layer-${index + 1}`, depth: number(layer.depth, index), role: layer.role ?? "generic", visible: layer.visible ?? true, parallax: number(layer.parallax, 1), ...layer }));
  return {
    version: LAYERED_OBJECT_KIT_VERSION,
    seed: options.seed ?? "layered-objects",
    archetypes: byId(asList(options.archetypes)),
    layers: byId(layers),
    objects: {},
    roots: [],
    stateLayersByObjectId: {},
    stats: { spawned: 0, removed: 0, attached: 0, pruned: 0, stateChanges: 0 }
  };
}

const vec = (input = {}) => ({ x: number(input.x), y: number(input.y), z: number(input.z), w: number(input.w, 1), h: number(input.h, 1), d: number(input.d, 1), sx: number(input.sx, 1), sy: number(input.sy, 1), sz: number(input.sz, 1) });

function normalizeLayerEntries(input, kind, fallback = []) {
  return asList(input ?? fallback).map((entry, index) => typeof entry === "string"
    ? { id: entry, kind, order: index }
    : { id: entry.id ?? `${kind}-${index + 1}`, kind: entry.kind ?? kind, order: number(entry.order, index), ...entry });
}

function normalizeObject(input = {}, context = {}) {
  const meshLayers = normalizeLayerEntries(input.meshLayers ?? input.meshes, "mesh", input.mesh ? [{ id: input.mesh, mesh: input.mesh }] : []);
  const materialLayers = normalizeLayerEntries(input.materialLayers ?? input.materials, "material", input.material || input.visual?.material ? [{ id: input.material ?? input.visual?.material, material: input.material ?? input.visual?.material }] : []);
  const overlayLayers = normalizeLayerEntries(input.overlayLayers ?? input.textureOverlays ?? input.overlays, "textureOverlay");
  const visualStateLayers = normalizeLayerEntries(input.visualStateLayers ?? input.visualStates, "visualState");
  const physicalStateLayers = normalizeLayerEntries(input.physicalStateLayers ?? input.physicalStates ?? input.states, "physicalState");
  return {
    id: input.id ?? stableId("layered-object", context.seed, context.parentId, input.kind, context.index),
    kind: input.kind ?? input.archetype ?? "object",
    archetype: input.archetype ?? input.kind ?? "object",
    proofId: input.proofId ?? input.objectProofId ?? null,
    proofPacket: input.proofPacket ?? input.packetRef ?? input.metadata?.proofPacket ?? null,
    layer: input.layer ?? context.layer ?? "default",
    parentId: input.parentId ?? context.parentId ?? null,
    socket: input.socket ?? null,
    transform: vec(input.transform ?? input),
    sockets: input.sockets ?? {},
    attachments: asList(input.attachments),
    meshLayers,
    materialLayers,
    overlayLayers,
    visualStateLayers,
    physicalStateLayers,
    interaction: input.interaction ?? null,
    interactive: input.interactive ?? Boolean(input.interaction),
    visual: input.visual ?? {},
    batch: input.batch ?? input.batchKey ?? null,
    static: input.static ?? true,
    visible: input.visible ?? true,
    metadata: input.metadata ?? {}
  };
}

function resolveTransform(state, object) {
  const parent = object.parentId ? state.objects[object.parentId] : null;
  const parentWorld = parent ? resolveTransform(state, parent) : { x: 0, y: 0, z: 0 };
  const socket = parent && object.socket ? parent.sockets?.[object.socket] : null;
  const layer = state.layers?.[object.layer];
  return { ...object.transform, x: number(parentWorld.x) + number(socket?.x) + number(object.transform.x), y: number(parentWorld.y) + number(socket?.y) + number(object.transform.y), z: number(parentWorld.z) + number(layer?.depth) + number(socket?.z) + number(object.transform.z) };
}

function mergeArchetype(state, descriptor = {}) {
  const archetype = state.archetypes?.[descriptor.archetype ?? descriptor.kind];
  if (!archetype) return descriptor;
  return {
    ...clone(archetype.defaults ?? {}),
    ...clone(archetype),
    ...descriptor,
    id: descriptor.id,
    attachments: [...asList(archetype.attachments), ...asList(descriptor.attachments)]
  };
}

function addObject(state, descriptor, context = {}) {
  const object = normalizeObject(mergeArchetype(state, descriptor), context);
  state.objects[object.id] = object;
  state.stateLayersByObjectId[object.id] ??= {};
  for (const layer of [...object.visualStateLayers, ...object.physicalStateLayers]) {
    state.stateLayersByObjectId[object.id][layer.id] = { active: layer.active ?? false, ...layer };
  }
  if (!object.parentId && !state.roots.includes(object.id)) state.roots.push(object.id);
  state.stats.spawned += 1;
  object.attachments.forEach((attachment, index) => {
    addObject(state, attachment, { seed: scopedSeed(context.seed, object.id, "attachment", index), parentId: object.id, layer: attachment.layer ?? object.layer, index });
    state.stats.attached += 1;
  });
  return object;
}

function removeObject(state, id, removed = []) {
  if (!state.objects[id]) return removed;
  for (const child of Object.values(state.objects)) if (child.parentId === id) removeObject(state, child.id, removed);
  delete state.objects[id];
  delete state.stateLayersByObjectId[id];
  state.roots = state.roots.filter((root) => root !== id);
  removed.push(id);
  state.stats.removed += 1;
  return removed;
}

function setStateLayer(state, objectId, layerId, payload = {}) {
  const object = state.objects[objectId];
  if (!object) return null;
  state.stateLayersByObjectId[objectId] ??= {};
  const previous = state.stateLayersByObjectId[objectId][layerId] ?? { id: layerId, active: false };
  const next = { ...previous, ...payload, id: layerId, active: payload.active ?? payload.enabled ?? previous.active ?? true };
  state.stateLayersByObjectId[objectId][layerId] = next;
  object.state = { ...(object.state ?? {}), [layerId]: next.active };
  object.metadata = { ...(object.metadata ?? {}), activeStateLayerIds: Object.entries(state.stateLayersByObjectId[objectId]).filter(([, value]) => value.active !== false).map(([id]) => id) };
  state.stats.stateChanges += 1;
  return next;
}

function objectAssemblyDescriptor(state, object) {
  const stateLayers = state.stateLayersByObjectId[object.id] ?? {};
  const layerEntries = [
    ...object.meshLayers,
    ...object.materialLayers,
    ...object.overlayLayers,
    ...object.visualStateLayers,
    ...object.physicalStateLayers
  ];
  return {
    id: object.id,
    kind: object.kind,
    archetype: object.archetype,
    proofId: object.proofId,
    proofPacket: object.proofPacket,
    worldTransform: resolveTransform(state, object),
    sockets: clone(object.sockets),
    layers: layerEntries.map(clone),
    activeStateLayers: clone(stateLayers),
    descriptorShape: {
      layerKinds: OBJECT_LAYER_KINDS,
      meshLayerCount: object.meshLayers.length,
      materialLayerCount: object.materialLayers.length,
      overlayLayerCount: object.overlayLayers.length,
      stateLayerCount: Object.keys(stateLayers).length
    }
  };
}

function snapshot(state) {
  const objects = Object.values(state.objects).map((object) => ({ ...clone(object), worldTransform: resolveTransform(state, object), assembly: objectAssemblyDescriptor(state, object) }));
  const batches = {};
  for (const object of objects) if (object.batch) (batches[[object.layer, object.kind, object.visual?.material, object.batch].join("/")] ??= []).push(object.id);
  return {
    version: state.version,
    seed: state.seed,
    layers: clone(state.layers),
    roots: state.roots.slice(),
    objects,
    assemblies: objects.map((object) => object.assembly),
    interactive: objects.filter((object) => object.interactive || object.interaction),
    batches,
    stats: clone(state.stats)
  };
}

export function createLayeredObjectKit(nexusEngine = {}, options = {}) {
  const { component, resource, event } = createDefinitionFactory(nexusEngine);
  const LayeredObject = component("layeredObject.object");
  const LayeredAttachment = component("layeredObject.attachment");
  const LayeredInteractive = component("layeredObject.interactive");
  const LayeredObjectState = resource("layeredObject.state");
  const LayeredObjectSpawned = event("layeredObject.spawned");
  const LayeredObjectRemoved = event("layeredObject.removed");
  const LayeredObjectAttached = event("layeredObject.attached");
  const LayeredObjectPruned = event("layeredObject.pruned");
  const LayeredObjectStateChanged = event("layeredObject.stateChanged");
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "layered-object-kit",
    components: { LayeredObject, LayeredAttachment, LayeredInteractive },
    resources: { LayeredObjectState },
    events: { LayeredObjectSpawned, LayeredObjectRemoved, LayeredObjectAttached, LayeredObjectPruned, LayeredObjectStateChanged },
    provides: ["layered-object", "object-assembly-descriptors", "object-layer-descriptors", "socket-descriptors", "state-layer-descriptors"],
    initWorld({ world }) { ensureResource(world, LayeredObjectState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, LayeredObjectState, () => createInitialState(options));
      engine.layeredObjects = {
        getState: state,
        registerArchetype(archetype = {}) { const next = state(); const id = archetype.id ?? archetype.kind ?? `archetype-${Object.keys(next.archetypes).length + 1}`; next.archetypes[id] = { id, ...archetype }; world.setResource(LayeredObjectState, next); return next.archetypes[id]; },
        spawn(descriptor = {}) { const next = state(); const object = addObject(next, descriptor, { seed: scopedSeed(next.seed, descriptor.id, Object.keys(next.objects).length) }); world.setResource(LayeredObjectState, next); world.emit(LayeredObjectSpawned, { object }); return object; },
        spawnMany(descriptors = []) { return asList(descriptors).map((descriptor) => this.spawn(descriptor)); },
        attach(parentId, childDescriptor = {}) { const next = state(); const child = addObject(next, { ...childDescriptor, parentId }, { seed: scopedSeed(next.seed, parentId, childDescriptor.id), parentId }); world.setResource(LayeredObjectState, next); world.emit(LayeredObjectAttached, { parentId, child }); return child; },
        remove(objectId) { const next = state(); const removed = removeObject(next, objectId); world.setResource(LayeredObjectState, next); world.emit(LayeredObjectRemoved, { objectId, removed }); return removed; },
        setStateLayer(objectId, layerId, payload = {}) { const next = state(); const stateLayer = setStateLayer(next, objectId, layerId, payload); world.setResource(LayeredObjectState, next); if (stateLayer) world.emit(LayeredObjectStateChanged, { objectId, layerId, stateLayer: clone(stateLayer) }); return stateLayer; },
        setVisualState(objectId, stateId, payload = {}) { return this.setStateLayer(objectId, stateId, { kind: "visualState", ...payload }); },
        setPhysicalState(objectId, stateId, payload = {}) { return this.setStateLayer(objectId, stateId, { kind: "physicalState", ...payload }); },
        pruneBelow(y, opts = {}) { const next = state(); const keep = new Set(asList(opts.keepIds)); const removed = []; for (const object of Object.values(next.objects)) if (!keep.has(object.id) && !object.metadata?.pinned && number(resolveTransform(next, object).y) < number(y)) removeObject(next, object.id, removed); next.stats.pruned += removed.length; world.setResource(LayeredObjectState, next); if (removed.length) world.emit(LayeredObjectPruned, { y, removed }); return removed; },
        queryInteractive: () => snapshot(state()).interactive,
        assembly(objectId) { const object = state().objects[objectId]; return object ? objectAssemblyDescriptor(state(), object) : null; },
        snapshot: () => snapshot(state())
      };
    },
    metadata: { version: LAYERED_OBJECT_KIT_VERSION, purpose: "Bounded object assembly container for layers, sockets, attachments, visual state layers, physical state layers, and batch descriptors." }
  });
}
