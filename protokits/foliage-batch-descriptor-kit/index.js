import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FOLIAGE_BATCH_DESCRIPTOR_KIT_VERSION = "0.1.0";

export function createFoliageBatchDescriptorState(options = {}) { return { version: FOLIAGE_BATCH_DESCRIPTOR_KIT_VERSION, batches: [], fallbacks: [], requests: [], policy: { near: number(options.near, 58), mid: number(options.mid, 150), far: number(options.far, 275) } }; }
function d2(a = {}, b = {}) { return Math.hypot(number(a.x) - number(b.x), number(a.z ?? a.y) - number(b.z ?? b.y)); }
function fallbackLod(instance = {}, viewer = {}, policy = {}) { const d = d2(instance.position ?? instance, viewer.position ?? viewer); return d < policy.near ? "lod0" : d < policy.mid ? "lod1" : d < policy.far ? "lod2" : "impostor"; }

export function buildFoliageBatches(instances = [], viewer = {}, engine = {}, state = createFoliageBatchDescriptorState()) {
  const batches = new Map(); const fallbacks = []; const requests = [];
  for (const instance of asList(instances)) {
    const asset = engine.objaverseCatalog?.get?.(instance.assetId) ?? instance;
    const selection = engine.objectLodPolicy?.select?.(asset, viewer, { position: instance.position }) ?? { assetId: instance.assetId, lod: fallbackLod(instance, viewer, state.policy), renderMode: "mesh", url: asset.mesh ?? asset.url ?? null };
    if (selection.renderMode === "culled") continue;
    const ready = selection.renderMode === "impostor" || !selection.assetId ? false : engine.objectResidency?.isReady?.(selection.assetId, selection.lod);
    if (!ready && selection.renderMode === "mesh") { engine.objectMeshRequest?.requestForInstance?.(instance, selection); requests.push({ instanceId: instance.id, assetId: selection.assetId, lod: selection.lod }); }
    const mode = ready ? "mesh" : selection.renderMode === "impostor" ? "impostor" : "fallback";
    if (mode === "fallback") fallbacks.push(instance.id);
    const material = engine.objectMaterialVariant?.describe?.(asset, instance) ?? { slots: {}, tint: null };
    const wind = engine.windResponse?.foliage?.(instance, instance.partName ?? instance.kind) ?? null;
    const key = `${mode}:${instance.kind ?? "foliage"}:${selection.assetId ?? instance.kind}:${selection.lod ?? "fallback"}`;
    if (!batches.has(key)) batches.set(key, { id: key, mode, kind: instance.kind ?? "foliage", assetId: selection.assetId ?? null, lod: selection.lod ?? null, url: selection.url ?? null, count: 0, material, instances: [] });
    const batch = batches.get(key);
    batch.instances.push({ id: instance.id, position: clone(instance.position ?? instance), rotationY: number(instance.rotationY, 0), scale: number(instance.scale, 1), wind, metadata: clone(instance.metadata ?? {}) });
    batch.count = batch.instances.length;
  }
  return { batches: Array.from(batches.values()), fallbacks, requests };
}

export function createFoliageBatchDescriptorKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "foliageBatchDescriptors.state");
  const Updated = event("foliageBatchDescriptors.updated");
  const initial = () => createFoliageBatchDescriptorState(options);
  return defineInjectedRuntimeKit(nexusEngine, { id: options.id ?? "foliage-batch-descriptor-kit", resources: { State }, events: { Updated }, requires: ["vegetation:placement", "object:lod-policy", "object:residency"], provides: ["render:vegetation-descriptors", "render:foliage-batches"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const api = { getState: state, build(viewer = {}) { const result = buildFoliageBatches(engine.vegetationPlacement?.listInstances?.() ?? [], viewer, engine, state()); const next = { ...state(), ...result }; world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next); }, getBatches() { return clone(state().batches); }, snapshot: () => clone(state()) }; engine.foliageBatchDescriptors = api; engine.vegetationRenderDescriptors ??= api; engine.n ??= {}; engine.n.foliageBatchDescriptors = api; }, metadata: { version: FOLIAGE_BATCH_DESCRIPTOR_KIT_VERSION, purpose: "Foliage batch descriptors using object LOD, material, request, and residency services." } });
}

export default createFoliageBatchDescriptorKit;
