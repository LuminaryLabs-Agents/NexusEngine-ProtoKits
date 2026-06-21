import { clamp, createSeededRandom, defineInjectedRuntimeKit, hashString, number } from "../foundation-kit/index.js";

export const AERIAL_CANYON_KITS_VERSION = "0.1.0";
export const CANYON_TERRAIN_DOMAIN_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const FLIGHT_CORRIDOR_DOMAIN_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const POWERED_AERIAL_FLIGHT_DOMAIN_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const AERIAL_VEGETATION_PLACEMENT_DOMAIN_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const AERIAL_PROCEDURAL_OBJECT_DOMAIN_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const AERIAL_PROJECTILE_SYSTEM_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const AERIAL_COMBAT_DOMAIN_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const AERIAL_ENCOUNTER_DIRECTOR_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;
export const AERIAL_MISSION_SEQUENCE_KIT_VERSION = AERIAL_CANYON_KITS_VERSION;

const TAU = Math.PI * 2;
const DEFAULT_SEED = "sky-rogue-aerial-canyon";
const DEFAULT_PLANES = Object.freeze([
  { id: "p80-fury", label: "P-80 Fury", baseSpeed: 108, maxSpeed: 198, maxHealth: 100, agility: 1, color: "#c22b1d", accent: "#f59e0b" },
  { id: "iron-behemoth", label: "Iron Behemoth", baseSpeed: 84, maxSpeed: 150, maxHealth: 180, agility: 0.62, color: "#3f3f46", accent: "#ea580c" },
  { id: "a12-interceptor", label: "A-12 Interceptor", baseSpeed: 124, maxSpeed: 235, maxHealth: 82, agility: 0.88, color: "#1e3a8a", accent: "#10b981" }
]);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function arr(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function vec3(value = {}, fallback = {}) {
  return {
    x: number(value.x, number(fallback.x, 0)),
    y: number(value.y, number(fallback.y, 0)),
    z: number(value.z, number(fallback.z, 0))
  };
}

function add3(a = {}, b = {}) {
  return { x: number(a.x) + number(b.x), y: number(a.y) + number(b.y), z: number(a.z) + number(b.z) };
}

function mul3(v = {}, scalar = 1) {
  return { x: number(v.x) * scalar, y: number(v.y) * scalar, z: number(v.z) * scalar };
}

function len3(v = {}) {
  return Math.hypot(number(v.x), number(v.y), number(v.z));
}

function norm3(v = {}, fallback = { x: 0, y: 0, z: 1 }) {
  const length = len3(v);
  return length > 0.000001 ? { x: number(v.x) / length, y: number(v.y) / length, z: number(v.z) / length } : { ...fallback };
}

function mix(a, b, t) {
  return number(a) + (number(b) - number(a)) * clamp(t, 0, 1);
}

function approach(a, b, rate, dt) {
  return mix(a, b, 1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt)));
}

function dtOf(world, max = 1 / 20) {
  return clamp(number(world.__nexusClock?.delta, 1 / 60), 0, max);
}

function yawForward(yaw = 0, pitch = 0) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return norm3({ x: sy * cp, y: -sp, z: cy * cp });
}

function smootherStep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function stableUnit(seed) {
  return (hashString(seed) % 1000003) / 1000003;
}

function valueNoise2D(x, z, seed = 0) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smootherStep(x - ix);
  const fz = smootherStep(z - iz);
  const h = (x0, z0) => stableUnit(`${seed}:${x0}:${z0}`);
  const a = h(ix, iz);
  const b = h(ix + 1, iz);
  const c = h(ix, iz + 1);
  const d = h(ix + 1, iz + 1);
  return mix(mix(a, b, fx), mix(c, d, fx), fz);
}

function fbm2D(x, z, seed = 0, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise2D(x * freq, z * freq, `${seed}:${i}`) * amp;
    norm += amp;
    amp *= 0.52;
    freq *= 2.03;
  }
  return norm ? sum / norm : 0;
}

function baseCorridorWeight(x, z, config = {}) {
  const width = number(config.width, number(config.corridorWidth, 330))
    + Math.sin(z * 0.00082) * number(config.widthWaveA, 90)
    + Math.sin(z * 0.00023 + 1.9) * number(config.widthWaveB, 70);
  const centerX = Math.sin(z * 0.00037) * number(config.centerWaveX, 80);
  const d = Math.abs(number(x) - centerX) / Math.max(80, width);
  return Math.exp(-d * d * number(config.falloff, 1.55));
}

function terrainHeightFormula(x, z, config = {}) {
  const seed = config.seed ?? DEFAULT_SEED;
  const seedShift = (hashString(seed) % 100003) * 0.000013;
  const cw = baseCorridorWeight(x, z, config.corridor ?? config);
  const side = 1 - cw;
  const farSide = clamp((Math.abs(x) - number(config.corridorShoulder, 320)) / number(config.mountainRiseDistance, 1600), 0, 1);
  const canyonRipple = Math.sin((x + seedShift * 9000) * number(config.rippleScaleX, 0.0021)) * 10
    + Math.cos((z - seedShift * 6000) * number(config.rippleScaleZ, 0.0017)) * 8;
  const erosion = (fbm2D(x * 0.0032 + seedShift, z * 0.0032 - seedShift, `${seed}:erosion`, 4) - 0.5) * number(config.erosionHeight, 42);
  const ridgeNoise = fbm2D(x * 0.0007 + 17, z * 0.0007 - 9, `${seed}:ridge`, 5);
  const mountainNoise = fbm2D(x * 0.00031 - 41, z * 0.00031 + 23, `${seed}:mountain`, 5);
  const ridgeStripes = Math.pow(Math.abs(Math.sin(x * 0.00215 + mountainNoise * 5.5 + seedShift * 100)), 2.4);
  const cliffLift = Math.pow(farSide, 1.28) * (number(config.cliffBase, 170) + mountainNoise * number(config.mountainHeight, 470));
  const ridgeLift = Math.pow(clamp(ridgeNoise * 1.3 - 0.18, 0, 1), 2.1)
    * (number(config.ridgeBase, 110) + ridgeStripes * number(config.ridgeHeight, 360)) * side;
  const mesaShelf = Math.floor((mountainNoise * 6.0 + 1.5)) * number(config.mesaShelfStep, 18) * side * farSide;
  const corridorFloor = number(config.canyonFloorBase, -10) + canyonRipple * 0.45 + erosion * 0.2;
  const height = corridorFloor + cliffLift + ridgeLift + mesaShelf + canyonRipple * side + erosion * side;
  return clamp(height, number(config.minHeight, -42), number(config.maxHeight, 920));
}

function terrainNormalFormula(x, z, config = {}) {
  const eps = number(config.normalEpsilon, 6);
  const hL = terrainHeightFormula(x - eps, z, config);
  const hR = terrainHeightFormula(x + eps, z, config);
  const hD = terrainHeightFormula(x, z - eps, config);
  const hU = terrainHeightFormula(x, z + eps, config);
  return norm3({ x: hL - hR, y: eps * 2, z: hD - hU }, { x: 0, y: 1, z: 0 });
}

function terrainSlopeFormula(x, z, config = {}) {
  return 1 - clamp(terrainNormalFormula(x, z, config).y, 0, 1);
}

function patchAtFormula(x, z, config = {}) {
  const h = terrainHeightFormula(x, z, config);
  const cw = baseCorridorWeight(x, z, config.corridor ?? config);
  const n = fbm2D(x * 0.00072 + 71, z * 0.00072 - 19, `${config.seed ?? DEFAULT_SEED}:patch`, 4);
  if (cw > 0.68 && h < 90) return "red-canyon-floor";
  if (h > 520 && n > 0.56) return "high-desert-forest";
  if (h > 420) return "mountain-slope";
  if (n > 0.74) return "mesa-plateau";
  if (n < 0.18) return "dry-riverbed";
  if (n > 0.62) return "sandstone-ridge";
  if (n < 0.31) return "dead-tree-slope";
  return "black-rock-field";
}

function materialAtFormula(x, z, config = {}) {
  const patch = patchAtFormula(x, z, config);
  return config.patchMaterials?.[patch] ?? patch;
}

function patchColor(patch, config = {}) {
  const palette = {
    "red-canyon-floor": "#884111",
    "sandstone-ridge": "#b65a1e",
    "mesa-plateau": "#d1792a",
    "mountain-slope": "#6f371b",
    "dry-riverbed": "#9d6a32",
    "black-rock-field": "#3f2b24",
    "high-desert-forest": "#5f4c2a",
    "dead-tree-slope": "#5b422c",
    "storm-front-zone": "#4b2f3a",
    ...(config.patchColors ?? {})
  };
  return palette[patch] ?? "#8a3f12";
}

function defineResource(NexusRealtime, name) {
  return typeof NexusRealtime.defineResource === "function" ? NexusRealtime.defineResource(name) : `resource:${name}`;
}

function defineEvent(NexusRealtime, name) {
  return typeof NexusRealtime.defineEvent === "function" ? NexusRealtime.defineEvent(name) : `event:${name}`;
}

function runtimeKit(NexusRealtime, config) {
  return defineInjectedRuntimeKit(NexusRealtime, config);
}

function installGetterApi(engine, key, world, State, extra = {}) {
  engine[key] = {
    getState: () => world.getResource(State),
    getSnapshot: () => clone(world.getResource(State)),
    ...extra
  };
  return engine[key];
}

export function createCanyonTerrainDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "canyonTerrain.state");
  const terrainConfig = { seed: DEFAULT_SEED, ...config };
  function initialState() {
    return {
      id: config.id ?? "canyon-terrain",
      version: CANYON_TERRAIN_DOMAIN_KIT_VERSION,
      seed: terrainConfig.seed,
      config: clone(terrainConfig),
      samples: []
    };
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "canyon-terrain-domain-kit",
    provides: ["terrain:height-sampler", "terrain:normal-sampler", "terrain:material-sampler", "terrain:patch-classifier", "terrain:corridor-field"],
    resources: { State },
    systems: [],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installGetterApi(engine, "canyonTerrain", world, State, {
        heightAt: (x = 0, z = 0) => terrainHeightFormula(number(x), number(z), terrainConfig),
        normalAt: (x = 0, z = 0) => terrainNormalFormula(number(x), number(z), terrainConfig),
        slopeAt: (x = 0, z = 0) => terrainSlopeFormula(number(x), number(z), terrainConfig),
        patchAt: (x = 0, z = 0) => patchAtFormula(number(x), number(z), terrainConfig),
        materialAt: (x = 0, z = 0) => materialAtFormula(number(x), number(z), terrainConfig),
        corridorWeight: (x = 0, z = 0) => baseCorridorWeight(number(x), number(z), terrainConfig.corridor ?? terrainConfig),
        patchColor: (patch) => patchColor(patch, terrainConfig),
        sample(x = 0, z = 0) {
          return {
            x: number(x),
            y: terrainHeightFormula(number(x), number(z), terrainConfig),
            z: number(z),
            normal: terrainNormalFormula(number(x), number(z), terrainConfig),
            slope: terrainSlopeFormula(number(x), number(z), terrainConfig),
            patch: patchAtFormula(number(x), number(z), terrainConfig),
            material: materialAtFormula(number(x), number(z), terrainConfig),
            corridorWeight: baseCorridorWeight(number(x), number(z), terrainConfig.corridor ?? terrainConfig)
          };
        }
      });
      engine.genericTerrainSampler ??= engine.canyonTerrain;
    },
    metadata: { version: CANYON_TERRAIN_DOMAIN_KIT_VERSION, domain: "canyon-terrain", purpose: "Deterministic canyon terrain height, normal, slope, material, patch, and corridor sampling." }
  });
}

export function createFlightCorridorDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "flightCorridor.state");
  function initialState() {
    return {
      id: config.id ?? "flight-corridor",
      version: FLIGHT_CORRIDOR_DOMAIN_KIT_VERSION,
      config: {
        cruiseAgl: number(config.cruiseAgl, 100),
        minimumSafeAgl: number(config.minimumSafeAgl, 35),
        width: number(config.width, 330),
        preloadAhead: number(config.preloadAhead, 4),
        routeCenterWaveX: number(config.routeCenterWaveX, 80)
      }
    };
  }
  let installedEngine = null;
  function routeCenterAt(z = 0) {
    return Math.sin(number(z) * number(config.centerFrequency, 0.00037)) * number(config.routeCenterWaveX, 80);
  }
  function sample(x = 0, z = 0) {
    const terrain = installedEngine?.canyonTerrain ?? installedEngine?.genericTerrainSampler;
    const ground = number(terrain?.heightAt?.(x, z), 0);
    const centerX = routeCenterAt(z);
    const weight = baseCorridorWeight(number(x) - centerX, z, config);
    return {
      x: number(x),
      z: number(z),
      centerX,
      ground,
      corridorWeight: weight,
      routePressure: 1 - weight,
      cruiseAltitude: ground + number(config.cruiseAgl, 100),
      minimumSafeAltitude: ground + number(config.minimumSafeAgl, 35),
      thinVegetation: weight > number(config.vegetationThinWeight, 0.62),
      thinSpire: weight > number(config.spireThinWeight, 0.55)
    };
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "flight-corridor-domain-kit",
    requires: ["terrain:height-sampler"],
    provides: ["flight:corridor", "route:field", "terrain:route-shaping"],
    resources: { State },
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installedEngine = engine;
      installGetterApi(engine, "flightCorridor", world, State, {
        sample,
        routeCenterAt,
        safeAltitudeAt: (x = 0, z = 0) => sample(x, z).cruiseAltitude,
        minimumSafeAltitudeAt: (x = 0, z = 0) => sample(x, z).minimumSafeAltitude,
        corridorWeightAt: (x = 0, z = 0) => sample(x, z).corridorWeight
      });
    },
    metadata: { version: FLIGHT_CORRIDOR_DOMAIN_KIT_VERSION, domain: "flight-corridor", purpose: "Readable aerial route corridor, safe altitude, and route pressure service." }
  });
}

export function createPoweredAerialFlightDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "poweredAerialFlight.state");
  const SetInput = defineEvent(NexusRealtime, "poweredAerialFlight.setInput");
  const Reset = defineEvent(NexusRealtime, "poweredAerialFlight.reset");
  const Crashed = defineEvent(NexusRealtime, "poweredAerialFlight.crashed");
  const FireRequested = defineEvent(NexusRealtime, "poweredAerialFlight.fireRequested");
  let installedEngine = null;
  const planes = Object.freeze((config.planes ?? DEFAULT_PLANES).map((plane, index) => ({ id: plane.id ?? `plane-${index + 1}`, ...plane })));
  function initialState(overrides = {}) {
    const plane = planes.find((entry) => entry.id === (overrides.planeId ?? config.defaultPlaneId)) ?? planes[0];
    const x = number(overrides.x, 0);
    const z = number(overrides.z, 0);
    const terrain = installedEngine?.canyonTerrain ?? installedEngine?.genericTerrainSampler;
    const ground = number(terrain?.heightAt?.(x, z), 0);
    return {
      id: config.id ?? "powered-aerial-flight",
      version: POWERED_AERIAL_FLIGHT_DOMAIN_KIT_VERSION,
      planeId: plane.id,
      plane,
      status: "ready",
      input: { pitch: 0, roll: 0, yaw: 0, boost: false, fire: false },
      body: {
        position: { x, y: ground + number(config.cruiseAgl, 100), z },
        velocity: { x: 0, y: 0, z: number(plane.baseSpeed, 108) },
        rotation: { pitch: 0, yaw: 0, roll: 0 },
        speed: number(plane.baseSpeed, 108),
        agl: number(config.cruiseAgl, 100),
        health: number(plane.maxHealth, 100),
        maxHealth: number(plane.maxHealth, 100),
        boostHeat: 0,
        fireRequested: false,
        crashed: false,
        lastGroundHeight: ground
      },
      frame: 0,
      lastReason: "initialized"
    };
  }
  function system(world) {
    let state = world.getResource(State) ?? initialState();
    for (const event of world.readEvents(Reset)) state = initialState(event);
    for (const event of world.readEvents(SetInput)) {
      state = {
        ...state,
        input: {
          pitch: clamp(number(event.pitch), -1, 1),
          roll: clamp(number(event.roll ?? event.bank), -1, 1),
          yaw: clamp(number(event.yaw), -1, 1),
          boost: Boolean(event.boost),
          fire: Boolean(event.fire)
        }
      };
    }
    const dt = dtOf(world);
    const body = clone(state.body);
    const plane = state.plane;
    const terrain = installedEngine?.canyonTerrain ?? installedEngine?.genericTerrainSampler;
    const corridor = installedEngine?.flightCorridor;
    const agility = number(plane.agility, 1);
    const input = state.input ?? {};
    const baseSpeed = number(plane.baseSpeed, 108);
    const maxSpeed = number(plane.maxSpeed, 198);
    const cruiseAgl = number(config.cruiseAgl, 100);
    const pitchTarget = clamp(number(input.pitch) * number(config.maxPitch, 0.72), -number(config.pitchClamp, 0.86), number(config.pitchClamp, 0.86));
    const rollTarget = clamp(number(input.roll) * number(config.maxRoll, 0.95), -number(config.rollClamp, 1.08), number(config.rollClamp, 1.08));
    body.rotation.pitch = approach(body.rotation.pitch, pitchTarget, number(config.pitchResponse, 5) * agility, dt);
    body.rotation.roll = approach(body.rotation.roll, rollTarget, number(config.rollResponse, 5.2) * agility, dt);
    body.rotation.yaw += number(input.yaw) * number(config.yawRate, 1.38) * dt * agility;
    body.rotation.yaw -= body.rotation.roll * number(config.bankYaw, 0.4) * dt;
    const boosting = Boolean(input.boost) && body.boostHeat < 100;
    body.boostHeat = clamp(body.boostHeat + (boosting ? number(config.boostHeatPerSecond, 47) : -number(config.boostCoolPerSecond, 32)) * dt, 0, 100);
    const targetSpeed = boosting ? maxSpeed : body.boostHeat >= 99 ? baseSpeed * number(config.overheatSpeedScale, 0.65) : baseSpeed;
    body.speed = approach(body.speed, targetSpeed, number(config.speedResponse, 3.8), dt);
    const forward = yawForward(body.rotation.yaw, body.rotation.pitch);
    const idealVelocity = mul3(forward, body.speed);
    body.velocity = {
      x: approach(body.velocity.x, idealVelocity.x, number(config.velocityResponse, 3.9), dt),
      y: approach(body.velocity.y, idealVelocity.y, number(config.verticalVelocityResponse, 2.8), dt),
      z: approach(body.velocity.z, idealVelocity.z, number(config.velocityResponse, 3.9), dt)
    };
    body.position = add3(body.position, mul3(body.velocity, dt));
    const ground = number(terrain?.heightAt?.(body.position.x, body.position.z), 0);
    const corridorSample = corridor?.sample?.(body.position.x, body.position.z);
    const minimumSafeY = number(corridorSample?.minimumSafeAltitude, ground + number(config.minimumSafeAgl, 35));
    const cruiseY = number(corridorSample?.cruiseAltitude, ground + cruiseAgl);
    if (Math.abs(number(input.pitch)) < 0.12) body.position.y = approach(body.position.y, cruiseY, number(config.cruiseHoldRate, 0.65), dt);
    body.position.y = clamp(body.position.y, minimumSafeY - 8, ground + number(config.maxAgl, 1400));
    body.agl = body.position.y - ground;
    body.lastGroundHeight = ground;
    body.fireRequested = Boolean(input.fire);
    if (body.position.y <= minimumSafeY - 5 && !body.crashed) {
      body.crashed = true;
      state = { ...state, status: "failed", lastReason: "terrain-safe-envelope" };
      world.emit(Crashed, { id: state.id, reason: "terrain-safe-envelope", position: body.position, agl: body.agl });
    }
    if (body.fireRequested) world.emit(FireRequested, { sourceId: "player", position: body.position, rotation: body.rotation, velocity: body.velocity });
    state = { ...state, body, frame: state.frame + 1 };
    world.setResource(State, state);
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "powered-aerial-flight-domain-kit",
    requires: ["terrain:height-sampler", "flight:corridor"],
    provides: ["aerial:powered-flight", "aerial:body", "input:flight", "combat:fire-request"],
    resources: { State },
    events: { SetInput, Reset, Crashed, FireRequested },
    systems: [{ phase: "simulate", name: "poweredAerialFlightSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installedEngine = engine;
      installGetterApi(engine, "poweredAerialFlight", world, State, {
        events: { SetInput, Reset, Crashed, FireRequested },
        setInput(input = {}) { world.emit(SetInput, input); return world.getResource(State); },
        reset(payload = {}) { world.emit(Reset, payload); return world.getResource(State); },
        getBody() { return world.getResource(State)?.body ?? null; },
        getRenderDescriptor() {
          const state = world.getResource(State);
          return state ? { id: "player-plane", kind: "aerial-body", planeId: state.planeId, plane: state.plane, transform: { position: state.body.position, rotation: state.body.rotation }, body: state.body } : null;
        }
      });
      engine.genericFlightInput ??= { setInput: engine.poweredAerialFlight.setInput };
      engine.genericAerialBody ??= { getActiveBody: engine.poweredAerialFlight.getBody, reset: engine.poweredAerialFlight.reset, getState: engine.poweredAerialFlight.getState };
    },
    metadata: { version: POWERED_AERIAL_FLIGHT_DOMAIN_KIT_VERSION, domain: "powered-aerial-flight", purpose: "Powered aircraft flight, boost, terrain-relative cruise, and AGL safety state." }
  });
}

function getTerrainPatches(engine, config = {}) {
  const streamer = engine.terrainStreamer ?? engine.genericWorldPatch;
  const patches = streamer?.getState?.()?.patches ?? streamer?.getState?.()?.activeChunks ?? null;
  if (Array.isArray(patches) && patches.length) return patches;
  const body = engine.poweredAerialFlight?.getBody?.() ?? { position: { x: 0, z: 0 } };
  const size = number(config.patchSize, 768);
  const radius = number(config.fallbackRadius, 2);
  const cx = Math.round(number(body.position?.x) / size);
  const cz = Math.round(number(body.position?.z) / size);
  const out = [];
  for (let dz = -radius; dz <= radius; dz += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const px = cx + dx;
      const pz = cz + dz;
      const centerX = px * size;
      const centerZ = pz * size;
      out.push({ id: `near:${px},${pz}`, key: `near:${px},${pz}`, lod: Math.max(Math.abs(dx), Math.abs(dz)) <= 1 ? "near" : "mid", px, pz, size, center: { x: centerX, z: centerZ }, interactive: true });
    }
  }
  return out;
}

function patchBounds(patch = {}, sizeFallback = 768) {
  const size = number(patch.size ?? patch.bounds?.size, sizeFallback);
  const centerX = number(patch.center?.x ?? patch.x ?? patch.px * size);
  const centerZ = number(patch.center?.z ?? patch.z ?? patch.pz * size);
  return { size, minX: centerX - size / 2, minZ: centerZ - size / 2, centerX, centerZ };
}

export function createAerialVegetationPlacementDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialVegetationPlacement.state");
  let installedEngine = null;
  function generateForPatch(patch) {
    const terrain = installedEngine?.canyonTerrain ?? installedEngine?.genericTerrainSampler;
    const vegetationLib = installedEngine?.vegetationArchetypes ?? installedEngine?.vegetationArchetypeKit;
    const groundContact = installedEngine?.groundContact ?? installedEngine?.groundContactKit;
    const corridor = installedEngine?.flightCorridor;
    const { size, minX, minZ } = patchBounds(patch, config.patchSize);
    const lod = patch.lod ?? "near";
    const seed = `${config.seed ?? DEFAULT_SEED}:vegetation:${patch.id ?? patch.key}`;
    const random = createSeededRandom(seed);
    const patchCenterPatch = terrain?.patchAt?.(minX + size / 2, minZ + size / 2) ?? "red-canyon-floor";
    const baseCount = {
      "high-desert-forest": 82,
      "mountain-slope": 48,
      "dead-tree-slope": 25,
      "sandstone-ridge": 18,
      "red-canyon-floor": 8
    }[patchCenterPatch] ?? 12;
    const lodMul = lod === "near" ? 1 : lod === "mid" ? 0.42 : 0.14;
    const count = Math.floor(baseCount * lodMul * number(config.densityScale, 1));
    const descriptors = [];
    for (let index = 0; index < count; index += 1) {
      const x = minX + random() * size;
      const z = minZ + random() * size;
      const sample = terrain?.sample?.(x, z) ?? { y: terrain?.heightAt?.(x, z) ?? 0, slope: 0, patch: patchCenterPatch, normal: { x: 0, y: 1, z: 0 } };
      const corridorSample = corridor?.sample?.(x, z);
      if (corridorSample?.thinVegetation && random() < number(config.corridorThinChance, 0.85)) continue;
      if (number(sample.slope, 0) > number(config.maxSlope, 0.56)) continue;
      const biome = installedEngine?.biomeFieldKit?.biomeAt?.(x, z) ?? installedEngine?.biomeField?.biomeAt?.(x, z) ?? { id: "red-canyon" };
      const species = vegetationLib?.sampleSpeciesForBiome?.(biome.id, random) ?? vegetationLib?.chooseSpecies?.(random, sample.y, sample.slope, sample.patch, biome) ?? null;
      const speciesId = species?.id ?? (sample.patch === "dead-tree-slope" ? "dead-white-tree" : sample.y > 460 ? "mountain-pine" : "canyon-cedar");
      const heightMin = number(config.treeHeightMin, 10);
      const heightMax = number(config.treeHeightMax, 50);
      const height = clamp(heightMin + Math.pow(random(), 0.85) * (heightMax - heightMin), heightMin, heightMax);
      const seated = groundContact?.seatOnGround?.({ position: { x, z }, maxSlope: config.maxSlope }, { heightAt: terrain?.heightAt, normalAt: terrain?.normalAt }) ?? { position: { x, y: sample.y, z }, groundContact: { valid: true } };
      if (seated.groundContact?.valid === false) continue;
      descriptors.push({
        id: `${patch.id ?? patch.key}:tree:${index}`,
        kind: "vegetation",
        type: "tree",
        speciesId,
        meshId: speciesId.includes("dead") ? "tree.dead.trunk" : "tree.conifer",
        materialId: speciesId.includes("dead") ? "tree.dead" : "tree.green",
        position: seated.position ?? { x, y: sample.y, z },
        normal: sample.normal,
        height,
        trunkRadius: clamp(height * (0.018 + random() * 0.012), 0.18, 1.15),
        canopyRadius: height * (0.13 + random() * 0.08),
        rotation: { x: (random() - 0.5) * 0.18, y: random() * TAU, z: (random() - 0.5) * 0.18 },
        lod,
        patchId: patch.id ?? patch.key,
        batchKey: `${speciesId.includes("dead") ? "tree.dead.trunk" : "tree.conifer"}|${speciesId.includes("dead") ? "tree.dead" : "tree.green"}|${lod}`
      });
    }
    return descriptors;
  }
  function system(world) {
    const patches = getTerrainPatches(installedEngine ?? {}, config);
    const descriptors = patches.flatMap(generateForPatch);
    const batches = Object.values(descriptors.reduce((acc, descriptor) => {
      const key = descriptor.batchKey;
      acc[key] ??= { key, meshId: descriptor.meshId, materialId: descriptor.materialId, lod: descriptor.lod, instances: [], count: 0 };
      acc[key].instances.push(descriptor);
      acc[key].count = acc[key].instances.length;
      return acc;
    }, {}));
    world.setResource(State, {
      id: config.id ?? "aerial-vegetation-placement",
      version: AERIAL_VEGETATION_PLACEMENT_DOMAIN_KIT_VERSION,
      frame: number(world.__nexusClock?.frame, 0),
      descriptors,
      batches,
      stats: { patches: patches.length, descriptors: descriptors.length, batches: batches.length }
    });
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-vegetation-placement-domain-kit",
    requires: ["domain:biome-field", "domain:vegetation-archetype", "domain:ground-contact", "domain:vegetation-lod", "terrain:height-sampler", "world:patch-window", "flight:corridor"],
    provides: ["vegetation:placement", "vegetation:instances", "render:vegetation-descriptors"],
    resources: { State },
    systems: [{ phase: "simulate", name: "aerialVegetationPlacementSystem", system }],
    initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-vegetation-placement", version: AERIAL_VEGETATION_PLACEMENT_DOMAIN_KIT_VERSION, descriptors: [], batches: [], stats: {} }); },
    install({ engine, world }) {
      installedEngine = engine;
      installGetterApi(engine, "aerialVegetationPlacement", world, State, {
        getDescriptors: () => world.getResource(State)?.descriptors ?? [],
        getBatches: () => world.getResource(State)?.batches ?? []
      });
    },
    metadata: { version: AERIAL_VEGETATION_PLACEMENT_DOMAIN_KIT_VERSION, domain: "aerial-vegetation-placement", purpose: "Flight-scale tree/shrub descriptor placement from terrain patches, biome, slope, corridor, and LOD rules." }
  });
}

export function createAerialProceduralObjectDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialProceduralObject.state");
  let installedEngine = null;
  function generateForPatch(patch) {
    const terrain = installedEngine?.canyonTerrain ?? installedEngine?.genericTerrainSampler;
    const corridor = installedEngine?.flightCorridor;
    const { size, minX, minZ, centerX, centerZ } = patchBounds(patch, config.patchSize);
    const random = createSeededRandom(`${config.seed ?? DEFAULT_SEED}:objects:${patch.id ?? patch.key}`);
    const lod = patch.lod ?? "near";
    const descriptors = [];
    const collision = [];
    const addObject = (object) => descriptors.push({ patchId: patch.id ?? patch.key, lod, ...object });
    const spireCount = lod === "near" ? number(config.nearSpireCount, 5) : lod === "mid" ? number(config.midSpireCount, 2) : 0;
    for (let i = 0; i < spireCount; i += 1) {
      const side = random() > 0.5 ? 1 : -1;
      const x = centerX + side * (210 + random() * 980);
      const z = minZ + random() * size;
      if (corridor?.sample?.(x, z)?.thinSpire && random() < 0.65) continue;
      const y = number(terrain?.heightAt?.(x, z), 0);
      const height = 30 + random() * 150;
      const radius = 16 + random() * 46;
      addObject({ id: `${patch.id ?? patch.key}:spire:${i}`, kind: "geology", type: "canyon-spire", position: { x, y, z }, height, radius, materialId: "sandstone-spire", meshId: "canyon-spire" });
      collision.push({ id: `${patch.id ?? patch.key}:spire:${i}:collision`, type: "cylinder", position: { x, y, z }, radius, height });
    }
    const structureChance = lod === "near" ? number(config.structureChance, 0.22) : 0;
    if (random() < structureChance && Math.abs(centerX) > 320) {
      const archetypes = ["watchtower", "radio-tower", "crashed-plane", "water-tank", "scaffold"];
      const archetype = archetypes[Math.floor(random() * archetypes.length)];
      const x = centerX + (random() - 0.5) * size * 0.5;
      const z = centerZ + (random() - 0.5) * size * 0.5;
      const y = number(terrain?.heightAt?.(x, z), 0);
      addObject({ id: `${patch.id ?? patch.key}:${archetype}:0`, kind: "structure", type: archetype, archetype, position: { x, y, z }, rotation: { x: 0, y: random() * TAU, z: 0 }, scale: 0.8 + random() * 1.6, meshId: `structure.${archetype}`, materialId: "structure.dark-metal" });
    }
    if (lod !== "near") {
      const cloudCount = lod === "mid" ? 2 : 1;
      for (let i = 0; i < cloudCount; i += 1) {
        addObject({ id: `${patch.id ?? patch.key}:cloud:${i}`, kind: "atmosphere", type: "cloud-bank", position: { x: minX + random() * size, y: 900 + random() * 1600, z: minZ + random() * size }, size: 120 + random() * 260, meshId: "cloud-bank", materialId: "cloud.high" });
      }
    }
    if (lod === "near" && Math.abs(number(patch.px, Math.round(centerX / size))) <= 1 && number(patch.pz, Math.round(centerZ / size)) >= 0) {
      const routeIndex = Math.round(centerZ / Math.max(1, size));
      const x = Math.sin(routeIndex * 1.71) * 220;
      const z = centerZ + size * 0.12;
      const y = number(terrain?.heightAt?.(x, z), 0) + 100 + ((routeIndex * 37) % 80);
      addObject({ id: `checkpoint-ring-${routeIndex}`, kind: "objective", type: "checkpoint-ring", position: { x, y, z }, radius: 35, rotation: { x: 0, y: random() * TAU, z: 0 }, meshId: "checkpoint-ring", materialId: "ring.amber" });
    }
    return { descriptors, collision };
  }
  function system(world) {
    const patches = getTerrainPatches(installedEngine ?? {}, config);
    const generated = patches.map(generateForPatch);
    const descriptors = generated.flatMap((entry) => entry.descriptors);
    const collisionProxies = generated.flatMap((entry) => entry.collision);
    world.setResource(State, {
      id: config.id ?? "aerial-procedural-objects",
      version: AERIAL_PROCEDURAL_OBJECT_DOMAIN_KIT_VERSION,
      frame: number(world.__nexusClock?.frame, 0),
      descriptors,
      collisionProxies,
      stats: { patches: patches.length, descriptors: descriptors.length, collisionProxies: collisionProxies.length }
    });
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-procedural-object-domain-kit",
    requires: ["world:patch-window", "terrain:height-sampler", "terrain:normal-sampler", "terrain:patch-classifier", "flight:corridor"],
    provides: ["world:procedural-objects", "render:object-descriptors", "collision:proxy-descriptors"],
    resources: { State },
    systems: [{ phase: "simulate", name: "aerialProceduralObjectSystem", system }],
    initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-procedural-objects", version: AERIAL_PROCEDURAL_OBJECT_DOMAIN_KIT_VERSION, descriptors: [], collisionProxies: [], stats: {} }); },
    install({ engine, world }) {
      installedEngine = engine;
      installGetterApi(engine, "aerialProceduralObjects", world, State, {
        getDescriptors: () => world.getResource(State)?.descriptors ?? [],
        getCollisionProxies: () => world.getResource(State)?.collisionProxies ?? []
      });
    },
    metadata: { version: AERIAL_PROCEDURAL_OBJECT_DOMAIN_KIT_VERSION, domain: "aerial-procedural-objects", purpose: "Chunk-owned descriptors for spires, structures, clouds, rings, and collision proxies." }
  });
}

export function createAerialProjectileSystemKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialProjectile.state");
  const Fire = defineEvent(NexusRealtime, "aerialProjectile.fire");
  const Hit = defineEvent(NexusRealtime, "aerialProjectile.hit");
  const Reset = defineEvent(NexusRealtime, "aerialProjectile.reset");
  let seq = 0;
  let installedEngine = null;
  let installedFireEvent = null;
  function initialState() {
    return { id: config.id ?? "aerial-projectiles", version: AERIAL_PROJECTILE_SYSTEM_KIT_VERSION, projectiles: [], hits: [], frame: 0 };
  }
  function system(world) {
    let state = clone(world.getResource(State) ?? initialState());
    for (const event of world.readEvents(Reset)) state = initialState(event);
    const fireEvents = [...world.readEvents(Fire), ...(installedFireEvent ? world.readEvents(installedFireEvent) : [])];
    for (const event of fireEvents) {
      seq += 1;
      const forward = yawForward(number(event.rotation?.yaw), number(event.rotation?.pitch));
      const speed = number(event.speed, number(config.speed, 1250));
      state.projectiles.push({
        id: event.id ?? `projectile-${seq}`,
        ownerId: event.ownerId ?? event.sourceId ?? "player",
        sourceId: event.sourceId ?? "player",
        position: vec3(event.position),
        previousPosition: vec3(event.position),
        velocity: add3(mul3(forward, speed), mul3(event.velocity ?? {}, number(config.sourceVelocityScale, 0.15))),
        radius: number(event.radius, 6),
        damage: number(event.damage, number(config.damage, 9)),
        life: number(event.life, number(config.life, 1.55)),
        materialId: event.materialId ?? "projectile.amber"
      });
    }
    const dt = dtOf(world);
    const targets = installedEngine?.aerialEncounter?.getTargets?.() ?? installedEngine?.aerialCombat?.getTargets?.() ?? [];
    const nextProjectiles = [];
    const hits = [];
    for (const projectile of state.projectiles) {
      const next = { ...projectile, previousPosition: projectile.position, position: add3(projectile.position, mul3(projectile.velocity, dt)), life: projectile.life - dt };
      let hit = null;
      for (const target of targets) {
        if (target.destroyed || target.ownerId === next.ownerId) continue;
        const d = Math.hypot(number(target.position?.x) - next.position.x, number(target.position?.y) - next.position.y, number(target.position?.z) - next.position.z);
        if (d <= number(target.radius, 24) + next.radius) {
          hit = { projectileId: next.id, targetId: target.id, sourceId: next.sourceId, amount: next.damage, position: next.position };
          break;
        }
      }
      if (hit) {
        hits.push(hit);
        world.emit(Hit, hit);
      } else if (next.life > 0) {
        nextProjectiles.push(next);
      }
    }
    world.setResource(State, { ...state, projectiles: nextProjectiles, hits: hits.slice(-32), frame: state.frame + 1 });
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-projectile-system-kit",
    provides: ["projectile:simulation", "combat:projectile-events", "render:projectile-descriptors"],
    resources: { State },
    events: { Fire, Hit, Reset },
    systems: [{ phase: "simulate", name: "aerialProjectileSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installedEngine = engine;
      installedFireEvent = engine.poweredAerialFlight?.events?.FireRequested ?? null;
      installGetterApi(engine, "aerialProjectiles", world, State, {
        events: { Fire, Hit, Reset },
        fire(payload = {}) { world.emit(Fire, payload); return world.getResource(State); },
        reset(payload = {}) { world.emit(Reset, payload); return world.getResource(State); },
        getDescriptors: () => (world.getResource(State)?.projectiles ?? []).map((p) => ({ id: p.id, kind: "projectile", position: p.position, previousPosition: p.previousPosition, radius: p.radius, materialId: p.materialId }))
      });
    },
    metadata: { version: AERIAL_PROJECTILE_SYSTEM_KIT_VERSION, domain: "aerial-projectile", purpose: "Hot-loop projectile motion, lifetime, sweep-ish target checks, hit events, and render descriptors." }
  });
}

export function createAerialCombatDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialCombat.state");
  const RegisterTarget = defineEvent(NexusRealtime, "aerialCombat.registerTarget");
  const Damage = defineEvent(NexusRealtime, "aerialCombat.damage");
  const Reset = defineEvent(NexusRealtime, "aerialCombat.reset");
  const TargetDestroyed = defineEvent(NexusRealtime, "aerialCombat.targetDestroyed");
  function initialState() {
    return { id: config.id ?? "aerial-combat", version: AERIAL_COMBAT_DOMAIN_KIT_VERSION, targets: {}, destroyedIds: [], score: 0, frame: 0 };
  }
  function applyDamage(state, world, event) {
    const target = state.targets[event.targetId];
    if (!target || target.destroyed) return state;
    const nextTarget = { ...target, health: clamp(number(target.health, 1) - number(event.amount, 0), 0, number(target.maxHealth, 1)) };
    if (nextTarget.health <= 0) {
      nextTarget.destroyed = true;
      state.destroyedIds = Array.from(new Set([...(state.destroyedIds ?? []), nextTarget.id]));
      state.score += number(nextTarget.scoreValue, number(config.defaultScoreValue, 1000));
      world.emit(TargetDestroyed, { id: nextTarget.id, sourceId: event.sourceId, target: nextTarget });
    }
    state.targets[nextTarget.id] = nextTarget;
    return state;
  }
  function system(world) {
    let state = clone(world.getResource(State) ?? initialState());
    for (const event of world.readEvents(Reset)) state = initialState(event);
    for (const event of world.readEvents(RegisterTarget)) {
      const id = String(event.id ?? event.targetId);
      if (!id || id === "undefined") continue;
      state.targets[id] = {
        id,
        type: event.type ?? "target",
        ownerId: event.ownerId ?? "enemy",
        health: number(event.health, 50),
        maxHealth: number(event.maxHealth, number(event.health, 50)),
        radius: number(event.radius, 24),
        scoreValue: number(event.scoreValue, 1000),
        position: vec3(event.position),
        destroyed: Boolean(event.destroyed)
      };
    }
    for (const event of world.readEvents(Damage)) state = applyDamage(state, world, event);
    const projectileHits = installedProjectileHitEvent ? (world.readEvents(installedProjectileHitEvent) ?? []) : [];
    for (const event of projectileHits) state = applyDamage(state, world, event);
    state.frame += 1;
    world.setResource(State, state);
  }
  let installedProjectileHitEvent = null;
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-combat-domain-kit",
    requires: ["projectile:simulation"],
    provides: ["combat:damage", "combat:health", "combat:events", "combat:targets"],
    resources: { State },
    events: { RegisterTarget, Damage, Reset, TargetDestroyed },
    systems: [{ phase: "resolve", name: "aerialCombatSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installedProjectileHitEvent = engine.aerialProjectiles?.events?.Hit ?? null;
      installGetterApi(engine, "aerialCombat", world, State, {
        registerTarget(payload = {}) { world.emit(RegisterTarget, payload); return world.getResource(State); },
        damage(targetId, amount, payload = {}) { world.emit(Damage, { targetId, amount, ...payload }); return world.getResource(State); },
        reset(payload = {}) { world.emit(Reset, payload); return world.getResource(State); },
        getTargets() { return Object.values(world.getResource(State)?.targets ?? {}); },
        getDescriptors() { return Object.values(world.getResource(State)?.targets ?? {}).map((target) => ({ id: target.id, kind: "combat-target", ...target })); }
      });
    },
    metadata: { version: AERIAL_COMBAT_DOMAIN_KIT_VERSION, domain: "aerial-combat", purpose: "Damage, target health, target death, score, and combat events." }
  });
}

export function createAerialEncounterDirectorKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialEncounter.state");
  let installedEngine = null;
  function initialState() {
    return { id: config.id ?? "aerial-encounter-director", version: AERIAL_ENCOUNTER_DIRECTOR_KIT_VERSION, spawned: {}, descriptors: [], frame: 0, targetCount: 0 };
  }
  function system(world) {
    const state = clone(world.getResource(State) ?? initialState());
    const body = installedEngine?.poweredAerialFlight?.getBody?.() ?? { position: { x: 0, y: 100, z: 0 } };
    const descriptors = [];
    const random = createSeededRandom(`${config.seed ?? DEFAULT_SEED}:encounters`);
    const count = number(config.banditCount, 5);
    for (let i = 0; i < count; i += 1) {
      const id = `bandit-${i + 1}`;
      const z = 1150 + i * 1780;
      const x = (stableUnit(`${id}:x`) - 0.5) * 760;
      const y = 210 + stableUnit(`${id}:y`) * 250;
      const active = number(body.position?.z) > z - 2200 && number(body.position?.z) < z + 2600;
      const descriptor = { id, kind: "enemy-plane", type: "bandit", ownerId: "enemy", position: { x, y, z }, radius: 24, health: number(config.banditHealth, 50), scoreValue: number(config.banditScore, 1500), active, meshId: "enemy.fighter", materialId: "enemy.blue" };
      descriptors.push(descriptor);
      if (active && !state.spawned[id]) {
        state.spawned[id] = true;
        installedEngine?.aerialCombat?.registerTarget?.(descriptor);
      }
    }
    const zeppelinZ = number(config.zeppelinZ, 11800);
    const zeppelinActive = number(body.position?.z) > zeppelinZ - 4800;
    const zeppelin = { id: "command-zeppelin", kind: "enemy-zeppelin", type: "zeppelin", ownerId: "enemy", position: { x: 0, y: 430, z: zeppelinZ }, radius: 128, health: number(config.zeppelinHealth, 1200), scoreValue: number(config.zeppelinScore, 5000), active: zeppelinActive, meshId: "enemy.zeppelin", materialId: "enemy.gray" };
    descriptors.push(zeppelin);
    if (zeppelinActive && !state.spawned[zeppelin.id]) {
      state.spawned[zeppelin.id] = true;
      installedEngine?.aerialCombat?.registerTarget?.(zeppelin);
    }
    world.setResource(State, { ...state, descriptors, frame: state.frame + 1, targetCount: descriptors.length });
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-encounter-director-kit",
    requires: ["aerial:body", "terrain:height-sampler", "flight:corridor", "combat:health"],
    provides: ["encounter:aerial", "combat:targets", "render:enemy-descriptors"],
    resources: { State },
    systems: [{ phase: "simulate", name: "aerialEncounterDirectorSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installedEngine = engine;
      installGetterApi(engine, "aerialEncounter", world, State, {
        getDescriptors: () => world.getResource(State)?.descriptors ?? [],
        getTargets: () => (world.getResource(State)?.descriptors ?? []).filter((entry) => entry.active)
      });
    },
    metadata: { version: AERIAL_ENCOUNTER_DIRECTOR_KIT_VERSION, domain: "aerial-encounter", purpose: "Aerial enemy, zeppelin, patrol, and encounter descriptor director." }
  });
}

export function createAerialCameraRigDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialCameraRig.state");
  let installedEngine = null;
  function initialState() {
    return { id: config.id ?? "aerial-camera-rig", version: AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION, mode: "chase-drone", descriptor: null, frame: 0 };
  }
  function system(world) {
    const state = clone(world.getResource(State) ?? initialState());
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    if (!body) {
      world.setResource(State, state);
      return;
    }
    const forward = yawForward(number(body.rotation?.yaw), number(body.rotation?.pitch));
    const up = { x: 0, y: 1, z: 0 };
    const position = add3(add3(body.position, mul3(forward, -number(config.followDistance, 100))), { x: 0, y: number(config.followHeight, 30), z: 0 });
    const lookAt = add3(add3(body.position, mul3(forward, number(config.lookAhead, 132))), { x: 0, y: number(config.lookUp, 7), z: 0 });
    const speedT = clamp((number(body.speed, 0) - 80) / 160, 0, 1);
    world.setResource(State, {
      ...state,
      mode: config.mode ?? "chase-drone",
      descriptor: {
        id: "camera.chase-drone",
        mode: config.mode ?? "chase-drone",
        position,
        lookAt,
        up,
        fov: number(config.fov, 64) + speedT * number(config.speedFovBoost, 8),
        smoothing: { position: number(config.positionSmoothing, 7), look: number(config.lookSmoothing, 8.2), up: number(config.upSmoothing, 4) }
      },
      frame: state.frame + 1
    });
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-camera-rig-domain-kit",
    requires: ["aerial:body"],
    provides: ["camera:state", "camera:chase-rig", "render:camera-descriptor"],
    resources: { State },
    systems: [{ phase: "post", name: "aerialCameraRigSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installedEngine = engine;
      installGetterApi(engine, "aerialCameraRig", world, State, {
        getDescriptor: () => world.getResource(State)?.descriptor ?? null
      });
    },
    metadata: { version: AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION, domain: "aerial-camera-rig", purpose: "Renderer-independent camera-drone chase descriptor over powered aerial body state." }
  });
}

export function createAerialMissionSequenceKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialMission.state");
  const Start = defineEvent(NexusRealtime, "aerialMission.start");
  const Reset = defineEvent(NexusRealtime, "aerialMission.reset");
  let installedEngine = null;
  function initialState() {
    return {
      id: config.id ?? "aerial-mission",
      version: AERIAL_MISSION_SEQUENCE_KIT_VERSION,
      status: "ready",
      phase: "takeoff",
      score: 0,
      prompt: config.startPrompt ?? "Clear the canyon.",
      completed: false,
      failed: false,
      frame: 0
    };
  }
  function system(world) {
    let state = clone(world.getResource(State) ?? initialState());
    for (const event of world.readEvents(Start)) state = { ...state, status: "running", phase: event.phase ?? "takeoff", prompt: event.prompt ?? state.prompt };
    for (const event of world.readEvents(Reset)) state = initialState(event);
    const flight = installedEngine?.poweredAerialFlight?.getState?.();
    const combat = installedEngine?.aerialCombat?.getState?.();
    const destroyedCount = combat?.destroyedIds?.filter((id) => String(id).startsWith("bandit-")).length ?? 0;
    const zeppelinDestroyed = combat?.destroyedIds?.includes?.("command-zeppelin") ?? false;
    if (flight?.status === "failed") state = { ...state, status: "failed", failed: true, phase: "failed", prompt: "Aircraft lost below the safe terrain envelope." };
    else if (zeppelinDestroyed) state = { ...state, status: "complete", completed: true, phase: "victory", prompt: "The command zeppelin is down. Canyon route cleared." };
    else if (destroyedCount >= number(config.targetBandits, 5)) state = { ...state, status: "running", phase: "zeppelin", prompt: "Bandits cleared. Break the command zeppelin." };
    else if (destroyedCount > 0) state = { ...state, status: "running", phase: "bandit-wave", prompt: `Bandits down ${destroyedCount}/${number(config.targetBandits, 5)}.` };
    else if (flight?.body?.position?.z > 600) state = { ...state, status: "running", phase: "first-checkpoint", prompt: "Follow the checkpoint corridor." };
    state.score = number(combat?.score, 0);
    state.frame += 1;
    world.setResource(State, state);
  }
  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-mission-sequence-kit",
    requires: ["aerial:body", "combat:events", "encounter:aerial"],
    provides: ["sequence:aerial-mission", "mission:objective", "mission:events", "ui:prompt-descriptors"],
    resources: { State },
    events: { Start, Reset },
    systems: [{ phase: "post", name: "aerialMissionSequenceSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      installedEngine = engine;
      installGetterApi(engine, "aerialMission", world, State, {
        start(payload = {}) { world.emit(Start, payload); return world.getResource(State); },
        reset(payload = {}) { world.emit(Reset, payload); return world.getResource(State); },
        getPromptDescriptor() {
          const state = world.getResource(State);
          return state ? { id: "mission.prompt", kind: "prompt", text: state.prompt, phase: state.phase, status: state.status } : null;
        }
      });
    },
    metadata: { version: AERIAL_MISSION_SEQUENCE_KIT_VERSION, domain: "aerial-mission-sequence", purpose: "Authored Sky-Rogue-style mission phase, prompt, failure, victory, and score state." }
  });
}

export function collectAerialCanyonSnapshot(engine = {}) {
  return {
    version: AERIAL_CANYON_KITS_VERSION,
    frame: engine.aerialMission?.getState?.()?.frame ?? engine.poweredAerialFlight?.getState?.()?.frame ?? 0,
    terrain: engine.canyonTerrain?.getState?.() ?? null,
    corridor: engine.flightCorridor?.getState?.() ?? null,
    body: engine.poweredAerialFlight?.getState?.()?.body ?? null,
    player: engine.poweredAerialFlight?.getRenderDescriptor?.() ?? null,
    camera: engine.aerialCameraRig?.getDescriptor?.() ?? null,
    vegetation: engine.aerialVegetationPlacement?.getState?.() ?? null,
    proceduralObjects: engine.aerialProceduralObjects?.getState?.() ?? null,
    projectiles: engine.aerialProjectiles?.getDescriptors?.() ?? [],
    combat: engine.aerialCombat?.getState?.() ?? null,
    encounters: engine.aerialEncounter?.getState?.() ?? null,
    mission: engine.aerialMission?.getState?.() ?? null,
    prompt: engine.aerialMission?.getPromptDescriptor?.() ?? null
  };
}

export function createAerialCanyonDomainKits(NexusRealtime = {}, config = {}) {
  return [
    createCanyonTerrainDomainKit(NexusRealtime, config.terrain ?? config.canyonTerrain ?? {}),
    createFlightCorridorDomainKit(NexusRealtime, config.corridor ?? config.flightCorridor ?? {}),
    createPoweredAerialFlightDomainKit(NexusRealtime, config.flight ?? config.poweredFlight ?? {}),
    createAerialVegetationPlacementDomainKit(NexusRealtime, config.vegetationPlacement ?? {}),
    createAerialProceduralObjectDomainKit(NexusRealtime, config.objects ?? config.proceduralObjects ?? {}),
    createAerialProjectileSystemKit(NexusRealtime, config.projectiles ?? {}),
    createAerialCombatDomainKit(NexusRealtime, config.combat ?? {}),
    createAerialEncounterDirectorKit(NexusRealtime, config.encounters ?? {}),
    createAerialCameraRigDomainKit(NexusRealtime, config.camera ?? {}),
    createAerialMissionSequenceKit(NexusRealtime, config.mission ?? {})
  ];
}

export function createAerialCanyonGame(NexusRealtime = {}, config = {}) {
  return NexusRealtime.createRealtimeGame({ ...(config.engine ?? {}), kits: createAerialCanyonDomainKits(NexusRealtime, config) });
}

export default createAerialCanyonDomainKits;
