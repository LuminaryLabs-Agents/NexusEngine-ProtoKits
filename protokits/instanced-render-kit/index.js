import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const INSTANCED_RENDER_KIT_VERSION = "0.1.0";

export function batchInstances(objects = []) {
  const batches = {};
  for (const object of asList(objects)) {
    const key = [object.layer ?? "instanced-scatter", object.kind ?? "object", object.archetype ?? "default", object.material ?? "default"].join("|");
    batches[key] ??= { id: key, layer: object.layer ?? "instanced-scatter", kind: object.kind ?? "object", archetype: object.archetype ?? "default", material: object.material ?? "default", instances: [] };
    batches[key].instances.push({ id: object.id, transform: object.transform ?? {}, metadata: object.metadata ?? {}, patchKey: object.patchKey });
  }
  return Object.values(batches).map((batch) => ({ ...batch, count: batch.instances.length }));
}

export function createInstancedRenderKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const InstancedRenderState = resource(options.resourceName ?? "instancedRender.state");
  const InstancedRenderBatchesUpdated = event("instancedRender.batchesUpdated");
  const initial = () => ({ version: INSTANCED_RENDER_KIT_VERSION, batches: [], byPatch: {}, lod: options.lod ?? true });

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "instanced-render-kit",
    resources: { InstancedRenderState },
    events: { InstancedRenderBatchesUpdated },
    provides: ["instanced-render", "render-batch-descriptors"],
    initWorld({ world }) { ensureResource(world, InstancedRenderState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, InstancedRenderState, initial);
      const publish = (next) => { world.setResource(InstancedRenderState, next); world.emit(InstancedRenderBatchesUpdated, { batches: clone(next.batches) }); return next.batches.map(clone); };
      engine.instancedRender = {
        getState: state,
        build(objects = []) {
          const next = state();
          next.batches = batchInstances(objects);
          next.byPatch = {};
          for (const batch of next.batches) for (const instance of batch.instances) if (instance.patchKey) (next.byPatch[instance.patchKey] ??= []).push(batch.id);
          return publish(next);
        },
        buildFromScatter() {
          const scatter = engine.scatterPlacement?.snapshot?.()?.byPatch ?? {};
          return this.build(Object.values(scatter).flat());
        },
        clearPatch(patchKey) {
          const next = state();
          next.batches = next.batches.map((batch) => ({ ...batch, instances: batch.instances.filter((instance) => instance.patchKey !== patchKey) })).filter((batch) => batch.instances.length).map((batch) => ({ ...batch, count: batch.instances.length }));
          delete next.byPatch[patchKey];
          return publish(next);
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: INSTANCED_RENDER_KIT_VERSION, purpose: "Renderer-facing instanced batch descriptors grouped by layer, kind, archetype, and material." }
  });
}
