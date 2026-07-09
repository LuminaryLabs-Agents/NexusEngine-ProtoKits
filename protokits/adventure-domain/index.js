import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const ADVENTURE_DOMAIN_VERSION = "0.1.0";

const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const copy = (value) => JSON.parse(JSON.stringify(value ?? null));
const camel = (id) => id.replace(/-kit$/, "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

export const ADVENTURE_KIT_SPECS = Object.freeze([
  ["adventure-mode-kit", "mode", "mode", "Composes traversal, interaction, combat, inventory, dialogue, and quest services into an adventure stack", [], ["mode:adventure", "domain:adventure"]],
  ["interaction-domain-service-kit", "interaction", "domain-service", "Defines inspect, use, open, talk, and pickup verbs plus affordance validation", ["object:capabilities"], ["interaction:domain-service", "commands:interaction"]],
  ["affordance-registry-kit", "interaction", "domain-service", "Registers usable, readable, carryable, lockable, openable, and talkable affordance descriptors", [], ["interaction:affordance-registry"]],
  ["proximity-query-kit", "interaction", "domain-service", "Defines nearby target query descriptors for interaction candidates", ["spatial:index"], ["interaction:proximity-query"]],
  ["inspect-action-kit", "interaction", "domain-service", "Owns inspect action command descriptors and inspected events", ["interaction:domain-service"], ["action:inspect"]],
  ["open-action-kit", "interaction", "domain-service", "Owns open/close action descriptors for doors, containers, gates, and hatches", ["interaction:domain-service"], ["action:open"]],
  ["pickup-action-kit", "interaction", "domain-service", "Owns pickup request descriptors and carryable target rules", ["interaction:domain-service", "inventory:domain-service"], ["action:pickup"]],
  ["talk-action-kit", "interaction", "domain-service", "Owns talk action descriptors that route interaction targets into dialogue services", ["interaction:domain-service", "dialogue:domain-service"], ["action:talk"]],
  ["inventory-domain-service-kit", "inventory", "domain-service", "Defines inventory add, remove, equip, use, and transfer service rules", [], ["inventory:domain-service"]],
  ["item-object-kit", "inventory", "object", "Defines item object descriptors, tags, stack rules, and pickup capabilities", ["inventory:domain-service"], ["object:item"]],
  ["item-table-content-kit", "inventory", "content", "Reusable item tables for adventure inventories, rewards, and shops", [], ["content:item-table"]],
  ["equipment-slot-kit", "inventory", "domain-service", "Owns equipment slot descriptors, slot validation, and equip events", ["inventory:domain-service"], ["inventory:equipment-slots"]],
  ["pickup-routing-kit", "inventory", "domain-service", "Routes pickup actions into inventory, quest, audio, and reward event flows", ["action:pickup", "inventory:domain-service"], ["inventory:pickup-routing"]],
  ["item-use-kit", "inventory", "domain-service", "Owns item use command descriptors and valid use target rules", ["inventory:domain-service"], ["inventory:item-use"]],
  ["quest-domain-service-kit", "quest", "domain-service", "Defines quest, objective, condition, reward, and completion service rules", [], ["quest:domain-service"]],
  ["objective-ledger-kit", "quest", "domain-service", "Tracks objective ids, active/completed state, and sequence-facing progress descriptors", ["quest:domain-service"], ["quest:objective-ledger"]],
  ["quest-condition-kit", "quest", "domain-service", "Defines event/resource based quest condition descriptors", ["quest:domain-service"], ["quest:conditions"]],
  ["quest-reward-kit", "quest", "domain-service", "Defines reward routing for inventory, unlocks, currency, flags, and sequence events", ["quest:domain-service"], ["quest:rewards"]],
  ["quest-sequence-bridge-kit", "quest", "domain-service", "Bridges quest events and state into authored sequences", ["quest:domain-service"], ["quest:sequence-bridge"]],
  ["dialogue-domain-service-kit", "dialogue", "domain-service", "Defines dialogue start, advance, choice, branch, and end service rules", [], ["dialogue:domain-service"]],
  ["npc-dialogue-state-kit", "dialogue", "domain-service", "Tracks NPC dialogue availability, relationship gates, and branch state descriptors", ["dialogue:domain-service"], ["dialogue:npc-state"]],
  ["dialogue-tree-content-kit", "dialogue", "content", "Reusable dialogue tree content descriptors with ids, nodes, choices, and conditions", [], ["content:dialogue-trees"]],
  ["response-choice-kit", "dialogue", "domain-service", "Defines player response choice validation and selected-choice events", ["dialogue:domain-service"], ["dialogue:response-choice"]],
  ["dialogue-sequence-kit", "dialogue", "domain-service", "Maps dialogue beats into sequence-facing prompt, camera, and audio descriptors", ["dialogue:domain-service"], ["dialogue:sequence"]],
  ["combat-domain-service-kit", "combat", "domain-service", "Defines attack, hit, damage, defense, death, and feedback service rules", [], ["combat:domain-service"]],
  ["damage-health-kit", "combat", "domain-service", "Owns health, damage application, healing, death, and invulnerability descriptors", ["combat:domain-service"], ["damage:health"]],
  ["weapon-action-kit", "combat", "domain-service", "Defines melee/ranged weapon action requests, costs, cooldowns, and hit descriptors", ["combat:domain-service"], ["combat:weapon-action"]],
  ["armor-resistance-kit", "combat", "domain-service", "Defines armor, resistance, weakness, and damage-type modifiers", ["damage:health"], ["combat:armor-resistance"]],
  ["stagger-state-kit", "combat", "domain-service", "Owns stagger, poise, interruption, and recovery state descriptors", ["combat:domain-service"], ["combat:stagger-state"]],
  ["combat-event-feedback-kit", "combat", "domain-service", "Routes combat facts into audio, VFX, camera, and UI descriptor events", ["combat:domain-service"], ["combat:feedback-events"]],
  ["traversal-domain-service-kit", "traversal", "domain-service", "Defines walk, run, climb, swim, mount, and route traversal service rules", [], ["traversal:domain-service"]],
  ["walk-run-system-kit", "traversal", "system", "Hot-loop walk/run velocity and acceleration system descriptors", ["traversal:domain-service"], ["movement:walk-run"]],
  ["climb-traversal-kit", "traversal", "domain-service", "Climbable target, stamina cost, route, and climb state descriptors", ["traversal:domain-service"], ["traversal:climb"]],
  ["swim-traversal-kit", "traversal", "domain-service", "Swimming traversal state, drag, oxygen hooks, and water-volume descriptors", ["traversal:domain-service"], ["traversal:swim"]],
  ["mount-traversal-kit", "traversal", "domain-service", "Mount/dismount, rider attachment, and mounted movement descriptor service", ["traversal:domain-service"], ["traversal:mount"]],
  ["camera-rig-kit", "presentation", "domain-service", "Adventure camera rig descriptors for follow, focus, inspect, dialogue, and combat", [], ["camera:rig"]],
  ["diegetic-feedback-signal-kit", "presentation", "domain-service", "Diegetic feedback descriptors for target glow, beacon, pulse, and object state", [], ["feedback:diegetic-signals"]],
  ["interaction-prompt-descriptor-kit", "presentation", "domain-service", "Renderer-independent prompt descriptors derived from interaction affordances", ["interaction:affordance-registry"], ["render:interaction-prompts"]],
  ["adventure-audio-state-kit", "presentation", "domain-service", "Adventure audio state descriptors for exploration, combat, dialogue, rewards, and danger", [], ["audio:adventure-state"]]
]);

export const ADVENTURE_DOMAIN_MANIFEST = Object.freeze({
  id: "adventure-domain",
  version: ADVENTURE_DOMAIN_VERSION,
  purpose: "Reusable RPG/adventure DSKs for interaction, inventory, quest, dialogue, combat, traversal, and presentation.",
  subdomains: Object.freeze(["mode", "interaction", "inventory", "quest", "dialogue", "combat", "traversal", "presentation"]),
  excludes: Object.freeze(["fluid-domain", "water-subdomain"]),
  kits: Object.freeze(ADVENTURE_KIT_SPECS.map(([id]) => id))
});

export function createAdventureKitById(NexusEngine, kitId, config = {}) {
  const spec = ADVENTURE_KIT_SPECS.find(([id]) => id === kitId);
  if (!spec) throw new Error(`Unknown adventure kit: ${kitId}`);
  const [id, subdomain, category, purpose, requires, provides] = spec;
  const state = { descriptors: arr(config.descriptors), presets: arr(config.presets), config: copy(config.config ?? {}) };
  const apiName = config.apiName ?? camel(id);
  const api = Object.freeze({
    id: config.id ?? id,
    version: ADVENTURE_DOMAIN_VERSION,
    domain: "adventure-domain",
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

export function createAdventureDomainKits(NexusEngine, config = {}) {
  const omit = new Set(arr(config.omit));
  return ADVENTURE_KIT_SPECS.filter(([id]) => !omit.has(id)).map(([id]) => createAdventureKitById(NexusEngine, id, config[id] ?? {}));
}

export default createAdventureDomainKits;
