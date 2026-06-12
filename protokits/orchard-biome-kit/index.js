export const ORCHARD_BIOME_KIT_VERSION = "0.0.1";

const APPLES = Object.freeze([
  { id: "red-apple", label: "Red Apple", rarity: "common", weight: 42, tags: ["score"] },
  { id: "golden-apple", label: "Golden Apple", rarity: "rare", weight: 7, tags: ["heal"] },
  { id: "moon-apple", label: "Moon Apple", rarity: "rare", weight: 5, tags: ["stealth"] },
  { id: "blood-apple", label: "Blood Apple", rarity: "uncommon", weight: 11, tags: ["damage-boost"] },
  { id: "glass-apple", label: "Glass Apple", rarity: "uncommon", weight: 8, tags: ["shield"] },
  { id: "cider-apple", label: "Cider Apple", rarity: "uncommon", weight: 12, tags: ["stamina"] },
  { id: "worm-apple", label: "Worm Apple", rarity: "cursed", weight: 5, tags: ["risk", "monster-bait"] },
  { id: "black-apple", label: "Black Apple", rarity: "legendary", weight: 1, tags: ["curse", "upgrade"] }
]);

const SEASONS = Object.freeze({
  "late-autumn": { fogDensity: 0.62, moonlight: 0.75, leafCover: 0.8, appleGlow: 0.65 },
  "first-frost": { fogDensity: 0.48, moonlight: 0.9, leafCover: 0.45, appleGlow: 0.82 },
  "blood-harvest": { fogDensity: 0.72, moonlight: 0.52, leafCover: 0.9, appleGlow: 1 }
});

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const i = (value, fallback = 0) => Math.max(0, Math.floor(n(value, fallback)));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const tickDt = (world) => clamp(n(world.__nexusClock?.delta, 1 / 60), 0, 1);

function runtime(nexusRealtime) {
  const missing = ["defineRuntimeKit", "defineResource", "defineEvent"].filter((name) => typeof nexusRealtime?.[name] !== "function");
  if (missing.length) throw new TypeError(`createOrchardBiomeKit requires NexusRealtime helpers: ${missing.join(", ")}`);
  return nexusRealtime;
}

function namespace(engine) {
  if (!engine.zombieOrchard) engine.zombieOrchard = {};
  return engine.zombieOrchard;
}

function rng(seed = "zombie-orchard") {
  let state = 2166136261;
  for (const char of String(seed)) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6D2B79F5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, random) {
  const total = list.reduce((sum, entry) => sum + Math.max(0, n(entry.weight, 1)), 0);
  let cursor = random() * total;
  for (const entry of list) {
    cursor -= Math.max(0, n(entry.weight, 1));
    if (cursor <= 0) return entry;
  }
  return list[list.length - 1];
}

function createLayout(config = {}) {
  const random = rng(config.seed ?? "zombie-orchard");
  const width = n(config.width, 72);
  const depth = n(config.depth, 96);
  const rowCount = clamp(i(config.rowCount, 9), 2, 24);
  const treesPerRow = clamp(i(config.treesPerRow, 16), 4, 60);
  const rowSpacing = n(config.rowSpacing, width / rowCount);
  const treeSpacing = n(config.treeSpacing, depth / treesPerRow);
  const treeRows = [];

  for (let row = 0; row < rowCount; row += 1) {
    const x = -((rowCount - 1) * rowSpacing) / 2 + row * rowSpacing + (random() - 0.5) * rowSpacing * 0.16;
    const trees = [];
    for (let index = 0; index < treesPerRow; index += 1) {
      trees.push({
        id: `tree-${row}-${index}`,
        position: { x: x + (random() - 0.5) * 0.8, z: -depth / 2 + index * treeSpacing + (random() - 0.5) * treeSpacing * 0.24 },
        radius: 0.6 + random() * 0.45,
        canopyRadius: 2.4 + random() * 1.3,
        tags: ["tree"]
      });
    }
    treeRows.push({ id: `row-${row}`, x, zStart: -depth / 2, zEnd: depth / 2, trees });
  }

  const fogLanes = Array.from({ length: rowCount - 1 }, (_, lane) => ({
    id: `fog-lane-${lane}`,
    center: { x: -((rowCount - 1) * rowSpacing) / 2 + lane * rowSpacing + rowSpacing / 2, z: (random() - 0.5) * depth * 0.18 },
    length: depth * (0.65 + random() * 0.25),
    width: rowSpacing * (0.55 + random() * 0.2),
    density: 0.35 + random() * 0.55,
    tags: ["fog", "line-of-sight-break"]
  })).filter((_, lane) => lane % 2 === 0 || random() < 0.45);

  const hauntedZones = ["whispering-row", "dead-well", "crow-circle", "root-tangle", "blood-soil"].map((kind, index) => ({
    id: `haunted-zone-${index}`,
    kind,
    position: { x: (random() - 0.5) * width * 0.82, z: (random() - 0.5) * depth * 0.82 },
    radius: 5 + random() * 9,
    intensity: 0.28 + random() * 0.72,
    tags: ["haunted", kind]
  }));

  const barnLandmarks = [
    { id: "north-barn", kind: "barn", position: { x: -width * 0.28, z: -depth * 0.38 }, size: { x: 10, z: 8 }, spawnRadius: 7, lockedUntilRound: 3, tags: ["barn", "loot", "shadow"] },
    { id: "cider-shed", kind: "shed", position: { x: width * 0.32, z: depth * 0.18 }, size: { x: 6, z: 5 }, spawnRadius: 5, lockedUntilRound: 2, tags: ["shed", "weapon-cache"] }
  ];

  const fenceLoops = [{
    id: "outer-fence",
    kind: "loop",
    points: [{ x: -width / 2, z: -depth / 2 }, { x: width / 2, z: -depth / 2 }, { x: width / 2, z: depth / 2 }, { x: -width / 2, z: depth / 2 }],
    gates: [{ id: "south-gate", position: { x: 0, z: depth / 2 }, lockedUntilRound: 1 }, { id: "barn-gate", position: { x: -width * 0.32, z: -depth / 2 }, lockedUntilRound: 3 }],
    tags: ["boundary", "fence"]
  }];

  const appleTypes = config.appleTypes ?? APPLES;
  const appleSpawnPoints = treeRows.flatMap((row) => row.trees).filter(() => random() < 0.42).map((tree, index) => {
    const apple = pick(appleTypes, random);
    return { id: `apple-spawn-${tree.id}`, typeId: apple.id, label: apple.label, rarity: apple.rarity, position: { x: tree.position.x + (random() - 0.5) * tree.canopyRadius, z: tree.position.z + (random() - 0.5) * tree.canopyRadius }, active: index < i(config.targetActiveApples, 22), tags: ["apple", ...(apple.tags ?? [])] };
  });

  const weaponIds = ["orchard-branch", "rusty-shovel", "pitchfork", "hatchet", "flare-pistol", "farm-shotgun"];
  const weaponSpawnPoints = Array.from({ length: i(config.weaponSpawnCount, 14) }, (_, index) => ({ id: `weapon-spawn-${index}`, weaponId: weaponIds[index % weaponIds.length], position: { x: (random() - 0.5) * width * 0.88, z: (random() - 0.5) * depth * 0.88 }, tags: ["weapon-spawn", index % 3 === 0 ? "risky" : "lane"] }));
  const monsterSpawnZones = [
    { id: "spawn-north", position: { x: 0, z: -depth / 2 - 8 }, radius: width * 0.42, tags: ["perimeter", "north"] },
    { id: "spawn-south", position: { x: 0, z: depth / 2 + 8 }, radius: width * 0.42, tags: ["perimeter", "south"] },
    { id: "spawn-west", position: { x: -width / 2 - 8, z: 0 }, radius: depth * 0.28, tags: ["perimeter", "west"] },
    { id: "spawn-east", position: { x: width / 2 + 8, z: 0 }, radius: depth * 0.28, tags: ["perimeter", "east"] },
    ...barnLandmarks.map((barn) => ({ id: `${barn.id}-spawn`, position: barn.position, radius: barn.spawnRadius, tags: ["landmark", ...barn.tags] }))
  ];

  const seasonId = config.seasonalVariant ?? "late-autumn";
  return {
    seed: config.seed ?? "zombie-orchard",
    width,
    depth,
    seasonId,
    season: SEASONS[seasonId] ?? SEASONS["late-autumn"],
    treeRows,
    fogLanes,
    hauntedZones,
    barnLandmarks,
    fenceLoops,
    appleSpawnPoints,
    activeApples: appleSpawnPoints.filter((apple) => apple.active),
    claimedApples: [],
    weaponSpawnPoints,
    monsterSpawnZones,
    safeClearings: [{ id: "starting-clearing", position: { x: 0, z: depth * 0.36 }, radius: 7, tags: ["start", "lantern"] }],
    navHints: { obstacleComponents: treeRows.flatMap((row) => row.trees.map((tree) => ({ id: tree.id, kind: "circle", position: tree.position, radius: tree.radius }))) },
    haunting: { level: n(config.initialHauntingLevel, 0.25), pulse: 0, activeZoneId: hauntedZones[0]?.id ?? null, shiftCooldown: n(config.hauntingShiftSeconds, 18) },
    appleReplenishCooldown: n(config.appleReplenishSeconds, 6)
  };
}

export function createOrchardBiomeKit(nexusRealtime = {}, options = {}) {
  const r = runtime(nexusRealtime);
  const D = {
    OrchardBiomeState: r.defineResource("zombie-orchard.orchard-biome.state"),
    OrchardGenerated: r.defineEvent("zombie-orchard.orchard.generated"),
    AppleSpawned: r.defineEvent("zombie-orchard.apple.spawned"),
    AppleCollected: r.defineEvent("zombie-orchard.apple.collected"),
    HauntedZoneShifted: r.defineEvent("zombie-orchard.haunted-zone.shifted")
  };

  function system(world) {
    let state = world.getResource(D.OrchardBiomeState);
    if (!state) return;
    const delta = tickDt(world);
    const claimed = new Set(state.claimedApples ?? []);
    let activeApples = state.activeApples ?? [];

    for (const event of world.readEvents(D.AppleCollected)) {
      const id = event.id ?? event.appleId;
      if (id) {
        claimed.add(id);
        activeApples = activeApples.filter((apple) => apple.id !== id);
      }
    }

    const haunting = { ...state.haunting, pulse: (n(state.haunting?.pulse) + delta * (0.35 + n(state.haunting?.level, 0.25))) % (Math.PI * 2), shiftCooldown: Math.max(0, n(state.haunting?.shiftCooldown) - delta) };
    if (haunting.shiftCooldown <= 0 && state.hauntedZones?.length) {
      const index = Math.max(0, state.hauntedZones.findIndex((zone) => zone.id === haunting.activeZoneId));
      const zone = state.hauntedZones[(index + 1) % state.hauntedZones.length];
      haunting.activeZoneId = zone.id;
      haunting.shiftCooldown = n(options.hauntingShiftSeconds, 18);
      haunting.level = clamp(n(haunting.level, 0.25) + 0.03, 0, 1);
      world.emit(D.HauntedZoneShifted, { zone, haunting });
    }

    let appleReplenishCooldown = Math.max(0, n(state.appleReplenishCooldown) - delta);
    if (activeApples.length < i(options.targetActiveApples, 22) && appleReplenishCooldown <= 0) {
      const activeIds = new Set(activeApples.map((apple) => apple.id));
      const apple = (state.appleSpawnPoints ?? []).find((entry) => !activeIds.has(entry.id) && !claimed.has(entry.id));
      if (apple) {
        activeApples = [...activeApples, { ...apple, active: true }];
        appleReplenishCooldown = n(options.appleReplenishSeconds, 6);
        world.emit(D.AppleSpawned, { apple, activeCount: activeApples.length });
      }
    }

    world.setResource(D.OrchardBiomeState, { ...state, activeApples, claimedApples: Array.from(claimed), haunting, appleReplenishCooldown });
  }

  return r.defineRuntimeKit({
    id: options.id ?? "zombie-orchard-biome-kit",
    resources: { OrchardBiomeState: D.OrchardBiomeState },
    events: { OrchardGenerated: D.OrchardGenerated, AppleSpawned: D.AppleSpawned, AppleCollected: D.AppleCollected, HauntedZoneShifted: D.HauntedZoneShifted },
    systems: [{ phase: "simulate", name: "ZombieOrchardBiomeSystem", system }],
    provides: ["zombie-orchard.orchard"],
    initWorld({ world }) {
      const layout = createLayout(options);
      world.setResource(D.OrchardBiomeState, layout);
      world.emit(D.OrchardGenerated, { layout });
    },
    install({ engine }) {
      namespace(engine).orchardBiome = {
        definitions: D,
        createLayout: (config = {}) => createLayout({ ...options, ...config }),
        snapshot: () => engine.world.getResource(D.OrchardBiomeState),
        regenerate(config = {}) {
          const layout = createLayout({ ...options, ...config });
          engine.world.setResource(D.OrchardBiomeState, layout);
          engine.world.emit(D.OrchardGenerated, { layout });
          return layout;
        },
        collectApple(id, payload = {}) {
          engine.world.emit(D.AppleCollected, { id, ...payload });
          return engine.world.getResource(D.OrchardBiomeState);
        },
        setSeason(seasonalVariant) {
          const current = engine.world.getResource(D.OrchardBiomeState) ?? createLayout(options);
          const next = { ...current, seasonId: seasonalVariant, season: SEASONS[seasonalVariant] ?? current.season };
          engine.world.setResource(D.OrchardBiomeState, next);
          return next;
        }
      };
    },
    metadata: { version: ORCHARD_BIOME_KIT_VERSION, domain: "zombie-orchard", purpose: "Tree rows, apple spawn logic, haunted zones, fog lanes, barns, fence loops, seasonal variants, and nav hints." }
  });
}

export const orchardBiomeKitResources = Object.freeze({ OrchardBiomeState: "zombie-orchard.orchard-biome.state" });
export const orchardBiomeKitEvents = Object.freeze({ OrchardGenerated: "zombie-orchard.orchard.generated", AppleSpawned: "zombie-orchard.apple.spawned", AppleCollected: "zombie-orchard.apple.collected", HauntedZoneShifted: "zombie-orchard.haunted-zone.shifted" });
export const orchardBiomeDefaults = Object.freeze({ appleTypes: APPLES, seasons: SEASONS });
