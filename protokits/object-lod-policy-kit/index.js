import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJECT_LOD_POLICY_KIT_VERSION = "0.1.0";

export function createObjectLodPolicyState(options = {}) {
  return {
    version: OBJECT_LOD_POLICY_KIT_VERSION,
    bands: { near: number(options.near, 45), mid: number(options.mid, 120), far: number(options.far, 260), impostor: number(options.impostor, 520) },
    qualityScale: number(options.qualityScale, 1),
    history: []
  };
}

function distance(asset = {}, viewer = {}, context = {}) {
  const p = context.position ?? asset.position ?? asset;
  const v = viewer.position ?? viewer;
  return Math.hypot(number(p.x, 0) - number(v.x, 0), number(p.z ?? p.y, 0) - number(v.z ?? v.y, 0));
}

export function selectObjectLod(asset = {}, viewer = {}, context = {}, state = createObjectLodPolicyState()) {
  const d = distance(asset, viewer, context);
  const s = Math.max(0.1, state.qualityScale);
  const bands = state.bands;
  let tier = "culled";
  if (d < bands.near * s) tier = "lod0";
  else if (d < bands.mid * s) tier = "lod1";
  else if (d < bands.far * s) tier = "lod2";
  else if (d < bands.impostor * s) tier = "impostor";
  const index = tier === "lod0" ? 0 : tier === "lod1" ? 1 : tier === "lod2" ? 2 : -1;
  const lods = asset.lods ?? asset.urls?.lods ?? [];
  const url = index >= 0 ? lods[index] ?? lods[lods.length - 1] ?? asset.mesh ?? asset.url ?? null : asset.impostor ?? null;
  return { assetId: asset.id ?? asset.assetId ?? null, distance: d, lod: tier, url, renderMode: tier === "impostor" ? "impostor" : tier === "culled" ? "culled" : "mesh", shadowTier: tier === "lod0" ? "full" : tier === "lod1" ? "reduced" : "none", windTier: tier === "lod0" ? "full" : tier === "lod1" ? "medium" : tier === "lod2" ? "low" : "none" };
}

export function createObjectLodPolicyKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "objectLodPolicy.state");
  const Updated = event("objectLodPolicy.updated");
  const Selected = event("objectLodPolicy.selected");
  const initial = () => createObjectLodPolicyState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "object-lod-policy-kit",
    resources: { State },
    events: { Updated, Selected },
    provides: ["object:lod-policy", "asset:lod-selection"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const api = {
        getState: state,
        select(asset = {}, viewer = {}, context = {}) { const selection = selectObjectLod(asset, viewer, context, state()); world.emit?.(Selected, { selection: clone(selection), assetId: selection.assetId }); return selection; },
        set(config = {}) { const next = { ...state(), ...config, bands: { ...state().bands, ...(config.bands ?? {}) } }; world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next); },
        snapshot: () => clone(state())
      };
      engine.objectLodPolicy = api;
      engine.n ??= {};
      engine.n.objectLodPolicy = api;
    },
    metadata: { version: OBJECT_LOD_POLICY_KIT_VERSION, purpose: "Renderer-agnostic object LOD, render mode, shadow tier, and wind tier selection." }
  });
}

export default createObjectLodPolicyKit;
