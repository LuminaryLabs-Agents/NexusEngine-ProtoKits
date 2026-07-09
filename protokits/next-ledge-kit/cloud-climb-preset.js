import { createContentPaletteKit } from "../content-palette-kit/index.js";
import { createLayeredObjectKit } from "../layered-object-kit/index.js";
import { createVerticalClimbCore } from "../vertical-climb-core/index.js";
import { createLedgeRouteKit } from "../ledge-route-kit/index.js";
import { createSimpleSwingKit } from "../simple-swing-kit/index.js";
import { createEndlessAscentKit } from "../endless-ascent-kit/index.js";
import { createCloudZoneKit } from "../cloud-zone-kit/index.js";
import { createClimbInputKit } from "../climb-input-kit/index.js";
import { createClimbRiskKit } from "../climb-risk-kit/index.js";
import { createClimbCameraKit } from "../climb-camera-kit/index.js";
import { createDiegeticFeedbackKit } from "../diegetic-feedback-kit/index.js";
import { createDefaultNextLedgeLevel, createNextLedgeKit } from "./index.js";

export const NEXT_LEDGE_CLOUD_CLIMB_PRESET_VERSION = "0.0.1";

function routeObjectsFromLevel(level = {}) {
  return (level.sceneRecipe?.objects ?? []).filter((object) =>
    object.kit === "interaction-target" ||
    object.interaction ||
    ["ledge", "rope", "rest", "finish", "risky"].includes(object.archetype ?? object.kind ?? object.metadata?.type)
  );
}

export function createNextLedgeCloudClimbKits(NexusEngine = {}, options = {}) {
  const level = options.level ?? createDefaultNextLedgeLevel();
  const shared = {
    ...options,
    level,
    nodes: options.nodes ?? level.nodes ?? routeObjectsFromLevel(level),
    sceneRecipe: options.sceneRecipe ?? level.sceneRecipe,
    layers: options.layers ?? level.layers ?? [
      { id: "back", depth: -4, role: "background", parallax: 0.35 },
      { id: "mid", depth: 0, role: "gameplay", parallax: 1 },
      { id: "front", depth: 2.5, role: "foreground", parallax: 1.2 }
    ],
    palettes: options.palettes ?? level.palettes ?? []
  };
  return [
    createContentPaletteKit(NexusEngine, shared),
    createLayeredObjectKit(NexusEngine, shared),
    createVerticalClimbCore(NexusEngine, shared),
    createLedgeRouteKit(NexusEngine, shared),
    createSimpleSwingKit(NexusEngine, shared),
    createEndlessAscentKit(NexusEngine, shared),
    createCloudZoneKit(NexusEngine, shared),
    createClimbInputKit(NexusEngine, shared),
    createClimbRiskKit(NexusEngine, shared),
    createClimbCameraKit(NexusEngine, shared),
    createDiegeticFeedbackKit(NexusEngine, { ...shared, overlayUi: options.overlayUi ?? false }),
    createNextLedgeKit(NexusEngine, shared)
  ];
}

export function createNextLedgeCloudClimb(NexusEngine = {}, options = {}) {
  if (typeof NexusEngine.createRealtimeGame !== "function") {
    throw new TypeError("createNextLedgeCloudClimb requires NexusEngine.createRealtimeGame.");
  }
  const game = NexusEngine.createRealtimeGame({
    ...(options.engineOptions ?? {}),
    kits: createNextLedgeCloudClimbKits(NexusEngine, options)
  });
  game.endlessAscent?.materializeExisting?.();
  return game;
}
