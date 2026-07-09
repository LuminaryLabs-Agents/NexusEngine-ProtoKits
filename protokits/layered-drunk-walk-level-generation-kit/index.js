export const LAYERED_DRUNK_WALK_LEVEL_GENERATION_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashSeed(seed = "stonewake") {
  let hash = 2166136261;
  const text = String(seed);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed = "stonewake") {
  let state = hashSeed(seed) || 1;
  return {
    next() {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range(min, max) {
      return min + this.next() * (max - min);
    },
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    pick(items, fallback = null) {
      const list = asArray(items);
      if (list.length === 0) return fallback;
      return list[Math.floor(this.next() * list.length)];
    }
  };
}

function defaultRequest(request = {}) {
  const targets = request.targets ?? {};
  const bounds = request.bounds ?? {};
  const focusPoints = Math.max(1, Math.floor(toNumber(targets.focusPoints, 3)));
  return {
    seed: request.seed ?? "stonewake-generated-001",
    bounds: {
      width: Math.max(1280, toNumber(bounds.width, 1200 + focusPoints * 760)),
      height: Math.max(720, toNumber(bounds.height, 900)),
      margin: Math.max(32, toNumber(bounds.margin, 80))
    },
    targets: {
      focusPoints,
      finishPoints: Math.max(1, Math.floor(toNumber(targets.finishPoints, 1))),
      routeSegments: Math.max(focusPoints + 3, Math.floor(toNumber(targets.routeSegments, focusPoints * 3 + 4))),
      safeRouteBranches: Math.max(0, Math.floor(toNumber(targets.safeRouteBranches, 1))),
      riskyRouteBranches: Math.max(0, Math.floor(toNumber(targets.riskyRouteBranches, 1))),
      platforms: Math.max(6, Math.floor(toNumber(targets.platforms, focusPoints * 4 + 8))),
      recoveryPlatforms: Math.max(0, Math.floor(toNumber(targets.recoveryPlatforms, focusPoints))),
      chains: Math.max(0, Math.floor(toNumber(targets.chains, focusPoints + 1))),
      heavyBlocks: Math.max(0, Math.floor(toNumber(targets.heavyBlocks, 1))),
      weightedTriggers: Math.max(0, Math.floor(toNumber(targets.weightedTriggers, 1))),
      valves: Math.max(0, Math.floor(toNumber(targets.valves, 1))),
      finishGates: Math.max(1, Math.floor(toNumber(targets.finishGates, 1))),
      creatures: Math.max(0, Math.floor(toNumber(targets.creatures, 1))),
      waterZones: Math.max(0, Math.floor(toNumber(targets.waterZones, 1))),
      torches: Math.max(0, Math.floor(toNumber(targets.torches, focusPoints * 2 + 3))),
      backgroundMachines: Math.max(0, Math.floor(toNumber(targets.backgroundMachines, focusPoints))),
      wallMarks: Math.max(0, Math.floor(toNumber(targets.wallMarks, focusPoints * 3))),
      reactiveEffectAnchors: Math.max(0, Math.floor(toNumber(targets.reactiveEffectAnchors, focusPoints * 8 + 12)))
    },
    style: {
      routeWalk: request.style?.routeWalk ?? "forward-wandering",
      chamberRoundness: clamp(toNumber(request.style?.chamberRoundness, 0.75), 0, 1),
      verticality: clamp(toNumber(request.style?.verticality, 0.55), 0, 1),
      dangerBias: request.style?.dangerBias ?? "lower-route",
      readability: clamp(toNumber(request.style?.readability, 0.9), 0, 1),
      particleDensity: clamp(toNumber(request.style?.particleDensity, 0.85), 0, 1)
    },
    constraints: {
      maxJumpDistance: Math.max(80, toNumber(request.constraints?.maxJumpDistance, 190)),
      maxJumpHeight: Math.max(40, toNumber(request.constraints?.maxJumpHeight, 125)),
      minPlatformWidth: Math.max(64, toNumber(request.constraints?.minPlatformWidth, 100)),
      minFocusSpacing: Math.max(260, toNumber(request.constraints?.minFocusSpacing, 520)),
      requiredRouteAlwaysSafe: request.constraints?.requiredRouteAlwaysSafe !== false,
      doorVisibleBeforeFinalSegment: request.constraints?.doorVisibleBeforeFinalSegment !== false
    },
    goals: clone(request.goals ?? { finish: "sealed-door-escape", requiredBeats: ["activate-plate", "turn-valve", "escape"] })
  };
}

function resolveFocusPath(config, random) {
  const { bounds, targets, style, constraints } = config;
  const points = [];
  const count = targets.focusPoints;
  const usableW = bounds.width - bounds.margin * 2;
  const segment = usableW / (count + 1);
  let lastY = bounds.height * random.range(0.24, 0.38);
  const minY = bounds.margin + 100;
  const maxY = bounds.height - bounds.margin - 190;
  points.push({ id: "start", role: "start", index: 0, x: bounds.margin + random.range(10, 70), y: lastY, required: true });
  for (let index = 1; index <= count; index += 1) {
    const baseX = bounds.margin + segment * index;
    const driftX = random.range(-segment * 0.22, segment * 0.22);
    const verticalStep = random.range(-1, 1) * (120 + 180 * style.verticality);
    const y = clamp(lastY + verticalStep, minY, maxY);
    const rolePool = ["physical-puzzle", "machine-interaction", "water-crossing", "climb", "recovery", "hazard-read" ];
    const role = index === 1 ? "physical-puzzle" : index === 2 ? "machine-interaction" : random.pick(rolePool, "climb");
    points.push({ id: `focus-${index}`, role, index, x: clamp(baseX + driftX, bounds.margin, bounds.width - bounds.margin), y, required: true });
    lastY = y;
  }
  points.push({ id: "finish", role: "finish", index: count + 1, x: bounds.width - bounds.margin - random.range(50, 130), y: clamp(lastY + random.range(-90, 90), minY, maxY), required: true });
  for (let index = 1; index < points.length; index += 1) {
    if (points[index].x - points[index - 1].x < constraints.minFocusSpacing * 0.55) points[index].x = points[index - 1].x + constraints.minFocusSpacing * 0.55;
  }
  points[points.length - 1].x = Math.min(points[points.length - 1].x, bounds.width - bounds.margin - 60);
  return { orderedIds: points.map((point) => point.id), points };
}

function carveChambers(config, focusPath, random) {
  return focusPath.points.map((point, index) => {
    const isEnd = point.role === "start" || point.role === "finish";
    return {
      id: `chamber-${point.id}`,
      focusId: point.id,
      role: point.role,
      center: { x: Math.round(point.x), y: Math.round(point.y) },
      radiusX: Math.round(random.range(isEnd ? 170 : 220, isEnd ? 230 : 330)),
      radiusY: Math.round(random.range(isEnd ? 120 : 145, isEnd ? 170 : 230)),
      roundness: config.style.chamberRoundness,
      order: index
    };
  });
}

function createPlatform(id, x, y, w, h = 30, role = "route", focusId = null) {
  return { id, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), role, focusId, edge: true };
}

function buildPlatforms(config, focusPath, chambers, random) {
  const platforms = [
    createPlatform("left-wall", 0, 0, 42, config.bounds.height, "boundary"),
    createPlatform("right-wall", config.bounds.width - 42, 0, 42, config.bounds.height, "boundary"),
    createPlatform("floor", 42, config.bounds.height - 40, config.bounds.width - 84, 48, "floor")
  ];
  const routeNodes = [];
  let id = 0;
  for (const chamber of chambers) {
    const platformWidth = random.range(config.constraints.minPlatformWidth + 45, config.constraints.minPlatformWidth + 150);
    const baseY = clamp(chamber.center.y + random.range(40, 96), 160, config.bounds.height - 190);
    const platform = createPlatform(`platform-${String(++id).padStart(3, "0")}`, chamber.center.x - platformWidth / 2, baseY, platformWidth, 30, chamber.role === "finish" ? "exit" : chamber.role === "start" ? "start" : "focus", chamber.focusId);
    platforms.push(platform);
    routeNodes.push({ id: platform.id, focusId: chamber.focusId, x: platform.x + platform.w / 2, y: platform.y, role: platform.role });
  }
  for (let index = 0; index < routeNodes.length - 1; index += 1) {
    const from = routeNodes[index];
    const to = routeNodes[index + 1];
    const dx = to.x - from.x;
    const steps = Math.max(1, Math.ceil(dx / config.constraints.maxJumpDistance));
    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      const x = from.x + dx * t + random.range(-35, 35);
      const y = from.y + (to.y - from.y) * t + random.range(-config.constraints.maxJumpHeight * 0.35, config.constraints.maxJumpHeight * 0.35);
      platforms.push(createPlatform(`platform-${String(++id).padStart(3, "0")}`, x - random.range(55, 95), clamp(y, 150, config.bounds.height - 180), random.range(120, 190), 28, "route-helper", from.focusId));
    }
  }
  for (let index = 0; index < config.targets.recoveryPlatforms; index += 1) {
    const point = random.pick(focusPath.points.slice(1, -1), focusPath.points[1]);
    platforms.push(createPlatform(`platform-${String(++id).padStart(3, "0")}`, point.x + random.range(-180, 180), clamp(point.y + random.range(140, 220), 240, config.bounds.height - 120), random.range(105, 160), 26, "recovery", point.id));
  }
  return { platforms, routeNodes };
}

function generateSlots(config, focusPath, routeNodes, random) {
  const slots = [];
  const slot = (id, role, focusId, x, y, data = {}) => slots.push({ id, role, focusId, position: { x: Math.round(x), y: Math.round(y) }, ...data });
  const byFocus = new Map(routeNodes.map((node) => [node.focusId, node]));
  const start = byFocus.get("start") ?? routeNodes[0];
  const finish = byFocus.get("finish") ?? routeNodes[routeNodes.length - 1];
  slot("slot.start", "player-spawn", "start", start.x - 70, start.y - 50);
  slot("slot.finish", "finish-gate", "finish", finish.x + 85, finish.y - 148);
  slot("slot.exit-trigger", "exit-trigger", "finish", finish.x + 118, finish.y - 30);
  const focusPoints = focusPath.points.filter((point) => point.id.startsWith("focus-"));
  for (const point of focusPoints) {
    const node = byFocus.get(point.id);
    if (!node) continue;
    const role = point.role;
    slot(`slot.${point.id}.primary`, role, point.id, node.x, node.y - 46);
    slot(`slot.${point.id}.support`, `${role}-support`, point.id, node.x - random.range(130, 210), node.y - 52);
    slot(`slot.${point.id}.exit`, `${role}-exit`, point.id, node.x + random.range(120, 210), node.y - 40);
    slot(`slot.${point.id}.effect`, "effect-anchor", point.id, node.x, node.y - 82);
    if (role === "physical-puzzle") {
      slot("slot.weighted-trigger", "weighted-trigger", point.id, node.x + 80, node.y - 8);
      slot("slot.heavy-block", "heavy-block", point.id, node.x - 150, node.y - 58);
    }
    if (role === "machine-interaction") {
      slot("slot.valve", "valve", point.id, node.x + 95, node.y - 92);
      slot("slot.machine-wheel", "machine-wheel", point.id, node.x - 20, node.y - 82);
    }
  }
  const lowY = config.bounds.height - 110;
  slot("slot.creature-patrol", "creature-patrol", "lower-route", config.bounds.width * 0.38, lowY, { bounds: { x: Math.round(config.bounds.width * 0.22), y: Math.round(lowY - 40), w: Math.round(config.bounds.width * 0.58), h: 80 } });
  for (let index = 0; index < config.targets.chains; index += 1) {
    const node = routeNodes[clamp(1 + index, 1, routeNodes.length - 1)] ?? routeNodes[0];
    slot(`slot.chain.${index + 1}`, "chain", node.focusId, node.x + random.range(-60, 60), clamp(node.y - random.range(130, 260), 110, config.bounds.height - 260), { h: Math.round(random.range(180, 300)) });
  }
  return slots;
}

function findSlot(slots, role, fallbackRole = null) {
  return slots.find((slot) => slot.role === role) ?? slots.find((slot) => slot.role === fallbackRole) ?? null;
}

function assignObjects(config, slots) {
  const objects = [];
  const add = (id, type, slot, extra = {}) => {
    if (!slot) return;
    objects.push({ id, type, slotId: slot.id, x: slot.position.x, y: slot.position.y, ...extra });
  };
  add("player", "player", findSlot(slots, "player-spawn"));
  for (let index = 0; index < config.targets.heavyBlocks; index += 1) add(`heavy-block-${index + 1}`, "heavy-block", findSlot(slots, "heavy-block", "physical-puzzle-support"), { weight: 5 });
  for (let index = 0; index < config.targets.weightedTriggers; index += 1) add(`weighted-trigger-${index + 1}`, "weighted-trigger", findSlot(slots, "weighted-trigger", "physical-puzzle"), { requiredWeight: 4 });
  for (let index = 0; index < config.targets.valves; index += 1) add(`valve-${index + 1}`, "valve", findSlot(slots, "valve", "machine-interaction"));
  for (let index = 0; index < config.targets.finishGates; index += 1) add(`finish-gate-${index + 1}`, "finish-gate", findSlot(slots, "finish-gate"));
  for (let index = 0; index < config.targets.creatures; index += 1) {
    const slot = findSlot(slots, "creature-patrol");
    add(`creature-${index + 1}`, "sensory-creature", slot, { patrolBounds: clone(slot?.bounds) });
  }
  for (const slot of slots.filter((item) => item.role === "chain")) add(slot.id.replace("slot.", ""), "chain", slot, { h: slot.h });
  return objects;
}

function buildPuzzle(config, objects) {
  const facts = [];
  if (objects.some((object) => object.type === "weighted-trigger")) facts.push({ id: "weighted-trigger-active", sourceType: "weighted-trigger", statePath: "active" });
  if (objects.some((object) => object.type === "valve")) facts.push({ id: "valve-complete", sourceType: "valve", statePath: "complete" });
  return {
    complexity: "simple-two-condition",
    facts,
    gates: objects.filter((object) => object.type === "finish-gate").map((object) => ({ id: `${object.id}-condition`, objectId: object.id, mode: "all", conditions: facts.map((fact) => fact.id), reversible: true }))
  };
}

function placeHazards(config, slots) {
  const hazards = [];
  if (config.targets.waterZones > 0) hazards.push({ id: "rising-water", type: "rising-water", startLevel: Math.round(config.bounds.height - 42), speed: 3.5, acceleratedSpeed: 7.2, band: { x: 0, y: Math.round(config.bounds.height - 160), w: config.bounds.width, h: 160 } });
  const creatureSlot = findSlot(slots, "creature-patrol");
  if (config.targets.creatures > 0 && creatureSlot) hazards.push({ id: "creature-danger-zone", type: "creature-patrol", bounds: clone(creatureSlot.bounds), lowerRouteOnly: true });
  hazards.push({ id: "drown-boundary", type: "water-submerge" });
  return hazards;
}

function placeDressingAndEffects(config, slots, random) {
  const dressing = [];
  const effects = [];
  const readableSlots = slots.filter((slot) => ["valve", "weighted-trigger", "finish-gate", "player-spawn", "chain"].includes(slot.role) || slot.role.includes("effect"));
  for (let index = 0; index < config.targets.torches; index += 1) {
    const slot = random.pick(readableSlots, slots[0]);
    dressing.push({ id: `torch-${index + 1}`, type: "torch", x: Math.round(slot.position.x + random.range(-80, 80)), y: Math.round(slot.position.y - random.range(20, 90)), purpose: "readability" });
  }
  for (let index = 0; index < config.targets.wallMarks; index += 1) {
    dressing.push({ id: `wall-mark-${index + 1}`, type: "watermark", x: Math.round(random.range(config.bounds.margin, config.bounds.width - config.bounds.margin)), y: Math.round(config.bounds.height - 160 - index * 24), purpose: "water-readability" });
  }
  const effectRoles = ["door-glow", "rune-spark", "dust-cloud", "water-mist", "sound-wave", "alert-pulse", "foam-line", "lantern-mote"];
  for (let index = 0; index < config.targets.reactiveEffectAnchors; index += 1) {
    const slot = random.pick(readableSlots, slots[0]);
    effects.push({ id: `effect-${index + 1}`, type: random.pick(effectRoles), slotId: slot.id, x: slot.position.x, y: slot.position.y, activeWhen: slot.role });
  }
  return { dressing, effects };
}

function validateAndRepair(config, level) {
  const passes = [];
  const warnings = [];
  const failures = [];
  if (level.focusPath.points.length >= config.targets.focusPoints + 2) passes.push("focus-count-satisfied"); else failures.push("missing-focus-points");
  if (level.platforms.length >= config.targets.platforms * 0.6) passes.push("platform-density-ok"); else warnings.push("platform-density-low");
  if (level.objects.some((object) => object.type === "finish-gate")) passes.push("finish-gate-present"); else failures.push("finish-gate-missing");
  if (level.objects.some((object) => object.type === "valve")) passes.push("valve-present");
  if (level.objects.some((object) => object.type === "weighted-trigger")) passes.push("weighted-trigger-present");
  if (level.hazards.some((hazard) => hazard.type === "rising-water")) passes.push("water-pressure-present");
  if (config.constraints.requiredRouteAlwaysSafe) passes.push("safe-route-required");
  const status = failures.length ? "fail" : warnings.length ? "pass-with-warning" : "pass";
  return { status, passes, warnings, failures };
}

export function generateLayeredDrunkWalkLevel(request = {}) {
  const config = defaultRequest(request);
  const random = createRandom(config.seed);
  const focusPath = resolveFocusPath(config, random);
  const chambers = carveChambers(config, focusPath, random);
  const { platforms, routeNodes } = buildPlatforms(config, focusPath, chambers, random);
  const slots = generateSlots(config, focusPath, routeNodes, random);
  const objects = assignObjects(config, slots);
  const puzzle = buildPuzzle(config, objects);
  const hazards = placeHazards(config, slots);
  const { dressing, effects } = placeDressingAndEffects(config, slots, random);
  const level = {
    id: request.id ?? `generated-${config.seed}`,
    version: LAYERED_DRUNK_WALK_LEVEL_GENERATION_KIT_VERSION,
    generator: "layered-drunk-walk-level-generation-kit",
    request: clone(config),
    bounds: clone(config.bounds),
    focusPath,
    chambers,
    routeGraph: { nodes: routeNodes, links: routeNodes.slice(0, -1).map((node, index) => ({ from: node.id, to: routeNodes[index + 1].id, type: "jump-or-walk", difficulty: "forgiving" })) },
    platforms,
    slots,
    objects,
    puzzle,
    hazards,
    dressing,
    effects,
    validation: null
  };
  level.validation = validateAndRepair(config, level);
  return level;
}

function requireNexus(NexusEngine, factoryName) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`${factoryName} requires NexusEngine.${key}.`);
  }
}

function ensureNamespace(engine, namespace) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[namespace] || typeof engine.n[namespace] !== "object") engine.n[namespace] = {};
  return engine.n[namespace];
}

export function createLayeredDrunkWalkLevelGenerationKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine, "createLayeredDrunkWalkLevelGenerationKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const LevelGenerationState = defineResource(config.resourceName ?? "layeredDrunkWalkLevelGeneration.state");
  const LevelGenerated = defineEvent("layeredDrunkWalkLevelGeneration.generated");
  const LevelRejected = defineEvent("layeredDrunkWalkLevelGeneration.rejected");
  const initialRequest = clone(config.defaultRequest ?? {});
  return defineRuntimeKit({
    id: config.kitId ?? "layered-drunk-walk-level-generation-kit",
    provides: ["level-generation:layered-drunk-walk", "level:recipe", "placement:slots", "validation:level-layout"],
    resources: { LevelGenerationState },
    events: { LevelGenerated, LevelRejected },
    systems: [],
    initWorld({ world }) {
      const level = generateLayeredDrunkWalkLevel(initialRequest);
      world.setResource(LevelGenerationState, { version: LAYERED_DRUNK_WALK_LEVEL_GENERATION_KIT_VERSION, level, lastRequest: initialRequest, status: level.validation.status });
    },
    install({ engine, world }) {
      const api = {
        resources: { LevelGenerationState },
        events: { LevelGenerated, LevelRejected },
        generate(request = {}) {
          const level = generateLayeredDrunkWalkLevel(request);
          const state = { version: LAYERED_DRUNK_WALK_LEVEL_GENERATION_KIT_VERSION, level, lastRequest: clone(request), status: level.validation.status };
          world.setResource(LevelGenerationState, state);
          world.emit?.(LevelGenerated, { id: level.id, status: level.validation.status, platformCount: level.platforms.length, objectCount: level.objects.length, focusCount: level.focusPath.points.length });
          return clone(level);
        },
        getState() { return clone(world.getResource(LevelGenerationState)); },
        getLevel() { return clone(world.getResource(LevelGenerationState)?.level); }
      };
      engine.layeredDrunkWalkLevelGeneration = api;
      Object.assign(ensureNamespace(engine, "layeredDrunkWalkLevelGeneration") ?? {}, api);
    },
    metadata: {
      version: LAYERED_DRUNK_WALK_LEVEL_GENERATION_KIT_VERSION,
      domain: "layered-drunk-walk-level-generation",
      layer: "composite-domain",
      extendsBase: "DomainServiceKit",
      ownsLoop: false,
      boundary: "Owns deterministic target-driven level recipe generation from bounds, counts, biased focus walks, slots, hazards, effects, and validation. It does not own runtime gameplay, renderer drawing, DOM input, or exact author-authored object coordinates."
    }
  });
}

export default createLayeredDrunkWalkLevelGenerationKit;
