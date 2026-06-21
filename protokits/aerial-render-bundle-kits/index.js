import { defineInjectedRuntimeKit, number, hashString } from "../foundation-kit/index.js";

export const AERIAL_RENDER_BUNDLE_KITS_VERSION = "0.1.0";
export const RENDER_SCENE_PROFILE_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const RENDER_MEMORY_BUDGET_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const PERSPECTIVE_LOD_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const STATIC_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const INSTANCE_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const RENDER_BUNDLE_LIFECYCLE_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const ASYNC_RENDER_BUILD_QUEUE_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const TERRAIN_WORKER_SAMPLER_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const PROP_ARCHETYPE_GEOMETRY_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;
export const PROCEDURAL_SKY_DOMAIN_KIT_VERSION = AERIAL_RENDER_BUNDLE_KITS_VERSION;

const VALID_PHASES = new Set(["input", "simulate", "resolve", "cleanup"]);
const clone = (v) => v == null ? v : JSON.parse(JSON.stringify(v));
const clamp = (v, min, max) => Math.max(min, Math.min(max, number(v)));
const arr = (v) => Array.isArray(v) ? v : v == null ? [] : [v];
const phase = (p, f = "simulate") => { const v = String(p ?? f); if (v === "post" || v === "render") return "cleanup"; return VALID_PHASES.has(v) ? v : f; };
function defineResource(N, name) { return typeof N.defineResource === "function" ? N.defineResource(name) : `resource:${name}`; }
function defineEvent(N, name) { return typeof N.defineEvent === "function" ? N.defineEvent(name) : `event:${name}`; }
function dist3(a = {}, b = {}) { return Math.hypot(number(a.x) - number(b.x), number(a.y) - number(b.y), number(a.z) - number(b.z)); }
function norm3(v = {}, fb = { x: 0, y: 0, z: 1 }) { const l = Math.hypot(number(v.x), number(v.y), number(v.z)); return l > 1e-6 ? { x: number(v.x) / l, y: number(v.y) / l, z: number(v.z) / l } : { ...fb }; }
function sub3(a = {}, b = {}) { return { x: number(a.x) - number(b.x), y: number(a.y) - number(b.y), z: number(a.z) - number(b.z) }; }
function dot3(a = {}, b = {}) { return number(a.x) * number(b.x) + number(a.y) * number(b.y) + number(a.z) * number(b.z); }
function hexHash(value) { return Math.abs(hashString(JSON.stringify(value))).toString(36); }
function patchBounds(p = {}) { const size = number(p.size, 768); const cx = number(p.center?.x, number(p.px) * size); const cz = number(p.center?.z, number(p.pz) * size); return { center: { x: cx, y: 0, z: cz }, radius: Math.max(size * 0.72, 1), size }; }
function lodRank(lod = "near") { return lod === "near" ? 0 : lod === "mid" ? 1 : lod === "far" ? 2 : 3; }
function minLod(a, b) { return lodRank(a) >= lodRank(b) ? a : b; }
function patchIdOf(d = {}) { return d.patchId ?? d.patch ?? d.sourcePatchId ?? d.chunkId ?? (d.id ? String(d.id).split(":").slice(0, 2).join(":") : "global"); }

export function createRenderSceneProfileDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "renderSceneProfile.state");
  const SetProfile = defineEvent(NexusRealtime, "renderSceneProfile.setProfile");
  const profiles = {
    "macbook-air-cel": { id: "macbook-air-cel", dprCap: 1.15, terrainTier: "standard", objectDensity: 0.72, vegetationDensity: 0.46, cloudDensity: 0.42, maxWorkers: 2, asyncBuilds: true, staticBatching: true, skyProfile: "bright-hdr-canyon", outlinePolicy: "plane-and-landmarks" },
    "standard-cel-canyon": { id: "standard-cel-canyon", dprCap: 1.25, terrainTier: "standard", objectDensity: 0.82, vegetationDensity: 0.55, cloudDensity: 0.5, maxWorkers: 2, asyncBuilds: true, staticBatching: true, skyProfile: "bright-hdr-canyon", outlinePolicy: "plane-and-landmarks" },
    "high-cel-canyon": { id: "high-cel-canyon", dprCap: 1.45, terrainTier: "high", objectDensity: 1.0, vegetationDensity: 0.72, cloudDensity: 0.65, maxWorkers: 3, asyncBuilds: true, staticBatching: true, skyProfile: "bright-hdr-canyon", outlinePolicy: "plane-and-landmarks" },
    "low-mobile-cel-canyon": { id: "low-mobile-cel-canyon", dprCap: 1, terrainTier: "low", objectDensity: 0.45, vegetationDensity: 0.24, cloudDensity: 0.25, maxWorkers: 1, asyncBuilds: false, staticBatching: true, skyProfile: "simple-canyon", outlinePolicy: "plane-only" },
    ...(config.profiles ?? {})
  };
  function initial() { const profileId = config.defaultProfileId ?? "macbook-air-cel"; return { id: config.id ?? "render-scene-profile", version: RENDER_SCENE_PROFILE_DOMAIN_KIT_VERSION, profileId, profile: profiles[profileId] ?? profiles["macbook-air-cel"], profiles, frame: 0 }; }
  function system(world) { let state = clone(world.getResource(State) ?? initial()); for (const e of world.readEvents(SetProfile)) { const id = e.id ?? e.profileId; if (profiles[id]) state = { ...state, profileId: id, profile: profiles[id] }; } world.setResource(State, { ...state, frame: number(world.__nexusClock?.frame, 0) }); }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "render-scene-profile-domain-kit", provides: ["render:scene-profile", "render:quality-profile"], resources: { State }, events: { SetProfile }, systems: [{ phase: phase(config.phase, "input"), name: "renderSceneProfileSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engine.renderSceneProfile = { getState: () => world.getResource(State), getProfile: () => world.getResource(State)?.profile ?? profiles["macbook-air-cel"], setProfile(id) { world.emit(SetProfile, { id }); return world.getResource(State); } }; }, metadata: { version: RENDER_SCENE_PROFILE_DOMAIN_KIT_VERSION, domain: "render-scene-profile", purpose: "Composes a MacBook-Air-friendly scene quality profile: DPR, object density, worker count, batching and sky policy." } });
}

export function createRenderMemoryBudgetDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "renderMemoryBudget.state");
  let engineRef = null;
  function system(world) {
    const bundles = engineRef?.renderBundleLifecycle?.getState?.()?.bundles ?? {};
    const profile = engineRef?.renderSceneProfile?.getProfile?.() ?? {};
    const activeBundles = Object.keys(bundles).length;
    const estimatedGeometryMb = activeBundles * number(config.mbPerBundle, 1.65);
    const budgetMb = number(config.budgetMb, profile.terrainTier === "high" ? 384 : 256);
    const pressure = estimatedGeometryMb > budgetMb * 0.88 ? "critical" : estimatedGeometryMb > budgetMb * 0.68 ? "warning" : "normal";
    const evictPatchIds = Object.values(bundles).filter((b) => b.canEvict || (pressure !== "normal" && !b.visible && lodRank(b.effectiveLod) >= 2)).map((b) => b.patchId).slice(0, pressure === "critical" ? 24 : 8);
    world.setResource(State, { id: config.id ?? "render-memory-budget", version: RENDER_MEMORY_BUDGET_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), budgetMb, estimatedGeometryMb, estimatedTextureMb: number(config.estimatedTextureMb, 32), estimatedWorkerBufferMb: number(config.estimatedWorkerBufferMb, 24), activeBundles, pressure, evictPatchIds, degradeLod: pressure === "critical" });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "render-memory-budget-domain-kit", provides: ["render:memory-budget", "render:bundle-eviction-policy", "render:quality-pressure"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "renderMemoryBudgetSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "render-memory-budget", version: RENDER_MEMORY_BUDGET_DOMAIN_KIT_VERSION, pressure: "normal", budgetMb: number(config.budgetMb, 256), estimatedGeometryMb: 0, evictPatchIds: [], frame: 0 }); }, install({ engine, world }) { engineRef = engine; engine.renderMemoryBudget = { getState: () => world.getResource(State), getPressure: () => world.getResource(State)?.pressure ?? "normal" }; }, metadata: { version: RENDER_MEMORY_BUDGET_DOMAIN_KIT_VERSION, domain: "render-memory-budget", purpose: "Render memory pressure and evict/degrade policy descriptors." } });
}

export function createPerspectiveLodDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "perspectiveLod.state");
  let engineRef = null;
  function lodFromScreen(size) { return size > number(config.nearScreenSize, 0.12) ? "near" : size > number(config.midScreenSize, 0.045) ? "mid" : size > number(config.farScreenSize, 0.012) ? "far" : "culled"; }
  function radiusLod(distance) { return distance < number(config.nearDistance, 1500) ? "near" : distance < number(config.midDistance, 4000) ? "mid" : distance < number(config.farDistance, 8000) ? "far" : "horizon"; }
  function system(world) {
    const patches = engineRef?.aerialPatchWindow?.getPatches?.() ?? [];
    const body = engineRef?.poweredAerialFlight?.getBody?.();
    const cam = engineRef?.aerialCameraRig?.getDescriptor?.();
    const cameraPos = cam?.position ?? body?.position ?? { x: 0, y: 0, z: 0 };
    const look = cam?.lookAt ?? { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z + 1 };
    const fwd = norm3(sub3(look, cameraPos));
    const fovRad = (number(cam?.fov, 64) * Math.PI) / 180;
    const memory = engineRef?.renderMemoryBudget?.getState?.();
    const activeContract = engineRef?.contractBoard?.getActiveContract?.();
    const patchLod = {}; let visible = 0, culled = 0; const counts = { near: 0, mid: 0, far: 0, horizon: 0, culled: 0 };
    for (const patch of patches) {
      const bounds = patchBounds(patch);
      const toPatch = sub3(bounds.center, cameraPos);
      const distance = Math.max(1, Math.hypot(toPatch.x, toPatch.y, toPatch.z));
      const facing = dot3(norm3(toPatch), fwd);
      const inFront = facing > number(config.behindCullDot, -0.25);
      const screenSize = bounds.radius / distance / Math.tan(fovRad / 2);
      const rlod = radiusLod(distance);
      const plod = inFront ? lodFromScreen(screenSize) : "culled";
      let effectiveLod = minLod(rlod, plod);
      const contractDistance = activeContract?.destination ? dist3(activeContract.destination, bounds.center) : Infinity;
      const important = contractDistance < bounds.radius * 1.4;
      if (important && effectiveLod === "culled") effectiveLod = "far";
      if (important && effectiveLod === "horizon") effectiveLod = "far";
      if (memory?.degradeLod && !important && effectiveLod === "near") effectiveLod = "mid";
      const routeAhead = body?.position ? Math.max(0, (bounds.center.z - number(body.position.z)) / Math.max(1, number(config.routeAheadDistance, 5000))) : 0;
      const priority = (inFront ? 0.4 : 0) + clamp(screenSize * 3, 0, 0.35) + (important ? 0.35 : 0) + clamp(routeAhead, 0, 0.2) - clamp(distance / 10000, 0, 0.25);
      const isVisible = effectiveLod !== "culled";
      counts[effectiveLod] = (counts[effectiveLod] ?? 0) + 1;
      if (isVisible) visible += 1; else culled += 1;
      patchLod[patch.id] = { patchId: patch.id, radiusLod: rlod, perspectiveLod: plod, effectiveLod, visible: isVisible, distance, screenSize, priority, important, reason: [inFront ? "front" : "behind", important ? "important" : "normal", memory?.pressure ?? "normal"] };
    }
    world.setResource(State, { id: config.id ?? "perspective-lod", version: PERSPECTIVE_LOD_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), patchLod, objectLod: {}, stats: { visiblePatches: visible, culledPatches: culled, counts } });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "perspective-lod-domain-kit", requires: ["world:patch-window", "camera:state", "aerial:body", "render:terrain-resolution-policy", "render:memory-budget"], provides: ["render:effective-lod", "render:perspective-lod", "render:patch-priority"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "perspectiveLodSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "perspective-lod", version: PERSPECTIVE_LOD_DOMAIN_KIT_VERSION, patchLod: {}, stats: {}, frame: 0 }); }, install({ engine, world }) { engineRef = engine; engine.perspectiveLod = { getState: () => world.getResource(State), getPatchLod: (id) => world.getResource(State)?.patchLod?.[id] ?? null }; }, metadata: { version: PERSPECTIVE_LOD_DOMAIN_KIT_VERSION, domain: "perspective-lod", purpose: "Perspective and radius LOD, visibility and patch priority descriptors." } });
}

export function createStaticBatchDescriptorDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "staticBatchDescriptor.state");
  let engineRef = null;
  function system(world) {
    const lod = engineRef?.perspectiveLod?.getState?.()?.patchLod ?? {};
    const sources = [...(engineRef?.geologyProps?.getDescriptors?.() ?? []), ...(engineRef?.aerialProceduralObjects?.getDescriptors?.() ?? [])].filter((d) => d.kind !== "objective" && d.kind !== "atmosphere" && d.kind !== "weather");
    const byPatch = {};
    for (const d of sources) {
      const patchId = patchIdOf(d); const info = lod[patchId]; if (info?.effectiveLod === "culled") continue;
      const family = d.kind === "landmark" ? "landmark" : d.kind === "structure" ? "structure" : d.kind === "geology" ? "geology" : "static";
      const materialKey = d.materialId ?? `${family}.toon`;
      const key = `${family}|${materialKey}|${info?.effectiveLod ?? d.lod ?? "near"}`;
      byPatch[patchId] ??= { patchId, revisionParts: [], groups: {} };
      byPatch[patchId].groups[key] ??= { id: `static:${patchId}:${key}`, mode: "merge-static", patchId, geometryFamily: family, materialKey, effectiveLod: info?.effectiveLod ?? d.lod ?? "near", descriptors: [] };
      byPatch[patchId].groups[key].descriptors.push({ id: d.id, archetypeId: d.meshId ?? d.type ?? family, position: d.position, rotation: d.rotation ?? {}, scale: d.scale ?? { x: d.radius ?? 1, y: d.height ?? 1, z: d.radius ?? 1 }, color: d.color, lod: d.lod });
      byPatch[patchId].revisionParts.push(d.id, d.type, d.materialId, d.lod);
    }
    const patchBatches = {};
    for (const [patchId, entry] of Object.entries(byPatch)) patchBatches[patchId] = { patchId, revision: hexHash(entry.revisionParts), groups: Object.values(entry.groups) };
    world.setResource(State, { id: config.id ?? "static-batch-descriptor", version: STATIC_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), patchBatches, dirtyPatchIds: Object.keys(patchBatches), stats: { patches: Object.keys(patchBatches).length, descriptors: sources.length } });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "static-batch-descriptor-domain-kit", requires: ["world:patch-window", "render:effective-lod", "terrain:material-descriptors", "biome:transition"], provides: ["render:static-batch-descriptors", "render:static-batch-revisions"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "staticBatchDescriptorSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "static-batch-descriptor", version: STATIC_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION, patchBatches: {}, dirtyPatchIds: [], stats: {}, frame: 0 }); }, install({ engine, world }) { engineRef = engine; engine.staticBatchDescriptors = { getState: () => world.getResource(State), getPatchBatch: (id) => world.getResource(State)?.patchBatches?.[id] ?? null }; }, metadata: { version: STATIC_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION, domain: "static-batch-descriptor", purpose: "Groups static geology, structure and wreck descriptors into mergeable patch batch descriptors." } });
}

export function createInstanceBatchDescriptorDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "instanceBatchDescriptor.state");
  let engineRef = null;
  function system(world) {
    const lod = engineRef?.perspectiveLod?.getState?.()?.patchLod ?? {};
    const vegetation = engineRef?.aerialVegetationPlacement?.getDescriptors?.() ?? [];
    const clouds = engineRef?.cloudBanks?.getDescriptors?.() ?? [];
    const markers = engineRef?.worldMarkers?.getDescriptors?.() ?? [];
    const all = [
      ...vegetation.map((d) => ({ ...d, family: "vegetation", geometryKey: d.meshId ?? "tree", materialKey: d.materialId ?? "tree.toon" })),
      ...clouds.map((d) => ({ ...d, family: "cloud", geometryKey: "cloud.puff", materialKey: d.materialId ?? "cloud.toon" })),
      ...markers.map((d) => ({ ...d, family: "marker", geometryKey: "marker.diamond", materialKey: d.materialId ?? "marker.amber", patchId: "markers" }))
    ];
    const byPatch = {};
    for (const d of all) {
      const patchId = patchIdOf(d); const info = lod[patchId]; if (info?.effectiveLod === "culled") continue;
      const effectiveLod = info?.effectiveLod ?? d.lod ?? "near";
      const key = `${d.geometryKey}|${d.materialKey}|${effectiveLod}`;
      byPatch[patchId] ??= { patchId, revisionParts: [], groups: {} };
      byPatch[patchId].groups[key] ??= { id: `instance:${patchId}:${key}`, mode: "instance-static", patchId, geometryKey: d.geometryKey, materialKey: d.materialKey, effectiveLod, count: 0, instances: [] };
      byPatch[patchId].groups[key].instances.push({ sourceId: d.id, position: d.position, rotation: d.rotation ?? {}, scale: { x: d.trunkRadius ?? d.size ?? d.radius ?? 1, y: d.height ?? d.size ?? 1, z: d.trunkRadius ?? d.size ?? d.radius ?? 1 }, color: d.color });
      byPatch[patchId].groups[key].count += 1; byPatch[patchId].revisionParts.push(d.id, d.geometryKey, d.materialKey, effectiveLod);
    }
    const patchBatches = {}; for (const [patchId, entry] of Object.entries(byPatch)) patchBatches[patchId] = { patchId, revision: hexHash(entry.revisionParts), groups: Object.values(entry.groups) };
    world.setResource(State, { id: config.id ?? "instance-batch-descriptor", version: INSTANCE_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), patchBatches, dirtyPatchIds: Object.keys(patchBatches), stats: { patches: Object.keys(patchBatches).length, descriptors: all.length } });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "instance-batch-descriptor-domain-kit", requires: ["render:effective-lod"], provides: ["render:instance-batch-descriptors", "render:instance-batch-revisions"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "instanceBatchDescriptorSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "instance-batch-descriptor", version: INSTANCE_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION, patchBatches: {}, dirtyPatchIds: [], stats: {}, frame: 0 }); }, install({ engine, world }) { engineRef = engine; engine.instanceBatchDescriptors = { getState: () => world.getResource(State), getPatchBatch: (id) => world.getResource(State)?.patchBatches?.[id] ?? null }; }, metadata: { version: INSTANCE_BATCH_DESCRIPTOR_DOMAIN_KIT_VERSION, domain: "instance-batch-descriptor", purpose: "Groups repeated vegetation, cloud and marker descriptors into patch-owned instance batches." } });
}

export function createRenderBundleLifecycleDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "renderBundleLifecycle.state");
  let engineRef = null;
  function system(world) {
    const previous = world.getResource(State)?.bundles ?? {};
    const patches = engineRef?.aerialPatchWindow?.getPatches?.() ?? [];
    const lod = engineRef?.perspectiveLod?.getState?.()?.patchLod ?? {};
    const staticBatches = engineRef?.staticBatchDescriptors?.getState?.()?.patchBatches ?? {};
    const instanceBatches = engineRef?.instanceBatchDescriptors?.getState?.()?.patchBatches ?? {};
    const terrainRes = engineRef?.terrainResolution?.getPolicy?.() ?? { near: 56, mid: 28, far: 12 };
    const materialState = engineRef?.terrainMaterials?.getState?.();
    const memory = engineRef?.renderMemoryBudget?.getState?.();
    const bundles = {}; const dirtyBundleIds = [], readyBundleIds = [], queuedBundleIds = [];
    for (const patch of patches) {
      const info = lod[patch.id]; if (info?.effectiveLod === "culled") continue;
      const effectiveLod = info?.effectiveLod ?? patch.lod ?? "near";
      const segments = terrainRes[effectiveLod] ?? terrainRes.near ?? 56;
      const terrainMat = materialState?.patchMaterials?.[patch.id];
      const terrainRevision = `${patch.revision ?? patch.id}|lod:${effectiveLod}|seg:${segments}|mat:${terrainMat?.id ?? terrainMat?.biomeId ?? patch.material ?? "default"}`;
      const staticRevision = staticBatches[patch.id]?.revision ?? "static:none";
      const instanceRevision = instanceBatches[patch.id]?.revision ?? "instance:none";
      const materialRevision = terrainMat?.id ?? terrainMat?.biomeId ?? patch.material ?? "default";
      const revision = `${terrainRevision}|${staticRevision}|${instanceRevision}|${materialRevision}`;
      const old = previous[`bundle:${patch.id}`]; const dirty = old?.revision !== revision;
      const status = dirty ? "queued" : old?.status ?? "ready";
      const bundle = { id: `bundle:${patch.id}`, patchId: patch.id, patch, effectiveLod, visible: info?.visible !== false, priority: number(info?.priority, 0.5), revision, terrainRevision, staticRevision, instanceRevision, materialRevision, status, stale: dirty && old?.status === "ready", canEvict: Boolean(memory?.evictPatchIds?.includes?.(patch.id)) || (info?.visible === false && lodRank(effectiveLod) >= 2), terrain: { buildJobId: `terrain:${patch.id}:${hexHash(terrainRevision)}`, revision: terrainRevision, segments, materialKey: terrainMat?.id ?? `terrain.${patch.material ?? effectiveLod}`, status }, staticBatches: staticBatches[patch.id]?.groups ?? [], instanceBatches: instanceBatches[patch.id]?.groups ?? [], dynamicRefs: [], lifecycle: { state: status, lastTouchedFrame: number(world.__nexusClock?.frame, 0), canEvict: false, stale: dirty && old?.status === "ready" } };
      bundles[bundle.id] = bundle; if (dirty) dirtyBundleIds.push(bundle.id); if (status === "ready") readyBundleIds.push(bundle.id); else queuedBundleIds.push(bundle.id);
    }
    const wanted = new Set(Object.values(bundles).map((b) => b.id));
    const removedBundleIds = Object.keys(previous).filter((id) => !wanted.has(id));
    world.setResource(State, { id: config.id ?? "render-bundle-lifecycle", version: RENDER_BUNDLE_LIFECYCLE_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), bundles, dirtyBundleIds, removedBundleIds, readyBundleIds, queuedBundleIds, stats: { total: Object.keys(bundles).length, visible: Object.values(bundles).filter((b) => b.visible).length, dirty: dirtyBundleIds.length, removed: removedBundleIds.length, ready: readyBundleIds.length, queued: queuedBundleIds.length, evictable: Object.values(bundles).filter((b) => b.canEvict).length } });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "render-bundle-lifecycle-domain-kit", requires: ["world:patch-window", "render:effective-lod", "render:terrain-resolution-policy", "terrain:material-descriptors"], provides: ["render:patch-bundles", "render:bundle-dirty-set", "render:bundle-removal-set", "render:bundle-lifecycle"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "renderBundleLifecycleSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "render-bundle-lifecycle", version: RENDER_BUNDLE_LIFECYCLE_DOMAIN_KIT_VERSION, bundles: {}, dirtyBundleIds: [], removedBundleIds: [], stats: {}, frame: 0 }); }, install({ engine, world }) { engineRef = engine; engine.renderBundleLifecycle = { getState: () => world.getResource(State), getBundles: () => Object.values(world.getResource(State)?.bundles ?? {}), getBundle: (id) => world.getResource(State)?.bundles?.[id] ?? null }; }, metadata: { version: RENDER_BUNDLE_LIFECYCLE_DOMAIN_KIT_VERSION, domain: "render-bundle-lifecycle", purpose: "Patch render bundle lifecycle, dirty/removal sets, revisions and render work contracts." } });
}

export function createAsyncRenderBuildQueueDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "asyncRenderBuildQueue.state");
  const Complete = defineEvent(NexusRealtime, "asyncRenderBuildQueue.complete");
  const Fail = defineEvent(NexusRealtime, "asyncRenderBuildQueue.fail");
  let engineRef = null;
  function initial() { return { id: config.id ?? "async-render-build-queue", version: ASYNC_RENDER_BUILD_QUEUE_DOMAIN_KIT_VERSION, pending: [], inFlight: {}, completed: {}, cancelled: {}, stats: { queued: 0, inFlight: 0, completedThisFrame: 0, cancelledThisFrame: 0, avgWorkerMs: 0, avgUploadMs: 0 }, frame: 0 }; }
  function system(world) {
    const state = clone(world.getResource(State) ?? initial()); state.stats.completedThisFrame = 0; state.stats.cancelledThisFrame = 0;
    for (const e of world.readEvents(Complete)) { state.completed[e.id] = e; delete state.inFlight[e.id]; state.stats.completedThisFrame += 1; }
    for (const e of world.readEvents(Fail)) { state.completed[e.id] = { ...e, failed: true }; delete state.inFlight[e.id]; }
    const bundles = engineRef?.renderBundleLifecycle?.getState?.(); const existing = new Set([...state.pending.map((j) => j.id), ...Object.keys(state.inFlight), ...Object.keys(state.completed)]);
    for (const id of bundles?.dirtyBundleIds ?? []) { const b = bundles.bundles[id]; if (!b) continue; const jobs = [{ id: b.terrain.buildJobId, type: "terrain-geometry", patchId: b.patchId, priority: b.priority, revision: b.terrain.revision, status: "queued", payloadDescriptor: { patch: b.patch, effectiveLod: b.effectiveLod, segments: b.terrain.segments, materialKey: b.terrain.materialKey } }]; for (const g of b.staticBatches ?? []) jobs.push({ id: `static:${g.id}:${hexHash(g.revision ?? g.descriptors)}`, type: "static-merge-geometry", patchId: b.patchId, priority: b.priority - 0.08, revision: g.revision ?? b.staticRevision, status: "queued", payloadDescriptor: g }); for (const g of b.instanceBatches ?? []) jobs.push({ id: `instance:${g.id}:${hexHash(g.revision ?? g.instances)}`, type: "instance-batch-data", patchId: b.patchId, priority: b.priority - 0.04, revision: g.revision ?? b.instanceRevision, status: "queued", payloadDescriptor: g }); for (const job of jobs) if (!existing.has(job.id)) { state.pending.push(job); existing.add(job.id); } }
    const removed = new Set(bundles?.removedBundleIds?.map((id) => id.replace(/^bundle:/, "")) ?? []); if (removed.size) { state.pending = state.pending.filter((j) => { if (removed.has(j.patchId)) { state.cancelled[j.id] = j; state.stats.cancelledThisFrame += 1; return false; } return true; }); }
    state.pending.sort((a, b) => number(b.priority) - number(a.priority)); const maxPending = number(config.maxPending, 96); state.pending = state.pending.slice(0, maxPending);
    state.stats.queued = state.pending.length; state.stats.inFlight = Object.keys(state.inFlight).length; state.frame = number(world.__nexusClock?.frame, 0); world.setResource(State, state);
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "async-render-build-queue-domain-kit", requires: ["render:patch-bundles", "render:memory-budget"], provides: ["render:async-build-queue", "render:terrain-build-jobs", "render:static-batch-build-jobs", "render:worker-budget"], resources: { State }, events: { Complete, Fail }, systems: [{ phase: phase(config.phase, "cleanup"), name: "asyncRenderBuildQueueSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engineRef = engine; engine.asyncRenderBuildQueue = { getState: () => world.getResource(State), getNextJobs(max = 2) { const s = world.getResource(State) ?? initial(); const jobs = s.pending.splice(0, max); for (const j of jobs) s.inFlight[j.id] = { ...j, status: "in-flight" }; world.setResource(State, s); return jobs; }, complete(id, meta = {}) { world.emit(Complete, { id, ...meta }); }, fail(id, error = "failed") { world.emit(Fail, { id, error }); }, cancelByPatch(patchId) { const s = world.getResource(State) ?? initial(); s.pending = s.pending.filter((j) => j.patchId !== patchId); world.setResource(State, s); } }; }, metadata: { version: ASYNC_RENDER_BUILD_QUEUE_DOMAIN_KIT_VERSION, domain: "async-render-build-queue", purpose: "Inspectable async render build job queue for terrain, static merge and instance batch data." } });
}

export function createTerrainWorkerSamplerDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "terrainWorkerSampler.state");
  let engineRef = null;
  function buildConfig() { return { seed: config.seed ?? engineRef?.canyonTerrain?.getState?.()?.seed ?? "sky-rogue", terrain: engineRef?.canyonTerrain?.getState?.()?.config ?? {}, materialPalette: engineRef?.terrainMaterials?.getState?.()?.palette ?? {}, strata: engineRef?.terrainStrata?.getState?.()?.params ?? {}, functionVersion: "aerial-canyon-worker-sampler-0.1" }; }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "terrain-worker-sampler-domain-kit", requires: ["terrain:height-sampler", "terrain:material-descriptors", "terrain:strata-sample"], provides: ["render:terrain-worker-sampler", "render:serializable-terrain-config"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "terrainWorkerSamplerSystem", system(world) { world.setResource(State, { id: config.id ?? "terrain-worker-sampler", version: TERRAIN_WORKER_SAMPLER_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), config: buildConfig() }); } }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "terrain-worker-sampler", version: TERRAIN_WORKER_SAMPLER_DOMAIN_KIT_VERSION, config: {}, frame: 0 }); }, install({ engine, world }) { engineRef = engine; engine.terrainWorkerSampler = { getState: () => world.getResource(State), getSerializableConfig: () => world.getResource(State)?.config ?? buildConfig() }; }, metadata: { version: TERRAIN_WORKER_SAMPLER_DOMAIN_KIT_VERSION, domain: "terrain-worker-sampler", purpose: "Serializable terrain, material and strata configuration for worker/raw geometry generation." } });
}

export function createPropArchetypeGeometryDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "propArchetypeGeometry.state");
  const archetypes = { "geology.basalt-teeth": { family: "geology", batchMode: "instance-static", lods: { near: { recipe: "tapered-column-cluster", segments: 8 }, mid: { recipe: "low-column-cluster", segments: 5 }, far: { recipe: "silhouette-column", segments: 3 } } }, "geology.sandstone-arch": { family: "geology", batchMode: "merge-static", lods: { near: { recipe: "arch-composite", segments: 12 }, mid: { recipe: "arch-simple", segments: 7 }, far: { recipe: "arch-silhouette", segments: 4 } } }, "landmark.radio-tower": { family: "structure", batchMode: "merge-static", lods: { near: { recipe: "mast-crossbar-beacon", detail: 1 }, mid: { recipe: "mast-simple", detail: 0.4 }, far: { recipe: "beacon-only", detail: 0.1 } } }, "tree.trunk.pine": { family: "vegetation", batchMode: "instance-static", lods: { near: { recipe: "trunk-tapered", segments: 6 }, mid: { recipe: "trunk-simple", segments: 4 }, far: { recipe: "billboard", segments: 1 } } }, ...(config.archetypes ?? {}) };
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "prop-archetype-geometry-domain-kit", provides: ["render:prop-archetype-geometry", "render:procedural-geometry-recipes"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "propArchetypeGeometrySystem", system(world) { world.setResource(State, { id: config.id ?? "prop-archetype-geometry", version: PROP_ARCHETYPE_GEOMETRY_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), archetypes }); } }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "prop-archetype-geometry", version: PROP_ARCHETYPE_GEOMETRY_DOMAIN_KIT_VERSION, archetypes, frame: 0 }); }, install({ engine, world }) { engine.propArchetypeGeometry = { getState: () => world.getResource(State), getArchetype: (id) => world.getResource(State)?.archetypes?.[id] ?? null }; }, metadata: { version: PROP_ARCHETYPE_GEOMETRY_DOMAIN_KIT_VERSION, domain: "prop-archetype-geometry", purpose: "Procedural prop geometry recipes and LOD variants for static and instanced render batches." } });
}

export function createProceduralSkyDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "proceduralSky.state");
  let engineRef = null;
  function system(world) { const storm = engineRef?.stormFront?.getState?.(); const cel = engineRef?.aerialCelShading?.getState?.(); const intensity = number(storm?.intensity, 0); const sky = { mode: "procedural-hdr-gradient", sunDirection: config.sunDirection ?? { x: -0.35, y: 0.72, z: 0.42 }, sunColor: config.sunColor ?? "#ffe0a0", horizonColor: intensity > 0.35 ? "#6b4d68" : "#ff9b47", zenithColor: intensity > 0.35 ? "#3d3048" : "#7a4dcc", groundColor: intensity > 0.35 ? "#4b3445" : "#8a3f16", exposure: number(cel?.exposure, 1.18), turbidity: 0.55 + intensity * 0.35, stormTint: intensity }; const fog = { color: storm?.atmosphere?.fogColor ?? cel?.sky?.fogColor ?? "#d98a58", near: number(cel?.sky?.fogNear, 600), far: number(cel?.sky?.fogFar, 9000), density: number(storm?.atmosphere?.fogDensity, 0.012) }; world.setResource(State, { id: config.id ?? "procedural-sky", version: PROCEDURAL_SKY_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), sky, fog, ambient: { skyIntensity: 0.85, groundIntensity: 0.45 } }); }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "procedural-sky-domain-kit", requires: ["render:cel-shading-policy"], provides: ["render:procedural-sky", "render:horizon-atmosphere", "render:sky-lighting-descriptor"], resources: { State }, systems: [{ phase: phase(config.phase, "cleanup"), name: "proceduralSkySystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "procedural-sky", version: PROCEDURAL_SKY_DOMAIN_KIT_VERSION, sky: {}, fog: {}, ambient: {}, frame: 0 }); }, install({ engine, world }) { engineRef = engine; engine.proceduralSky = { getState: () => world.getResource(State) }; }, metadata: { version: PROCEDURAL_SKY_DOMAIN_KIT_VERSION, domain: "procedural-sky", purpose: "Procedural HDR-style sky, fog, ambient and horizon descriptors from cel and weather policy." } });
}

export function createAerialRenderBundleDomainKits(NexusRealtime = {}, config = {}) {
  return [
    createRenderSceneProfileDomainKit(NexusRealtime, config.sceneProfile ?? {}),
    createRenderMemoryBudgetDomainKit(NexusRealtime, config.memoryBudget ?? {}),
    createPerspectiveLodDomainKit(NexusRealtime, config.perspectiveLod ?? {}),
    createStaticBatchDescriptorDomainKit(NexusRealtime, config.staticBatches ?? {}),
    createInstanceBatchDescriptorDomainKit(NexusRealtime, config.instanceBatches ?? {}),
    createRenderBundleLifecycleDomainKit(NexusRealtime, config.bundleLifecycle ?? {}),
    createAsyncRenderBuildQueueDomainKit(NexusRealtime, config.asyncQueue ?? {}),
    createTerrainWorkerSamplerDomainKit(NexusRealtime, config.workerSampler ?? {}),
    createPropArchetypeGeometryDomainKit(NexusRealtime, config.propArchetypes ?? {}),
    createProceduralSkyDomainKit(NexusRealtime, config.sky ?? {})
  ];
}

export function collectAerialRenderBundleSnapshot(engine = {}) {
  return { sceneProfile: engine.renderSceneProfile?.getState?.() ?? null, memory: engine.renderMemoryBudget?.getState?.() ?? null, lod: engine.perspectiveLod?.getState?.() ?? null, staticBatches: engine.staticBatchDescriptors?.getState?.() ?? null, instanceBatches: engine.instanceBatchDescriptors?.getState?.() ?? null, bundles: engine.renderBundleLifecycle?.getState?.() ?? null, queue: engine.asyncRenderBuildQueue?.getState?.() ?? null, workerSampler: engine.terrainWorkerSampler?.getState?.() ?? null, archetypes: engine.propArchetypeGeometry?.getState?.() ?? null, sky: engine.proceduralSky?.getState?.() ?? null };
}

export default createAerialRenderBundleDomainKits;
