export const BLACKWAKE_PROTO_KIT_VERSION = "0.1.0";

const ATOMIC_GROUPS = Object.freeze([
  ["foundation", "blackwake-", "foundation", "clock fixed-step seeded-random stable-id math spatial-index settings quality-profile device-profile save-delta worker-bus worker-request-queue event-routing hot-path-pools typed-array-store"],
  ["sequence", "blackwake-sequence-", "sequence", "registry phase objective tutorial cinematic weather-beat docking-flow dive-flow salvage-flow quest-flow encounter-flow upgrade-flow port-flow combat-flow fail-state win-state"],
  ["input", "blackwake-input-", "input", "device actions context buffer remap assist touch gamepad pointer-look accessibility"],
  ["ocean-procedural", "blackwake-ocean-", "ocean", "seed sector depth-field current-field wind-field biome-field reef-field poi-field route-field discovery map-reveal sector-worker streaming-descriptors"],
  ["ocean-simulation", "blackwake-ocean-", "water", "spectrum wave-lod height-sampler normal-sampler velocity-sampler buoyancy floating-body wave-impact foam-field whitecap-field wake-field prop-wash sail-wake spray waterline shore-break storm-wave-coupling"],
  ["water-shading", "blackwake-water-", "water-shading", "material fresnel absorption reflection refraction sun-glitter foam-shading caustics underwater-shading shore-blend depth-color normal-blend wake-shading quality-profile"],
  ["weather", "blackwake-weather-", "weather", "state fronts wind-gusts rain lightning fog storm-director ocean-coupling visibility audio-events sequence-beats"],
  ["sky-lighting", "blackwake-", "sky-lighting", "sky-atmosphere sky-sun-moon sky-cloud-layer sky-time-of-day sky-horizon-haze lighting-composition lighting-local-lights lighting-reflection-probes lighting-color-grade lighting-exposure lighting-biome-palettes"],
  ["rendering", "blackwake-render-", "render", "descriptors backend-select webgl2 webgpu framegraph instancing mesh-pool material-pool shader-registry texture-atlas particles postprocess dynamic-resolution debug-overlay"],
  ["streaming-performance", "blackwake-", "streaming", "streaming-sectors streaming-lod-rings streaming-interest streaming-cache streaming-entity-sleep streaming-impostors streaming-worker-generation streaming-save-deltas perf-metrics perf-gpu-timing perf-allocation-guard perf-entity-budget perf-draw-budget perf-particle-budget perf-adaptive-quality perf-profiler-overlay"],
  ["islands", "blackwake-island-", "island", "seed shape heightfield coastline beach cliff vegetation landmarks caves poi-placement navmesh render-descriptors worker-meshbuild discovery"],
  ["coast", "blackwake-coast-", "coast", "depth-transition shore-foam wet-sand reef-break landing-zones dock-approach beach-interaction"],
  ["underwater", "blackwake-underwater-", "underwater", "volumes biomes visibility caustic-receivers bubbles fish-schools coral wrecks caves oxygen salvage loot hazards audio-filter"],
  ["ship", "blackwake-ship-", "ship", "registry transform hull-physics buoyancy sailing rudder anchor damage repair deck stations cargo upgrades visual-descriptors wake-emitters audio-emitters ladder-points docking-points collision state-surfaces"],
  ["player", "blackwake-player-", "player", "mode on-foot ship-relative-motion first-person third-person body hand-poses jump swimming diving climbing interaction inventory equipment health-stamina tool-use water-transition"],
  ["camera", "blackwake-camera-", "camera", "registry first-person third-person ship-chase helm underwater cinematic collision shake comfort photo-mode sequence-control"],
  ["interaction", "blackwake-interact-", "interaction", "registry focus prompt hold helm anchor ladder chest salvage map-table dock dialogue upgrade-station cargo-transfer"],
  ["navigation", "blackwake-nav-", "navigation", "sea-routes reef-avoidance current-aware-routing ship-ai-steering island-navmesh deck-navmesh underwater-graph worker compass-routing map-path-preview"],
  ["loot", "blackwake-loot-", "loot", "registry tables containers pickup cargo relics map-fragments rarity floating-cargo buried-treasure"],
  ["economy", "blackwake-economy-", "economy", "currency cargo-value port-market trade-routes shipwright repair-cost faction-reputation upgrade-pricing supply-demand"],
  ["quest", "blackwake-quest-", "quest", "registry generator objectives rewards tracking stormline-rescue underwater-salvage treasure-map merchant-run bounty port-contracts faction-chain"],
  ["encounter", "blackwake-encounter-", "encounter", "director spawn-budget merchant-ship pirate-hunter drifting-wreckage survivor ghost-fog sea-monster storm-wreck message-bottle"],
  ["npc", "blackwake-npc-ship-", "npc", "registry brain steering sailing avoidance combat lod trade-route faction"],
  ["combat", "blackwake-combat-", "combat", "damage-model cannons projectiles hit-resolution fire boarding repair-under-fire sail-damage crew-panic"],
  ["wildlife", "blackwake-wildlife-", "wildlife", "registry seagulls fish-schools dolphins sharks whales crabs reef-life lod"],
  ["port", "blackwake-port-", "port", "generator docks shipwright tavern market quest-board npcs lighting warehouse faction-office render-descriptors"],
  ["audio", "blackwake-audio-", "audio", "context ocean ship weather underwater wildlife music-director spatial ui sequence-cues"],
  ["ui", "blackwake-ui-", "ui", "hud compass speed wind ship-status oxygen quest-tracker map inventory upgrade-screen interaction-prompts dialogue port-market debug-panel"],
  ["debug", "blackwake-debug-", "debug", "kit-inspector sequence-inspector ocean-inspector worldgen-inspector nav-inspector render-inspector player-inspector ship-inspector weather-inspector economy-inspector quest-inspector performance-overlay"]
]);

const DOMAIN_GROUPS = Object.freeze({
  "blackwake-domain-foundation": ["foundation"],
  "blackwake-domain-sequences": ["sequence"],
  "blackwake-domain-input": ["input"],
  "blackwake-domain-ocean": ["ocean-procedural", "ocean-simulation"],
  "blackwake-domain-water-shading": ["water-shading"],
  "blackwake-domain-weather": ["weather"],
  "blackwake-domain-sky-lighting": ["sky-lighting"],
  "blackwake-domain-rendering": ["rendering"],
  "blackwake-domain-streaming-performance": ["streaming-performance"],
  "blackwake-domain-islands": ["islands"],
  "blackwake-domain-coast": ["coast"],
  "blackwake-domain-underwater": ["underwater"],
  "blackwake-domain-ship": ["ship"],
  "blackwake-domain-player": ["player"],
  "blackwake-domain-camera": ["camera"],
  "blackwake-domain-interaction": ["interaction"],
  "blackwake-domain-navigation": ["navigation"],
  "blackwake-domain-loot": ["loot"],
  "blackwake-domain-economy": ["economy"],
  "blackwake-domain-quests": ["quest"],
  "blackwake-domain-encounters": ["encounter"],
  "blackwake-domain-npc-ships": ["npc"],
  "blackwake-domain-combat": ["combat"],
  "blackwake-domain-wildlife": ["wildlife"],
  "blackwake-domain-ports": ["port"],
  "blackwake-domain-audio": ["audio"],
  "blackwake-domain-ui": ["ui"],
  "blackwake-domain-debug": ["debug"]
});

const MODE_IMPORTS = Object.freeze({
  "blackwake-mode-sailing-sandbox": "foundation sequences input ocean water-shading weather sky-lighting rendering streaming-performance ship camera ui debug",
  "blackwake-mode-deck-walk": "foundation input rendering ship player camera interaction ui",
  "blackwake-mode-swim-dive": "foundation input ocean water-shading underwater player camera interaction ui audio",
  "blackwake-mode-island-landing": "foundation ocean islands coast ship player camera interaction navigation rendering",
  "blackwake-mode-underwater-salvage": "foundation underwater loot economy player interaction quests ui audio",
  "blackwake-mode-treasure-hunt": "foundation islands coast loot economy player interaction quests navigation ui",
  "blackwake-mode-port-upgrade": "foundation ports loot economy ship player interaction quests ui",
  "blackwake-mode-storm-crossing": "foundation sequences ocean water-shading weather sky-lighting ship camera audio ui",
  "blackwake-mode-merchant-run": "foundation ocean navigation loot economy quests ports ship ui",
  "blackwake-mode-ocean-encounters": "foundation ocean weather encounters npc-ships wildlife streaming-performance rendering audio",
  "blackwake-mode-naval-combat": "foundation ocean ship npc-ships combat camera audio ui",
  "blackwake-mode-procedural-island": "foundation ocean islands coast rendering streaming-performance debug",
  "blackwake-mode-ocean-fidelity": "foundation ocean water-shading weather sky-lighting rendering streaming-performance debug"
});

const GAME_IMPORTS = Object.freeze({
  "blackwake-game-isles": "sailing-sandbox deck-walk swim-dive island-landing underwater-salvage treasure-hunt port-upgrade storm-crossing merchant-run ocean-encounters",
  "blackwake-game-stormline-rescue": "sailing-sandbox storm-crossing ocean-fidelity underwater-salvage",
  "blackwake-game-ocean-fidelity-lab": "ocean-fidelity",
  "blackwake-game-deck-and-dive-lab": "deck-walk swim-dive",
  "blackwake-game-island-treasure": "sailing-sandbox island-landing treasure-hunt",
  "blackwake-game-underwater-cove": "swim-dive underwater-salvage",
  "blackwake-game-shipyard-upgrade": "deck-walk port-upgrade",
  "blackwake-game-reef-runner": "sailing-sandbox ocean-fidelity",
  "blackwake-game-merchant-run": "sailing-sandbox merchant-run storm-crossing",
  "blackwake-game-encounter-sandbox": "sailing-sandbox ocean-encounters"
});

function words(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values));
}

function fallbackDefineRuntimeKit(config) {
  return Object.freeze({
    id: config.id,
    components: config.components ?? {},
    resources: config.resources ?? {},
    events: config.events ?? {},
    systems: config.systems ?? [],
    shaders: config.shaders ?? [],
    materials: config.materials ?? [],
    sequences: config.sequences ?? [],
    subscriptions: config.subscriptions ?? [],
    requires: config.requires ?? [],
    provides: config.provides ?? [],
    bindings: Object.freeze({ ...(config.bindings ?? {}) }),
    initWorld: config.initWorld,
    install: config.install,
    metadata: Object.freeze({ ...(config.metadata ?? {}) })
  });
}

function bindingName(id) {
  return id.replace(/[^a-zA-Z0-9]+(.)/g, (_, next) => next.toUpperCase()).replace(/^[A-Z]/, (value) => value.toLowerCase());
}

function atomicDefinitions() {
  const out = [];
  for (const [category, prefix, slotPrefix, list] of ATOMIC_GROUPS) {
    for (const slug of words(list)) {
      out.push(Object.freeze({
        id: `${prefix}${slug}`,
        tier: "atomic",
        category,
        provides: Object.freeze([`${slotPrefix}:${slug}`]),
        requires: Object.freeze([]),
        imports: Object.freeze([])
      }));
    }
  }
  return out;
}

const ATOMICS = atomicDefinitions();
const ATOMICS_BY_CATEGORY = new Map();
for (const definition of ATOMICS) {
  if (!ATOMICS_BY_CATEGORY.has(definition.category)) ATOMICS_BY_CATEGORY.set(definition.category, []);
  ATOMICS_BY_CATEGORY.get(definition.category).push(definition);
}

function domainDefinitions() {
  return Object.entries(DOMAIN_GROUPS).map(([id, categories]) => {
    const imports = categories.flatMap((category) => ATOMICS_BY_CATEGORY.get(category)?.map((definition) => definition.id) ?? []);
    const requires = imports.flatMap((importedId) => getDefinition(importedId).provides);
    return Object.freeze({
      id,
      tier: "domain",
      category: id.replace("blackwake-domain-", "domain-"),
      provides: Object.freeze([`domain:${id.replace("blackwake-domain-", "")}`]),
      requires: Object.freeze(unique(requires)),
      imports: Object.freeze(imports)
    });
  });
}

function modeDefinitions() {
  return Object.entries(MODE_IMPORTS).map(([id, domainSlugs]) => {
    const imports = words(domainSlugs).map((slug) => `blackwake-domain-${slug}`);
    const requires = imports.flatMap((importedId) => getDefinition(importedId).provides);
    return Object.freeze({
      id,
      tier: "mode",
      category: "mode",
      provides: Object.freeze([`mode:${id.replace("blackwake-mode-", "")}`]),
      requires: Object.freeze(unique(requires)),
      imports: Object.freeze(imports)
    });
  });
}

function gameDefinitions() {
  return Object.entries(GAME_IMPORTS).map(([id, modeSlugs]) => {
    const imports = words(modeSlugs).map((slug) => `blackwake-mode-${slug}`);
    const requires = imports.flatMap((importedId) => getDefinition(importedId).provides);
    return Object.freeze({
      id,
      tier: "game",
      category: "game",
      provides: Object.freeze([`game:${id.replace("blackwake-game-", "")}`]),
      requires: Object.freeze(unique(requires)),
      imports: Object.freeze(imports)
    });
  });
}

const PARTIAL_DEFINITIONS = [...ATOMICS];
const PARTIAL_BY_ID = new Map(PARTIAL_DEFINITIONS.map((definition) => [definition.id, definition]));
function getDefinition(id) {
  const direct = DEFINITIONS_BY_ID.get(id) ?? PARTIAL_BY_ID.get(id);
  if (!direct) throw new Error(`Unknown Blackwake ProtoKit: ${id}`);
  return direct;
}

const DOMAINS = domainDefinitions();
for (const definition of DOMAINS) PARTIAL_BY_ID.set(definition.id, definition);
const MODES = modeDefinitions();
for (const definition of MODES) PARTIAL_BY_ID.set(definition.id, definition);
const GAMES = gameDefinitions();

export const BLACKWAKE_PROTO_KIT_DEFINITIONS = Object.freeze([...ATOMICS, ...DOMAINS, ...MODES, ...GAMES]);
export const BLACKWAKE_PROTO_KIT_IDS = Object.freeze(BLACKWAKE_PROTO_KIT_DEFINITIONS.map((definition) => definition.id));
export const BLACKWAKE_PROTO_KIT_COUNT = BLACKWAKE_PROTO_KIT_DEFINITIONS.length;

const DEFINITIONS_BY_ID = new Map(BLACKWAKE_PROTO_KIT_DEFINITIONS.map((definition) => [definition.id, definition]));

export function getBlackwakeProtoKitDefinition(id) {
  return getDefinition(id);
}

export function listBlackwakeProtoKits(filter = {}) {
  return BLACKWAKE_PROTO_KIT_DEFINITIONS
    .filter((definition) => !filter.tier || definition.tier === filter.tier)
    .filter((definition) => !filter.category || definition.category === filter.category)
    .map((definition) => ({
      id: definition.id,
      tier: definition.tier,
      category: definition.category,
      provides: [...definition.provides],
      requires: [...definition.requires],
      imports: [...definition.imports]
    }));
}

export function expandBlackwakeProtoKitIds(ids, options = {}) {
  const roots = Array.isArray(ids) ? ids : [ids];
  const includeRoot = options.includeRoot !== false;
  const visited = new Set();
  const ordered = [];
  function visit(id, isRoot = false) {
    const definition = getDefinition(id);
    for (const imported of definition.imports) visit(imported, false);
    if ((includeRoot || !isRoot) && !visited.has(id)) {
      visited.add(id);
      ordered.push(id);
    }
  }
  for (const id of roots) visit(id, true);
  return ordered;
}

export function expandBlackwakeProtoKitDefinitions(ids, options = {}) {
  return expandBlackwakeProtoKitIds(ids, options).map(getDefinition);
}

export function validateBlackwakeProtoKitGraph(ids = ["blackwake-game-isles"]) {
  const definitions = expandBlackwakeProtoKitDefinitions(ids);
  const provided = new Set();
  const missing = [];
  for (const definition of definitions) {
    const unmet = definition.requires.filter((slot) => !provided.has(slot));
    if (unmet.length) missing.push({ id: definition.id, missing: unmet });
    provided.add(definition.id);
    for (const slot of definition.provides) provided.add(slot);
  }
  return Object.freeze({
    ok: missing.length === 0,
    missing: Object.freeze(missing),
    installOrder: Object.freeze(definitions.map((definition) => definition.id)),
    provides: Object.freeze([...provided])
  });
}

export function createBlackwakeRuntimeKit(NexusRealtime, definitionOrId, options = {}) {
  const definition = typeof definitionOrId === "string" ? getDefinition(definitionOrId) : definitionOrId;
  const defineRuntimeKit = NexusRealtime?.defineRuntimeKit ?? fallbackDefineRuntimeKit;
  const metadata = Object.freeze({
    protoKit: definition.id,
    tier: definition.tier,
    category: definition.category,
    imports: [...definition.imports],
    source: "NexusRealtime-ProtoKits/blackwake-kit-registry",
    status: options.status ?? "scaffold"
  });
  return defineRuntimeKit({
    id: definition.id,
    provides: [...definition.provides],
    requires: [...definition.requires],
    components: {},
    resources: {},
    events: {},
    systems: [],
    shaders: [],
    materials: [],
    sequences: [],
    subscriptions: [],
    bindings: {
      [bindingName(definition.id)]: Object.freeze({
        id: definition.id,
        tier: definition.tier,
        category: definition.category,
        provides: [...definition.provides],
        requires: [...definition.requires]
      })
    },
    metadata,
    install({ engine }) {
      if (!engine.blackwakeProtoKits) engine.blackwakeProtoKits = [];
      engine.blackwakeProtoKits.push(metadata);
    }
  });
}

export function createBlackwakeProtoKit(NexusRealtime, id = "blackwake-game-isles", options = {}) {
  const definitions = expandBlackwakeProtoKitDefinitions(id);
  const kits = definitions.map((definition) => createBlackwakeRuntimeKit(NexusRealtime, definition, options));
  const root = getDefinition(id);
  return Object.freeze({
    id: root.id,
    version: BLACKWAKE_PROTO_KIT_VERSION,
    tier: root.tier,
    category: root.category,
    definitions: Object.freeze(definitions),
    kits: Object.freeze(kits),
    provides: Object.freeze(unique(definitions.flatMap((definition) => definition.provides))),
    requires: Object.freeze(unique(definitions.flatMap((definition) => definition.requires))),
    installOrder: Object.freeze(definitions.map((definition) => definition.id)),
    validation: validateBlackwakeProtoKitGraph(id)
  });
}

export function createBlackwakeProtoKits(NexusRealtime, ids = ["blackwake-game-isles"], options = {}) {
  const ordered = unique((Array.isArray(ids) ? ids : [ids]).flatMap((id) => expandBlackwakeProtoKitIds(id)));
  const definitions = ordered.map(getDefinition);
  const kits = definitions.map((definition) => createBlackwakeRuntimeKit(NexusRealtime, definition, options));
  return Object.freeze({
    id: "blackwake-protokit-bundle",
    version: BLACKWAKE_PROTO_KIT_VERSION,
    definitions: Object.freeze(definitions),
    kits: Object.freeze(kits),
    provides: Object.freeze(unique(definitions.flatMap((definition) => definition.provides))),
    requires: Object.freeze(unique(definitions.flatMap((definition) => definition.requires))),
    installOrder: Object.freeze(ordered),
    validation: validateBlackwakeProtoKitGraph(ordered)
  });
}

export function createAllBlackwakeProtoKits(NexusRealtime, options = {}) {
  return createBlackwakeProtoKits(NexusRealtime, BLACKWAKE_PROTO_KIT_IDS, options);
}

export function createBlackwakeRuntimeKits(NexusRealtime, id = "blackwake-game-isles", options = {}) {
  return createBlackwakeProtoKit(NexusRealtime, id, options).kits;
}

export function createBlackwakeGameRuntime(NexusRealtime, id = "blackwake-game-isles", options = {}) {
  const protoKit = createBlackwakeProtoKit(NexusRealtime, id, options);
  const engine = typeof NexusRealtime?.createRealtimeGame === "function"
    ? NexusRealtime.createRealtimeGame({
        ...(options.engine ?? {}),
        canvas: options.canvas ?? options.engine?.canvas ?? null,
        root: options.root ?? options.engine?.root ?? null,
        kits: protoKit.kits
      })
    : {
        kits: protoKit.kits,
        clock: { delta: 1 / 60, elapsed: 0, frame: 0 },
        tick(delta = 1 / 60) {
          this.clock.delta = delta;
          this.clock.elapsed += delta;
          this.clock.frame += 1;
          return this;
        }
      };
  let running = false;
  let last = 0;
  function frame(now) {
    if (!running) return;
    const delta = Math.min(options.maxDelta ?? 0.033, (now - last) / 1000 || 1 / 60);
    last = now;
    engine.tick?.(delta);
    options.onTick?.({ engine, protoKit, delta, now });
    globalThis.requestAnimationFrame?.(frame);
  }
  return Object.freeze({
    id,
    protoKit,
    engine,
    start() {
      if (running) return;
      running = true;
      last = globalThis.performance?.now?.() ?? 0;
      globalThis.requestAnimationFrame?.(frame);
    },
    stop() {
      running = false;
    },
    tick(delta = 1 / 60) {
      return engine.tick?.(delta);
    }
  });
}

export function createBlackwakeIslesProtoKit(NexusRealtime, options = {}) {
  return createBlackwakeProtoKit(NexusRealtime, "blackwake-game-isles", options);
}

export function createBlackwakeIslesGame(NexusRealtime, options = {}) {
  return createBlackwakeGameRuntime(NexusRealtime, "blackwake-game-isles", options);
}

export function createStormlineRescueProtoKit(NexusRealtime, options = {}) {
  return createBlackwakeProtoKit(NexusRealtime, "blackwake-game-stormline-rescue", options);
}

export function createStormlineRescueGame(NexusRealtime, options = {}) {
  return createBlackwakeGameRuntime(NexusRealtime, "blackwake-game-stormline-rescue", options);
}
