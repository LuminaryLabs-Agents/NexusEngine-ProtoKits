import { createDataRegistryKit } from "../data-registry-kit/index.js";
import { createPerformanceBudgetKit } from "../performance-budget-kit/index.js";
import { createSkyAtmosphereKit } from "../sky-atmosphere-kit/index.js";
import { createLightingDescriptorKit } from "../lighting-descriptor-kit/index.js";
import { createMaterialPaletteKit } from "../material-palette-kit/index.js";
import { createTerrainSamplerKit } from "../terrain-sampler-kit/index.js";
import { createWorldPatchKit } from "../world-patch-kit/index.js";
import { createScatterPlacementKit } from "../scatter-placement-kit/index.js";
import { createInstancedRenderKit } from "../instanced-render-kit/index.js";
import { createFlightMotionKit } from "../flight-motion-kit/index.js";
import { createActorRenderKit } from "../actor-render-kit/index.js";
import { createFlockAgentKit } from "../flock-agent-kit/index.js";
import { createUpdraftVolumeKit } from "../updraft-volume-kit/index.js";
import { createCheckpointVolumeKit } from "../checkpoint-volume-kit/index.js";
import { SoraFlightData } from "./sora-data.js";

export const SORA_FLIGHT_PRESET_VERSION = "0.1.0";

export function createSoraFlightKits(nexusRealtime = {}, options = {}) {
  const data = { ...SoraFlightData, ...(options.data ?? {}), seed: options.seed ?? options.data?.seed ?? SoraFlightData.seed, mode: options.mode ?? options.data?.mode ?? SoraFlightData.mode };
  return [
    createDataRegistryKit(nexusRealtime, { data, seed: data.seed, mode: data.mode }),
    createPerformanceBudgetKit(nexusRealtime, { quality: options.quality ?? data.quality?.tier ?? "adaptive", budgets: data.quality }),
    createSkyAtmosphereKit(nexusRealtime, data.sky),
    createLightingDescriptorKit(nexusRealtime, data.lighting),
    createMaterialPaletteKit(nexusRealtime, { materials: data.materials }),
    createTerrainSamplerKit(nexusRealtime, { seed: data.terrain?.seed ?? data.seed, terrain: data.terrain }),
    createWorldPatchKit(nexusRealtime, { seed: data.seed, patchSize: options.patchSize ?? 500, radius: data.quality?.patchRadius ?? 3 }),
    createScatterPlacementKit(nexusRealtime, { seed: data.seed, rules: data.scatterRules }),
    createInstancedRenderKit(nexusRealtime, { lod: true }),
    createFlightMotionKit(nexusRealtime, { physics: data.physics, actorId: "player" }),
    createActorRenderKit(nexusRealtime, { actors: [{ id: "player", archetype: "bird" }] }),
    createFlockAgentKit(nexusRealtime, { seed: `${data.seed}:flock`, ...data.flock }),
    createUpdraftVolumeKit(nexusRealtime, { seed: `${data.seed}:updrafts`, ...data.updrafts }),
    createCheckpointVolumeKit(nexusRealtime, { seed: `${data.seed}:checkpoints`, ...data.checkpoints })
  ];
}

export function materializeSoraPatch(engine, playerPosition = { x: 0, y: 180, z: 0 }) {
  const patches = engine.worldPatch?.ensureAround?.(playerPosition) ?? [];
  const scatter = [];
  for (const patch of patches) {
    scatter.push(...(engine.scatterPlacement?.generateForPatch?.(patch) ?? []));
    engine.updraftVolume?.generateForPatch?.(patch);
    engine.checkpointVolume?.generateForPatch?.(patch);
  }
  engine.instancedRender?.build?.(scatter);
  engine.lightingDescriptor?.syncFromSky?.();
  engine.actorRender?.updateFromMotion?.("player");
  return { patches, scatter, renderBatches: engine.instancedRender?.snapshot?.()?.batches ?? [] };
}

export function createSoraFlightGame(nexusRealtime = {}, options = {}) {
  const kits = createSoraFlightKits(nexusRealtime, options);
  const createGame = options.createRealtimeGame ?? nexusRealtime.createRealtimeGame;
  if (typeof createGame !== "function") return { kits, preset: "sora-flight", version: SORA_FLIGHT_PRESET_VERSION };
  const game = createGame({ kits });
  const engine = game.engine ?? game;
  const startPosition = options.startPosition ?? { x: 0, y: 180, z: 0 };
  if (engine?.worldPatch) materializeSoraPatch(engine, startPosition);
  return game;
}

export { SoraFlightData };
