import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const INSTANCED_RENDER_KIT_VERSION = "0.2.0";

function materialOf(object = {}) {
  return object.material ?? object.visual?.material ?? object.materialId ?? object.metadata?.material ?? "default";
}

function archetypeOf(object = {}) {
  return object.archetype ?? object.kind ?? object.proofId ?? object.metadata?.proofPacket ?? "default";
}

function batchKeyFor(object = {}) {
  return [
    object.layer ?? object.visual?.layer ?? "instanced-scatter",
    object.kind ?? "object",
    archetypeOf(object),
    materialOf(object),
    object.variant ?? object.metadata?.variant ?? "default",
    object.lod ?? object.metadata?.lod ?? "auto"
  ].join("|");
}

export function batchInstances(objects = []) {
  const batches = {};
  for (const object of asList(objects)) {
    const key = object.batchKey ?? object.batch ?? batchKeyFor(object);
    batches[key] ??= {
      id: key,
      layer: object.layer ?? object.visual?.layer ?? "instanced-scatter",
      kind: object.kind ?? "object",
      archetype: archetypeOf(object),
      material: materialOf(object),
      variant: object.variant ?? object.metadata?.variant ?? "default",
      lod: object.lod ?? object.metadata?.lod ?? "auto",
      proofPacket: object.proofPacket ?? object.metadata?.proofPacket ?? null,
      instances: []
    };
    batches[key].instances.push({
      id: object.id,
      transform: object.transform ?? object.worldTransform ?? {},
      metadata: object.metadata ?? {},
      proofId: object.proofId ?? null,
      patchKey: object.patchKey,
      distanceBand: object.distanceBand ?? object.metadata?.distanceBand ?? "mid"
    });
  }
  return Object.values(batches).map((batch) => ({ ...batch, count: batch.instances.length }));
}

export function summarizeInstanceBatches(batches = []) {
  return {
    batchCount: asList(batches).length,
    instanceCount: asList(batches).reduce((sum, batch) => sum + number(batch.count, asList(batch.instances).length), 0),
    proofPacketCount: new Set(asList(batches).map((batch) => batch.proofPacket).filter(Boolean)).size,
    materialCount: new Set(asList(batches).map((batch) => batch.material).filter(Boolean)).size
  };
}

export function createInstancedRenderKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const InstancedRenderState = resource(options.resourceName ?? "instancedRender.state");
  const InstancedRenderBatchesUpdated = event("instancedRender.batchesUpdated");
  const initial = () => ({ version: INSTANCED_RENDER_KIT_VERSION, batches: [], byPatch: {}, byProofPacket: {}, lod: options.lod ?? true, stats: summarizeInstanceBatches([]) });

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "instanced-render-kit",
    resources: { InstancedRenderState },
    events: { InstancedRenderBatchesUpdated },
    provides: ["instanced-render", "render-batch-descriptors", "instance-batch-descriptors", "batch-key-descriptors"],
    initWorld({ world }) { ensureResource(world, InstancedRenderState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, InstancedRenderState, initial);
      const publish = (next) => { world.setResource(InstancedRenderState, next); world.emit(InstancedRenderBatchesUpdated, { batches: clone(next.batches), stats: clone(next.stats) }); return next.batches.map(clone); };
      engine.instancedRender = {
        getState: state,
        build(objects = []) {
          const next = state();
          next.batches = batchInstances(objects);
          next.byPatch = {};
          next.byProofPacket = {};
          for (const batch of next.batches) {
            if (batch.proofPacket) (next.byProofPacket[batch.proofPacket] ??= []).push(batch.id);
            for (const instance of batch.instances) if (instance.patchKey) (next.byPatch[instance.patchKey] ??= []).push(batch.id);
          }
          next.stats = summarizeInstanceBatches(next.batches);
          return publish(next);
        },
        buildFromScatter() {
          const scatter = engine.scatterPlacement?.snapshot?.()?.byPatch ?? {};
          return this.build(Object.values(scatter).flat());
        },
        buildFromLayeredObjects(filter = {}) {
          const objects = engine.layeredObjects?.snapshot?.()?.objects ?? [];
          const filtered = objects.filter((object) => {
            if (filter.proofPacket && object.proofPacket !== filter.proofPacket && object.metadata?.proofPacket !== filter.proofPacket) return false;
            if (filter.kind && object.kind !== filter.kind) return false;
            return object.batch || object.batchKey || filter.includeUnbatched === true;
          });
          return this.build(filtered);
        },
        clearPatch(patchKey) {
          const next = state();
          next.batches = next.batches.map((batch) => ({ ...batch, instances: batch.instances.filter((instance) => instance.patchKey !== patchKey) })).filter((batch) => batch.instances.length).map((batch) => ({ ...batch, count: batch.instances.length }));
          delete next.byPatch[patchKey];
          next.stats = summarizeInstanceBatches(next.batches);
          return publish(next);
        },
        summarize: () => summarizeInstanceBatches(state().batches),
        snapshot: () => clone(state())
      };
    },
    metadata: { version: INSTANCED_RENDER_KIT_VERSION, purpose: "Renderer-facing instanced batch descriptors grouped by layer, kind, archetype, material, variant, LOD, and proof packet." }
  });
}
