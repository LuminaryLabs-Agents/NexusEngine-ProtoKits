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

export function createNextLedgeCloudClimbKits(NexusRealtime = {}, options = {}) {
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
    createContentPaletteKit(NexusRealtime, shared),
    createLayeredObjectKit(NexusRealtime, shared),
    createVerticalClimbCore(NexusRealtime, shared),
    createLedgeRouteKit(NexusRealtime, shared),
    createSimpleSwingKit(NexusRealtime, shared),
    createEndlessAscentKit(NexusRealtime, shared),
    createCloudZoneKit(NexusRealtime, shared),
    createClimbInputKit(NexusRealtime, shared),
    createClimbRiskKit(NexusRealtime, shared),
    createClimbCameraKit(NexusRealtime, shared),
    createDiegeticFeedbackKit(NexusRealtime, { ...shared, overlayUi: options.overlayUi ?? false }),
    createNextLedgeKit(NexusRealtime, shared)
  ];
}

export function createNextLedgeCloudClimb(NexusRealtime = {}, options = {}) {
  if (typeof NexusRealtime.createRealtimeGame !== "function") {
    throw new TypeError("createNextLedgeCloudClimb requires NexusRealtime.createRealtimeGame.");
  }
  const game = NexusRealtime.createRealtimeGame({
    ...(options.engineOptions ?? {}),
    kits: createNextLedgeCloudClimbKits(NexusRealtime, options)
  });
  game.endlessAscent?.materializeExisting?.();
  return game;
}
