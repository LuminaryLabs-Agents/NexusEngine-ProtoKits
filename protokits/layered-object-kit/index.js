import { asList, byId, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number, scopedSeed, stableId } from "../protokit-core/index.js";

export const LAYERED_OBJECT_KIT_VERSION = "0.0.1";

function createInitialState(options = {}) {
  const layers = asList(options.layers).map((layer, index) => ({ id: layer.id ?? `layer-${index + 1}`, depth: number(layer.depth, index), role: layer.role ?? "generic", visible: layer.visible ?? true, parallax: number(layer.parallax, 1), ...layer }));
  return { version: LAYERED_OBJECT_KIT_VERSION, seed: options.seed ?? "layered-objects", archetypes: byId(asList(options.archetypes)), layers: byId(layers), objects: {}, roots: [], stats: { spawned: 0, removed: 0, attached: 0, pruned: 0 } };
}

const vec = (input = {}) => ({ x: number(input.x), y: number(input.y), z: number(input.z), w: number(input.w, 1), h: number(input.h, 1), d: number(input.d, 1), sx: number(input.sx, 1), sy: number(input.sy, 1), sz: number(input.sz, 1) });

function normalizeObject(input = {}, context = {}) {
  return {
    id: input.id ?? stableId("layered-object", context.seed, context.parentId, input.kind, context.index),
    kind: input.kind ?? input.archetype ?? "object",
    archetype: input.archetype ?? input.kind ?? "object",
    layer: input.layer ?? context.layer ?? "default",
    parentId: input.parentId ?? context.parentId ?? null,
    socket: input.socket ?? null,
    transform: vec(input.transform ?? input),
    sockets: input.sockets ?? {},
    attachments: asList(input.attachments),
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

function addObject(state, descriptor, context = {}) {
  const object = normalizeObject(descriptor, context);
  state.objects[object.id] = object;
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
  state.roots = state.roots.filter((root) => root !== id);
  removed.push(id);
  state.stats.removed += 1;
  return removed;
}

function snapshot(state) {
  const objects = Object.values(state.objects).map((object) => ({ ...clone(object), worldTransform: resolveTransform(state, object) }));
  const batches = {};
  for (const object of objects) if (object.batch) (batches[[object.layer, object.kind, object.visual?.material, object.batch].join("/")] ??= []).push(object.id);
  return { version: state.version, seed: state.seed, layers: clone(state.layers), roots: state.roots.slice(), objects, interactive: objects.filter((object) => object.interactive || object.interaction), batches, stats: clone(state.stats) };
}

export function createLayeredObjectKit(nexusRealtime = {}, options = {}) {
  const { component, resource, event } = createDefinitionFactory(nexusRealtime);
  const LayeredObject = component("layeredObject.object");
  const LayeredAttachment = component("layeredObject.attachment");
  const LayeredInteractive = component("layeredObject.interactive");
  const LayeredObjectState = resource("layeredObject.state");
  const LayeredObjectSpawned = event("layeredObject.spawned");
  const LayeredObjectRemoved = event("layeredObject.removed");
  const LayeredObjectAttached = event("layeredObject.attached");
  const LayeredObjectPruned = event("layeredObject.pruned");
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "layered-object-kit",
    components: { LayeredObject, LayeredAttachment, LayeredInteractive },
    resources: { LayeredObjectState },
    events: { LayeredObjectSpawned, LayeredObjectRemoved, LayeredObjectAttached, LayeredObjectPruned },
    provides: ["layered-object"],
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
        pruneBelow(y, opts = {}) { const next = state(); const keep = new Set(asList(opts.keepIds)); const removed = []; for (const object of Object.values(next.objects)) if (!keep.has(object.id) && !object.metadata?.pinned && number(resolveTransform(next, object).y) < number(y)) removeObject(next, object.id, removed); next.stats.pruned += removed.length; world.setResource(LayeredObjectState, next); if (removed.length) world.emit(LayeredObjectPruned, { y, removed }); return removed; },
        queryInteractive: () => snapshot(state()).interactive,
        snapshot: () => snapshot(state())
      };
    },
    metadata: { version: LAYERED_OBJECT_KIT_VERSION, purpose: "Layered objects, sockets, attachments, pruning, and batch descriptors." }
  });
}
