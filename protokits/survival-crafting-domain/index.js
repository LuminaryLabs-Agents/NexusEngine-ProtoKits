import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const SURVIVAL_CRAFTING_DOMAIN_VERSION = "0.1.0";

const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const copy = (value) => JSON.parse(JSON.stringify(value ?? null));
const camel = (id) => id.replace(/-kit$/, "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

export const SURVIVAL_CRAFTING_KIT_SPECS = Object.freeze([
  ["survival-crafting-mode-kit", "mode", "mode", "Composes runtime, object, DSK, system, content, and render kits into a survival crafting stack", [], ["mode:survival-crafting", "domain:survival-crafting"]],
  ["input-runtime-kit", "runtime", "runtime", "Runtime input command queue adapter for survival crafting actions", [], ["runtime:input"]],
  ["command-queue-runtime-kit", "runtime", "runtime", "Serializable command queue for DSK-authored requests", [], ["runtime:command-queue"]],
  ["event-bus-runtime-kit", "runtime", "runtime", "Typed event bus descriptors for facts emitted by DSKs and systems", [], ["runtime:event-bus"]],
  ["spatial-index-runtime-kit", "runtime", "runtime", "Spatial query descriptors for nearby blocks, items, creatures, and zones", [], ["runtime:spatial-index"]],
  ["snapshot-runtime-kit", "runtime", "runtime", "Snapshot, replay, dirty-state, and restore service descriptors", [], ["runtime:snapshot"]],
  ["scheduler-runtime-kit", "runtime", "runtime", "Cadence and phase descriptors for cold-path DSKs and hot-loop systems", [], ["runtime:scheduler"]],
  ["player-object-kit", "objects", "object", "Player object descriptor with tags, survival capabilities, and accepted commands", [], ["object:player"]],
  ["block-object-kit", "objects", "object", "Block object descriptor with voxel position, material, hardness, and build/break capability", [], ["object:block"]],
  ["item-object-kit", "objects", "object", "Item object descriptor for dropped items, stacks, and inventory routing", [], ["object:item"]],
  ["tool-object-kit", "objects", "object", "Tool object descriptor for mining, attack, durability, and recipe uses", [], ["object:tool"]],
  ["creature-object-kit", "objects", "object", "Creature object descriptor with AI, health, drops, and interaction affordances", [], ["object:creature"]],
  ["container-object-kit", "objects", "object", "Container object descriptor for storage slots and lockable inventory access", [], ["object:container"]],
  ["weather-zone-object-kit", "objects", "object", "Weather zone object descriptor for biome, storm, temperature, and visibility transitions", [], ["object:weather-zone"]],
  ["interaction-domain-service-kit", "dsks", "domain-service", "Interaction verbs and affordance validation for crafting worlds", ["object:capabilities"], ["interaction:domain-service"]],
  ["inventory-domain-service-kit", "dsks", "domain-service", "Inventory slots, stacks, add/remove, equip, transfer, and use rules", [], ["inventory:domain-service"]],
  ["build-break-domain-service-kit", "dsks", "domain-service", "Block place, break, replace, support, and permission service rules", ["object:block"], ["build-break:domain-service"]],
  ["crafting-domain-service-kit", "dsks", "domain-service", "Recipe matching, crafting request, station, output, and failure service rules", ["inventory:domain-service"], ["crafting:domain-service"]],
  ["resource-gathering-domain-service-kit", "dsks", "domain-service", "Gather, harvest, mine, chop, drop, and depletion service rules", ["object:block", "object:tool"], ["gathering:domain-service"]],
  ["combat-domain-service-kit", "dsks", "domain-service", "Creature/player damage, weapon, armor, death, and loot service rules", ["object:creature"], ["combat:domain-service"]],
  ["survival-needs-domain-service-kit", "dsks", "domain-service", "Health, hunger, thirst, stamina, temperature, sleep, and exposure descriptors", [], ["survival:needs-domain-service"]],
  ["weather-domain-service-kit", "dsks", "domain-service", "Weather state, weather zone transition, wind, fog, precipitation, and exposure rules", ["object:weather-zone"], ["weather:domain-service"]],
  ["movement-system-kit", "systems", "system", "Hot-loop player and creature movement system descriptors", ["object:player"], ["system:movement"]],
  ["physics-system-kit", "systems", "system", "Hot-loop collision, gravity, and body resolution descriptors", [], ["system:physics"]],
  ["terrain-streaming-system-kit", "systems", "system", "Chunk load/unload, world rings, and streaming budget descriptors", [], ["system:terrain-streaming"]],
  ["chunk-mesh-system-kit", "systems", "system", "Chunk mesh dirty build and mesh descriptor generation service", ["object:block"], ["system:chunk-mesh"]],
  ["creature-ai-system-kit", "systems", "system", "Creature AI steering, perception, target, and behavior cadence descriptors", ["object:creature"], ["system:creature-ai"]],
  ["particle-system-kit", "systems", "system", "Particles for mining, weather, fire, combat, and harvest feedback", [], ["system:particles"]],
  ["render-culling-system-kit", "systems", "system", "Visible set and culling descriptors for block chunks, items, and creatures", [], ["system:render-culling"]],
  ["block-table-content-kit", "content", "content", "Reusable block table descriptors for materials, hardness, drops, and visuals", [], ["content:block-table"]],
  ["item-table-content-kit", "content", "content", "Reusable item table descriptors for inventory, crafting, loot, and equipment", [], ["content:item-table"]],
  ["recipe-table-content-kit", "content", "content", "Reusable recipe table descriptors for shaped, shapeless, and station recipes", [], ["content:recipe-table"]],
  ["biome-table-content-kit", "content", "content", "Reusable biome descriptors for terrain, vegetation, weather, creature, and material tables", [], ["content:biome-table"]],
  ["creature-roster-content-kit", "content", "content", "Creature archetype, spawn, behavior, drop, and biome weighting descriptors", [], ["content:creature-roster"]],
  ["loot-table-content-kit", "content", "content", "Loot table descriptors for blocks, creatures, chests, and quest rewards", [], ["content:loot-table"]],
  ["voxel-render-descriptor-kit", "render", "render", "Renderer-agnostic voxel render descriptors and material references", ["content:block-table"], ["render:voxel-descriptors"]],
  ["chunk-render-adapter-kit", "render", "adapter", "Chunk render adapter descriptor surface for Canvas/WebGL/WebGPU hosts", ["system:chunk-mesh"], ["render:chunk-adapter"]],
  ["block-material-kit", "render", "render", "Block material descriptors for terrain, ore, vegetation, crafted blocks, and damage states", ["content:block-table"], ["render:block-materials"]],
  ["diegetic-ui-render-kit", "render", "render", "Diegetic survival UI descriptors for world-space gauges, outlines, and prompts", [], ["render:diegetic-ui"]]
]);

export const SURVIVAL_CRAFTING_DOMAIN_MANIFEST = Object.freeze({
  id: "survival-crafting-domain",
  version: SURVIVAL_CRAFTING_DOMAIN_VERSION,
  purpose: "Reusable survival crafting DSKs for block worlds, objects, build/break, crafting, gathering, weather, systems, content, and render descriptors.",
  subdomains: Object.freeze(["mode", "runtime", "objects", "dsks", "systems", "content", "render"]),
  excludes: Object.freeze(["fluid-domain", "water-subdomain"]),
  kits: Object.freeze(SURVIVAL_CRAFTING_KIT_SPECS.map(([id]) => id))
});

export function createSurvivalCraftingKitById(NexusEngine, kitId, config = {}) {
  const spec = SURVIVAL_CRAFTING_KIT_SPECS.find(([id]) => id === kitId);
  if (!spec) throw new Error(`Unknown survival crafting kit: ${kitId}`);
  const [id, subdomain, category, purpose, requires, provides] = spec;
  const state = { descriptors: arr(config.descriptors), presets: arr(config.presets), config: copy(config.config ?? {}) };
  const apiName = config.apiName ?? camel(id);
  const api = Object.freeze({
    id: config.id ?? id,
    version: SURVIVAL_CRAFTING_DOMAIN_VERSION,
    domain: "survival-crafting-domain",
    subdomain,
    category,
    purpose,
    requires: arr(config.requires ?? requires),
    provides: arr(config.provides ?? provides),
    describe() { return Object.freeze({ id: api.id, version: api.version, domain: api.domain, subdomain, category, purpose, requires: api.requires.slice(), provides: api.provides.slice() }); },
    getState() { return copy(state); },
    createRuntimeKit(options = {}) {
      return defineInjectedRuntimeKit(NexusEngine, {
        id: options.id ?? api.id,
        requires: options.requires ?? api.requires,
        provides: options.provides ?? api.provides,
        bindings: { [apiName]: api },
        metadata: { version: api.version, domain: api.domain, subdomain, category, purpose, rendererIndependent: true, headlessSafe: true, ...(options.metadata ?? {}) }
      });
    }
  });
  return api;
}

export function createSurvivalCraftingDomainKits(NexusEngine, config = {}) {
  const omit = new Set(arr(config.omit));
  return SURVIVAL_CRAFTING_KIT_SPECS.filter(([id]) => !omit.has(id)).map(([id]) => createSurvivalCraftingKitById(NexusEngine, id, config[id] ?? {}));
}

export default createSurvivalCraftingDomainKits;
