import { createSeededRandom, defineInjectedRuntimeKit, hashString, number } from "../foundation-kit/index.js";

export const AERIAL_BIOME_FIDELITY_KITS_VERSION = "0.1.0";
export const BIOME_TRANSITION_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const TERRAIN_MATERIAL_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const GEOLOGY_PROP_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const CLOUD_BANK_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const STORM_FRONT_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const AERIAL_CONTRACT_OBJECTIVE_BRIDGE_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const AERIAL_SCAN_LOCK_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const AERIAL_CARGO_STATUS_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;
export const AERIAL_HAZARD_FEEDBACK_DOMAIN_KIT_VERSION = AERIAL_BIOME_FIDELITY_KITS_VERSION;

const VALID_PHASES = new Set(["input", "simulate", "resolve", "cleanup"]);
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalizePhase = (phase, fallback = "simulate") => {
  const value = String(phase ?? fallback);
  if (value === "post" || value === "render") return "cleanup";
  return VALID_PHASES.has(value) ? value : fallback;
};
function defineResource(NexusRealtime, name) { return typeof NexusRealtime.defineResource === "function" ? NexusRealtime.defineResource(name) : `resource:${name}`; }
function defineEvent(NexusRealtime, name) { return typeof NexusRealtime.defineEvent === "function" ? NexusRealtime.defineEvent(name) : `event:${name}`; }
function dist3(a = {}, b = {}) { return Math.hypot(number(a.x) - number(b.x), number(a.y) - number(b.y), number(a.z) - number(b.z)); }
function stableUnit(seed) { return (hashString(seed) % 1000003) / 1000003; }
function mix(a, b, t) { return number(a) + (number(b) - number(a)) * clamp(t, 0, 1); }

export const DEFAULT_AERIAL_CANYON_BIOMES = Object.freeze({
  "red-canyon-floor": { id: "red-canyon-floor", label: "Red Canyon", baseColor: "#8f3f12", ridgeColor: "#d46d21", dustColor: "#bf7a44", fogColor: "#b87852", skyColor: "#d86822", vegetationDensity: 0.25, propBias: { boulder: 0.8, tower: 0.1, wreck: 0.1 }, contracts: { courier: 0.45, race: 0.35, survey: 0.15, combat: 0.05 } },
  "gold-mesa": { id: "gold-mesa", label: "Gold Mesa", baseColor: "#b96521", ridgeColor: "#e7a449", dustColor: "#d49a56", fogColor: "#c9905e", skyColor: "#e08a30", vegetationDensity: 0.38, propBias: { arch: 0.9, tower: 0.45, airfield: 0.15 }, contracts: { survey: 0.38, courier: 0.25, race: 0.2, combat: 0.08 } },
  "black-rock-field": { id: "black-rock-field", label: "Black Rock", baseColor: "#352622", ridgeColor: "#66402d", dustColor: "#53443c", fogColor: "#564039", skyColor: "#6d3a2d", vegetationDensity: 0.08, propBias: { basalt: 0.9, wreck: 0.55, tower: 0.28 }, contracts: { combat: 0.45, salvage: 0.35, courier: 0.08, survey: 0.12 } },
  "high-desert-forest": { id: "high-desert-forest", label: "High Forest", baseColor: "#5f4c2a", ridgeColor: "#826b37", dustColor: "#7f6c48", fogColor: "#a0a675", skyColor: "#bd8f43", vegetationDensity: 1.0, propBias: { tree: 1, camp: 0.35, tower: 0.2 }, contracts: { rescue: 0.3, survey: 0.3, courier: 0.15, race: 0.1 } },
  "dead-tree-slope": { id: "dead-tree-slope", label: "Dead Slope", baseColor: "#57412e", ridgeColor: "#80624a", dustColor: "#6b5c4d", fogColor: "#8a7563", skyColor: "#9a6751", vegetationDensity: 0.42, propBias: { wreck: 0.6, camp: 0.35, boulder: 0.45 }, contracts: { rescue: 0.38, salvage: 0.38, survey: 0.1, combat: 0.12 } },
  "storm-front-zone": { id: "storm-front-zone", label: "Storm Front", baseColor: "#493243", ridgeColor: "#70505f", dustColor: "#706070", fogColor: "#4d4056", skyColor: "#3d3048", vegetationDensity: 0.12, propBias: { beacon: 0.75, storm: 0.9, wreck: 0.25 }, contracts: { courier: 0.28, survey: 0.45, rescue: 0.12, combat: 0.1 } },
  "dry-riverbed": { id: "dry-riverbed", label: "Dry River", baseColor: "#9d6a32", ridgeColor: "#c39255", dustColor: "#d6b579", fogColor: "#c59b68", skyColor: "#de7d2a", vegetationDensity: 0.15, propBias: { bridge: 0.6, boulder: 0.4, airfield: 0.12 }, contracts: { race: 0.5, courier: 0.3, survey: 0.12 } }
});
function biomeConfig(config = {}) { return { ...DEFAULT_AERIAL_CANYON_BIOMES, ...(config.biomes ?? {}) }; }
function chooseBiomeForPatch(patch = {}, config = {}) {
  const id = patch.patch === "mesa-plateau" || patch.patch === "sandstone-ridge" ? "gold-mesa" : patch.patch ?? "red-canyon-floor";
  if (id === "mountain-slope" && number(patch.center?.z, 0) > 2500) return "high-desert-forest";
  if (number(patch.center?.z, 0) > number(config.stormStartZ, 12500)) return "storm-front-zone";
  if (id === "black-rock-field" || id === "dead-tree-slope" || id === "dry-riverbed") return id;
  return DEFAULT_AERIAL_CANYON_BIOMES[id] ? id : "red-canyon-floor";
}

export function createBiomeTransitionDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "biomeTransition.state");
  let installedEngine = null;
  function initial() { return { id: config.id ?? "biome-transition", version: BIOME_TRANSITION_DOMAIN_KIT_VERSION, patchBiomes: {}, dominantCounts: {}, frame: 0 }; }
  function system(world) {
    const patches = installedEngine?.aerialPatchWindow?.getPatches?.() ?? installedEngine?.aerialPatchWindow?.getState?.()?.patches ?? [];
    const biomes = biomeConfig(config);
    const patchBiomes = {};
    const dominantCounts = {};
    for (const patch of patches) {
      const dominantBiome = chooseBiomeForPatch(patch, config);
      const secondaryBiome = dominantBiome === "red-canyon-floor" ? "gold-mesa" : "red-canyon-floor";
      const t = stableUnit(`${config.seed ?? "canyon"}:${patch.id}:transition`) * 0.28;
      patchBiomes[patch.id] = { patchId: patch.id, dominantBiome, secondaryBiome, transitionStrength: t, weights: { [dominantBiome]: 1 - t, [secondaryBiome]: t }, biome: biomes[dominantBiome] ?? biomes["red-canyon-floor"] };
      dominantCounts[dominantBiome] = (dominantCounts[dominantBiome] ?? 0) + 1;
    }
    world.setResource(State, { id: config.id ?? "biome-transition", version: BIOME_TRANSITION_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), patchBiomes, dominantCounts, biomes });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "biome-transition-domain-kit", requires: ["world:patch-window"], provides: ["biome:transition", "terrain:biome-weights", "render:biome-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "simulate"), name: "biomeTransitionSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { installedEngine = engine; engine.biomeTransition = { getState: () => world.getResource(State), getPatchBiome: (patchId) => world.getResource(State)?.patchBiomes?.[patchId] ?? null, getBiome: (id) => world.getResource(State)?.biomes?.[id] ?? null }; }, metadata: { version: BIOME_TRANSITION_DOMAIN_KIT_VERSION, domain: "biome-transition", purpose: "Patch-level biome weights and transition descriptors for terrain, vegetation, atmosphere, contracts, and props." } });
}

export function createTerrainMaterialDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "terrainMaterial.state");
  let installedEngine = null;
  function system(world) {
    const transition = installedEngine?.biomeTransition?.getState?.();
    const patchMaterials = {};
    for (const [patchId, entry] of Object.entries(transition?.patchBiomes ?? {})) {
      const b = entry.biome ?? DEFAULT_AERIAL_CANYON_BIOMES[entry.dominantBiome] ?? DEFAULT_AERIAL_CANYON_BIOMES["red-canyon-floor"];
      patchMaterials[patchId] = { id: `terrain.${patchId}`, patchId, biomeId: b.id, baseColor: b.baseColor, ridgeColor: b.ridgeColor, dustColor: b.dustColor, fogColor: b.fogColor, skyColor: b.skyColor, roughness: number(b.roughness, 0.92), strataScale: number(config.strataScale, 0.018), slopeDarken: number(config.slopeDarken, 0.35), dustAmount: number(config.dustAmount, 0.28) };
    }
    world.setResource(State, { id: config.id ?? "terrain-material", version: TERRAIN_MATERIAL_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), patchMaterials, palette: biomeConfig(config) });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "terrain-material-domain-kit", requires: ["biome:transition"], provides: ["terrain:material-descriptors", "render:terrain-material-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "terrainMaterialSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "terrain-material", version: TERRAIN_MATERIAL_DOMAIN_KIT_VERSION, patchMaterials: {}, palette: biomeConfig(config), frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.terrainMaterials = { getState: () => world.getResource(State), getMaterialForPatch: (patchId) => world.getResource(State)?.patchMaterials?.[patchId] ?? null }; }, metadata: { version: TERRAIN_MATERIAL_DOMAIN_KIT_VERSION, domain: "terrain-material", purpose: "Biome-driven terrain material descriptors: palette, strata, slope darkening, and dust blend data." } });
}

function patchBounds(patch = {}) { const size = number(patch.size, 768); return { size, x: number(patch.center?.x, number(patch.px) * size), z: number(patch.center?.z, number(patch.pz) * size) }; }
export function createGeologyPropDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "geologyProp.state");
  let installedEngine = null;
  function system(world) {
    const patches = (installedEngine?.aerialPatchWindow?.getPatches?.() ?? []).filter((p) => p.lod !== "far").slice(0, number(config.patchLimit, 60));
    const descriptors = [];
    for (const patch of patches) {
      const { size, x, z } = patchBounds(patch);
      const biome = installedEngine?.biomeTransition?.getPatchBiome?.(patch.id)?.dominantBiome ?? chooseBiomeForPatch(patch, config);
      const rand = createSeededRandom(`${config.seed ?? "canyon"}:geology:${patch.id}`);
      const terrain = installedEngine?.canyonTerrain;
      const count = patch.lod === "near" ? 2 : 1;
      for (let i = 0; i < count; i += 1) {
        const side = rand() > 0.5 ? 1 : -1;
        const px = x + side * (size * (0.25 + rand() * 0.35));
        const pz = z + (rand() - 0.5) * size;
        const y = terrain?.heightAt?.(px, pz) ?? 0;
        const type = biome === "black-rock-field" ? "basalt-teeth" : biome === "gold-mesa" ? (rand() > 0.55 ? "sandstone-arch" : "mesa-tower") : biome === "high-desert-forest" ? "ridge-boulder" : biome === "dead-tree-slope" ? "wreck-smoke" : "boulder-field";
        descriptors.push({ id: `${patch.id}:geology:${i}`, kind: "geology", type, biome, position: { x: px, y, z: pz }, radius: 18 + rand() * 45, height: 35 + rand() * 160, rotation: { y: rand() * Math.PI * 2 }, lod: patch.lod, materialId: biome === "black-rock-field" ? "geology.black" : "geology.sandstone", meshId: `geology.${type}` });
      }
      if (patch.lod === "near" && patch.id.includes("near") && rand() > 0.82) {
        const px = x + (rand() - 0.5) * size * 0.5; const pz = z + (rand() - 0.5) * size * 0.5; const y = terrain?.heightAt?.(px, pz) ?? 0;
        const type = biome === "gold-mesa" ? "radio-tower" : biome === "black-rock-field" ? "burned-convoy" : "signal-pylon";
        descriptors.push({ id: `${patch.id}:landmark`, kind: "landmark", type, biome, position: { x: px, y, z: pz }, radius: 24, height: type === "radio-tower" ? 120 : 54, rotation: { y: rand() * Math.PI * 2 }, lod: patch.lod, materialId: type === "radio-tower" ? "structure.radio" : "structure.dark", meshId: `landmark.${type}` });
      }
    }
    world.setResource(State, { id: config.id ?? "geology-props", version: GEOLOGY_PROP_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), descriptors, stats: { count: descriptors.length } });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "geology-prop-domain-kit", requires: ["world:patch-window", "biome:transition", "terrain:height-sampler"], provides: ["world:geology-props", "render:geology-descriptors", "collision:geology-proxies"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "simulate"), name: "geologyPropSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "geology-props", version: GEOLOGY_PROP_DOMAIN_KIT_VERSION, descriptors: [], stats: {}, frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.geologyProps = { getState: () => world.getResource(State), getDescriptors: () => world.getResource(State)?.descriptors ?? [] }; }, metadata: { version: GEOLOGY_PROP_DOMAIN_KIT_VERSION, domain: "geology-prop", purpose: "Biome-driven landmark and geology descriptors: arches, basalt, mesas, boulders, towers, and wreck traces." } });
}

export function createCloudBankDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "cloudBank.state");
  let installedEngine = null;
  function system(world) {
    const patches = (installedEngine?.aerialPatchWindow?.getPatches?.() ?? []).filter((p) => p.lod !== "near").slice(0, number(config.patchLimit, 40));
    const descriptors = [];
    for (const patch of patches) {
      const { size, x, z } = patchBounds(patch); const rand = createSeededRandom(`${config.seed ?? "canyon"}:cloud:${patch.id}`);
      const biome = installedEngine?.biomeTransition?.getPatchBiome?.(patch.id)?.dominantBiome ?? "red-canyon-floor";
      const count = biome === "storm-front-zone" ? 3 : biome === "high-desert-forest" ? 2 : 1;
      for (let i = 0; i < count; i += 1) descriptors.push({ id: `${patch.id}:cloud:${i}`, kind: "atmosphere", type: biome === "storm-front-zone" ? "storm-cloud-bank" : "cloud-bank", biome, position: { x: x + (rand() - 0.5) * size, y: mix(850, 2200, rand()), z: z + (rand() - 0.5) * size }, size: mix(120, 430, rand()), opacity: biome === "storm-front-zone" ? 0.42 : 0.24, materialId: biome === "storm-front-zone" ? "cloud.storm" : "cloud.high" });
    }
    world.setResource(State, { id: config.id ?? "cloud-banks", version: CLOUD_BANK_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), descriptors, stats: { count: descriptors.length } });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "cloud-bank-domain-kit", requires: ["world:patch-window", "biome:transition"], provides: ["weather:cloud-banks", "render:cloud-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "cloudBankSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "cloud-banks", version: CLOUD_BANK_DOMAIN_KIT_VERSION, descriptors: [], stats: {}, frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.cloudBanks = { getState: () => world.getResource(State), getDescriptors: () => world.getResource(State)?.descriptors ?? [] }; }, metadata: { version: CLOUD_BANK_DOMAIN_KIT_VERSION, domain: "cloud-bank", purpose: "Biome and storm-front cloud bank descriptors." } });
}

export function createStormFrontDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "stormFront.state");
  let installedEngine = null;
  function system(world) {
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    const z = number(body?.position?.z, 0);
    const start = number(config.startZ, 11200);
    const intensity = clamp((z - start) / number(config.rampDistance, 5000), 0, 1);
    const descriptors = intensity > 0 ? [{ id: "storm-wall-main", kind: "weather", type: "storm-front", position: { x: 0, y: 1000, z: start + 2800 }, size: 3000 + intensity * 3600, intensity, materialId: "weather.storm" }] : [];
    world.setResource(State, { id: config.id ?? "storm-front", version: STORM_FRONT_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), intensity, wind: { x: Math.sin(z * 0.001) * intensity * 14, y: 0, z: -intensity * 8 }, atmosphere: { fogDensity: 0.012 + intensity * 0.025, fogColor: intensity > 0.4 ? "#4d4056" : "#b87852", skyColor: intensity > 0.4 ? "#3d3048" : "#d86822" }, descriptors });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "storm-front-domain-kit", requires: ["aerial:body"], provides: ["weather:storm-front", "hazard:storm-zone", "render:storm-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "stormFrontSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "storm-front", version: STORM_FRONT_DOMAIN_KIT_VERSION, intensity: 0, descriptors: [], atmosphere: {}, frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.stormFront = { getState: () => world.getResource(State), getDescriptors: () => world.getResource(State)?.descriptors ?? [] }; }, metadata: { version: STORM_FRONT_DOMAIN_KIT_VERSION, domain: "storm-front", purpose: "Storm intensity, wind, atmosphere and hazard descriptors from route position." } });
}

export function createAerialContractObjectiveBridgeKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "contractObjectiveBridge.state");
  const Completed = defineEvent(NexusRealtime, "contractObjectiveBridge.completed");
  let installedEngine = null;
  function system(world) {
    const active = installedEngine?.contractBoard?.getActiveContract?.();
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    let state = clone(world.getResource(State) ?? { completedIds: [] });
    let progress = 0;
    let distance = null;
    if (active?.destination && body?.position) {
      distance = dist3(body.position, active.destination);
      progress = clamp(1 - distance / number(config.progressDistance, 7200), 0, 1);
      if (distance <= number(config.completeRadius, 180) && !state.completedIds.includes(active.id)) {
        state.completedIds.push(active.id);
        world.emit(Completed, { id: active.id, contract: active });
        installedEngine?.contractBoard?.complete?.(active.id);
      }
    }
    world.setResource(State, { id: config.id ?? "contract-objective-bridge", version: AERIAL_CONTRACT_OBJECTIVE_BRIDGE_KIT_VERSION, activeContractId: active?.id ?? null, activeType: active?.type ?? null, prompt: active?.label ?? "Choose a contract", distance, progress, completedIds: state.completedIds ?? [], frame: number(world.__nexusClock?.frame, 0) });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "aerial-contract-objective-bridge-kit", requires: ["contract:board", "aerial:body"], provides: ["objective:contract-bridge", "ui:contract-objective"], resources: { State }, events: { Completed }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialContractObjectiveBridgeSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "contract-objective-bridge", version: AERIAL_CONTRACT_OBJECTIVE_BRIDGE_KIT_VERSION, completedIds: [], progress: 0, frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.contractObjectiveBridge = { getState: () => world.getResource(State) }; }, metadata: { version: AERIAL_CONTRACT_OBJECTIVE_BRIDGE_KIT_VERSION, domain: "contract-objective-bridge", purpose: "Bridges active contracts to objective progress and completion facts." } });
}

export function createAerialScanLockDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialScanLock.state");
  let installedEngine = null;
  function system(world) {
    const target = installedEngine?.aerialReticleTargeting?.getTarget?.();
    const active = installedEngine?.contractBoard?.getActiveContract?.();
    const scanning = active?.type === "survey" && target && ["survey", "route", "contract", "delivery"].includes(target.markerType);
    const prev = world.getResource(State) ?? { progress: 0, completed: false };
    const progress = scanning ? clamp(number(prev.progress) + number(world.__nexusClock?.delta, 1 / 60) * number(config.scanRate, 0.35), 0, 1) : Math.max(0, number(prev.progress) - 0.025);
    world.setResource(State, { id: config.id ?? "aerial-scan-lock", version: AERIAL_SCAN_LOCK_DOMAIN_KIT_VERSION, targetId: target?.targetId ?? null, scanning: Boolean(scanning), progress, completed: progress >= 1, frame: number(world.__nexusClock?.frame, 0) });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "aerial-scan-lock-domain-kit", requires: ["ui:reticle-descriptor", "contract:board"], provides: ["scan:lock", "ui:scan-descriptor"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialScanLockSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-scan-lock", version: AERIAL_SCAN_LOCK_DOMAIN_KIT_VERSION, progress: 0, completed: false, frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialScanLock = { getState: () => world.getResource(State) }; }, metadata: { version: AERIAL_SCAN_LOCK_DOMAIN_KIT_VERSION, domain: "aerial-scan-lock", purpose: "Survey scan progress from reticle target focus and active contract type." } });
}

export function createAerialCargoStatusDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialCargoStatus.state");
  let installedEngine = null;
  function system(world) {
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    const active = installedEngine?.contractBoard?.getActiveContract?.();
    const prev = world.getResource(State) ?? { integrity: 1 };
    const carrying = active?.type === "courier" || active?.type === "rescue" || active?.type === "salvage";
    const stress = carrying ? (number(body?.boostHeat, 0) > 85 ? 0.00045 : 0) + (number(body?.agl, 100) < 45 ? 0.00035 : 0) : 0;
    const integrity = clamp(number(prev.integrity, 1) - stress, 0, 1);
    world.setResource(State, { id: config.id ?? "aerial-cargo-status", version: AERIAL_CARGO_STATUS_DOMAIN_KIT_VERSION, carrying, contractId: active?.id ?? null, integrity, status: carrying ? integrity < 0.35 ? "critical" : integrity < 0.72 ? "strained" : "secure" : "empty", frame: number(world.__nexusClock?.frame, 0) });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "aerial-cargo-status-domain-kit", requires: ["contract:board", "aerial:body"], provides: ["cargo:status", "ui:cargo-descriptor"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialCargoStatusSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-cargo-status", version: AERIAL_CARGO_STATUS_DOMAIN_KIT_VERSION, carrying: false, integrity: 1, status: "empty", frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialCargoStatus = { getState: () => world.getResource(State) }; }, metadata: { version: AERIAL_CARGO_STATUS_DOMAIN_KIT_VERSION, domain: "aerial-cargo-status", purpose: "Cargo integrity and strain descriptors for courier, rescue, and salvage contracts." } });
}

export function createAerialHazardFeedbackDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialHazardFeedback.state");
  let installedEngine = null;
  function system(world) {
    const storm = installedEngine?.stormFront?.getState?.(); const body = installedEngine?.poweredAerialFlight?.getBody?.(); const warnings = [];
    if (number(storm?.intensity, 0) > 0.35) warnings.push({ id: "storm", severity: "warning", text: "STORM", intensity: storm.intensity });
    if (number(body?.agl, 100) < number(config.lowAgl, 55)) warnings.push({ id: "terrain", severity: "danger", text: "TERRAIN" });
    world.setResource(State, { id: config.id ?? "aerial-hazard-feedback", version: AERIAL_HAZARD_FEEDBACK_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), warnings, atmosphere: storm?.atmosphere ?? null, wind: storm?.wind ?? null });
  }
  return defineInjectedRuntimeKit(NexusRealtime, { id: config.kitId ?? "aerial-hazard-feedback-domain-kit", requires: ["aerial:body", "weather:storm-front"], provides: ["hazard:feedback", "ui:hazard-warnings", "audio:hazard-cues"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialHazardFeedbackSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-hazard-feedback", version: AERIAL_HAZARD_FEEDBACK_DOMAIN_KIT_VERSION, warnings: [], frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialHazardFeedback = { getState: () => world.getResource(State), getWarnings: () => world.getResource(State)?.warnings ?? [] }; }, metadata: { version: AERIAL_HAZARD_FEEDBACK_DOMAIN_KIT_VERSION, domain: "aerial-hazard-feedback", purpose: "Condenses terrain and storm hazards into UI/audio/atmosphere feedback descriptors." } });
}

export function createAerialBiomeFidelityDomainKits(NexusRealtime = {}, config = {}) {
  return [
    createBiomeTransitionDomainKit(NexusRealtime, config.biomeTransition ?? config.biomes ?? {}),
    createTerrainMaterialDomainKit(NexusRealtime, config.terrainMaterial ?? config.materials ?? {}),
    createGeologyPropDomainKit(NexusRealtime, config.geology ?? {}),
    createCloudBankDomainKit(NexusRealtime, config.clouds ?? {}),
    createStormFrontDomainKit(NexusRealtime, config.storm ?? {}),
    createAerialContractObjectiveBridgeKit(NexusRealtime, config.contractObjective ?? {}),
    createAerialScanLockDomainKit(NexusRealtime, config.scanLock ?? {}),
    createAerialCargoStatusDomainKit(NexusRealtime, config.cargoStatus ?? {}),
    createAerialHazardFeedbackDomainKit(NexusRealtime, config.hazardFeedback ?? {})
  ];
}

export function collectAerialBiomeFidelitySnapshot(engine = {}) {
  return {
    biomeTransition: engine.biomeTransition?.getState?.() ?? null,
    terrainMaterials: engine.terrainMaterials?.getState?.() ?? null,
    geology: engine.geologyProps?.getState?.() ?? null,
    clouds: engine.cloudBanks?.getState?.() ?? null,
    storm: engine.stormFront?.getState?.() ?? null,
    contractObjective: engine.contractObjectiveBridge?.getState?.() ?? null,
    scan: engine.aerialScanLock?.getState?.() ?? null,
    cargo: engine.aerialCargoStatus?.getState?.() ?? null,
    hazard: engine.aerialHazardFeedback?.getState?.() ?? null
  };
}

export default createAerialBiomeFidelityDomainKits;
