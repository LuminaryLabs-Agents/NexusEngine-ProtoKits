import { normalizeProtoKitFactoryArgs, withProtoDomainServiceRuntime } from "../nexus-dsk-adapter/index.js";

export const GENERIC_KIT_UTILS_VERSION = "0.2.0";

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

function hashString(value) {
  let hash = 2166136261;
  const text = String(value ?? "generic");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed, salt = 0) {
  let state = (hashString(seed) + salt) >>> 0;
  return function random() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function initialDomainState(definition, config, id) {
  const seed = config.seed ?? `${id}:seed`;
  return {
    clock: { frame: 0, elapsed: 0, delta: 0, fixedStep: config.fixedStep ?? 1 / 60 },
    random: { seed, streams: {}, last: 0 },
    input: { context: "default", actions: {}, pressed: {}, held: {}, buffered: [] },
    world: { sectors: [], fields: {}, biomes: [], pois: [], routes: [], discovered: [] },
    surface: { samples: [], foam: [], impacts: [], current: { x: 0, z: 0 }, waveScale: config.waveScale ?? 1 },
    vehicle: { bodies: {}, controls: {}, damage: {}, wakes: [], activeId: config.vehicleId ?? "vehicle-1" },
    avatar: { id: config.avatarId ?? "avatar-1", mode: "idle", x: 0, y: 0, z: 0, oxygen: 100, stationId: null },
    interaction: { registry: {}, focusId: null, hold: {}, completed: [] },
    inventory: { items: [], cargo: [], cargoWeight: 0, cargoValue: 0, currency: config.currency ?? 0, upgrades: {} },
    mission: { objectives: [], phase: "ready", completed: false, failed: false, score: 0, prompts: [] },
    camera: { mode: "chase", x: 0, y: 8, z: 12, target: null, comfort: { smoothing: 0.12, shake: 0 } },
    render: { descriptors: [], backend: null, effects: [], hud: {}, fallback: null },
    diagnostics: { checks: [], errors: [], smoke: null, digest: null, perf: { frameMs: 0, drawCalls: 0, entities: 0 } },
    preset: { id: config.presetId ?? definition.id, values: config.preset ?? {} }
  };
}

function createInitialState(definition, config, id) {
  return {
    id,
    version: definition.version ?? "0.2.0",
    status: "ready",
    category: definition.category,
    tier: definition.tier ?? "atomic",
    provides: [...(definition.provides ?? [])],
    requires: [...(definition.requires ?? [])],
    config: { ...config },
    tick: 0,
    updatedAt: 0,
    domain: initialDomainState(definition, config, id),
    history: []
  };
}

function applyCommand(state, command = {}) {
  const next = { ...state, domain: { ...state.domain }, history: [...state.history.slice(-16), { type: command.type ?? "unknown", at: state.domain.clock.elapsed }] };
  const domain = next.domain;
  switch (command.type) {
    case "configure":
      next.config = { ...next.config, ...(command.config ?? {}) };
      domain.preset = { ...domain.preset, values: { ...domain.preset.values, ...(command.config ?? {}) } };
      break;
    case "input":
      domain.input = { ...domain.input, actions: { ...domain.input.actions, ...(command.actions ?? {}) }, buffered: [...domain.input.buffered, command.actions ?? {}].slice(-32) };
      break;
    case "context":
      domain.input = { ...domain.input, context: command.context ?? domain.input.context };
      break;
    case "sector":
      domain.world = { ...domain.world, sectors: [...domain.world.sectors, command.sector].filter(Boolean) };
      break;
    case "poi":
      domain.world = { ...domain.world, pois: [...domain.world.pois, command.poi].filter(Boolean) };
      break;
    case "discover":
      domain.world = { ...domain.world, discovered: Array.from(new Set([...domain.world.discovered, command.id].filter(Boolean))) };
      break;
    case "spawnVehicle": {
      const body = { id: command.id ?? domain.vehicle.activeId, x: command.x ?? 0, z: command.z ?? 0, heading: command.heading ?? 0, velocity: command.velocity ?? 0 };
      domain.vehicle = { ...domain.vehicle, activeId: body.id, bodies: { ...domain.vehicle.bodies, [body.id]: body } };
      break;
    }
    case "vehicleControl":
      domain.vehicle = { ...domain.vehicle, controls: { ...domain.vehicle.controls, [command.id ?? domain.vehicle.activeId]: { ...(command.control ?? command) } } };
      break;
    case "damage": {
      const id = command.id ?? domain.vehicle.activeId;
      const previous = domain.vehicle.damage[id] ?? { hull: 100 };
      domain.vehicle = { ...domain.vehicle, damage: { ...domain.vehicle.damage, [id]: { ...previous, hull: clamp((previous.hull ?? 100) - Number(command.amount ?? 0), 0, 100) } } };
      break;
    }
    case "avatarMode":
      domain.avatar = { ...domain.avatar, mode: command.mode ?? domain.avatar.mode, stationId: command.stationId ?? domain.avatar.stationId };
      break;
    case "avatarMove":
      domain.avatar = { ...domain.avatar, x: domain.avatar.x + Number(command.x ?? 0), y: domain.avatar.y + Number(command.y ?? 0), z: domain.avatar.z + Number(command.z ?? 0) };
      break;
    case "interactable":
      if (command.interactable?.id) domain.interaction = { ...domain.interaction, registry: { ...domain.interaction.registry, [command.interactable.id]: command.interactable } };
      break;
    case "focus":
      domain.interaction = { ...domain.interaction, focusId: command.id ?? null };
      break;
    case "completeInteraction":
      domain.interaction = { ...domain.interaction, completed: Array.from(new Set([...domain.interaction.completed, command.id].filter(Boolean))) };
      break;
    case "addItem":
      domain.inventory = { ...domain.inventory, items: [...domain.inventory.items, command.item].filter(Boolean) };
      break;
    case "addCargo":
      domain.inventory = { ...domain.inventory, cargo: [...domain.inventory.cargo, command.cargo].filter(Boolean), cargoWeight: domain.inventory.cargoWeight + Number(command.weight ?? command.cargo?.weight ?? 1), cargoValue: domain.inventory.cargoValue + Number(command.value ?? command.cargo?.value ?? 0) };
      break;
    case "currency":
      domain.inventory = { ...domain.inventory, currency: Math.max(0, domain.inventory.currency + Number(command.amount ?? 0)) };
      break;
    case "upgrade":
      domain.inventory = { ...domain.inventory, upgrades: { ...domain.inventory.upgrades, [command.id]: (domain.inventory.upgrades[command.id] ?? 0) + 1 } };
      break;
    case "objective":
      domain.mission = { ...domain.mission, objectives: [...domain.mission.objectives, command.objective].filter(Boolean) };
      break;
    case "phase":
      domain.mission = { ...domain.mission, phase: command.phase ?? domain.mission.phase };
      break;
    case "score":
      domain.mission = { ...domain.mission, score: domain.mission.score + Number(command.amount ?? 0) };
      break;
    case "camera":
      domain.camera = { ...domain.camera, ...(command.camera ?? {}) };
      break;
    case "descriptor":
      domain.render = { ...domain.render, descriptors: [...domain.render.descriptors, command.descriptor].filter(Boolean).slice(-512) };
      break;
    case "effect":
      domain.render = { ...domain.render, effects: [...domain.render.effects, command.effect].filter(Boolean).slice(-256) };
      break;
    case "check":
      domain.diagnostics = { ...domain.diagnostics, checks: [...domain.diagnostics.checks, command.check].filter(Boolean) };
      break;
    case "error":
      domain.diagnostics = { ...domain.diagnostics, errors: [...domain.diagnostics.errors, command.error ?? command.message ?? "unknown"] };
      break;
  }
  return next;
}

function sampleSurface(state, x = 0, z = 0, time = state.domain.clock.elapsed) {
  const seed = hashString(state.domain.random.seed);
  const long = Math.sin(x * 0.018 + z * 0.011 + time * 0.7 + seed * 0.00001);
  const cross = Math.sin(x * -0.035 + z * 0.027 + time * 1.2) * 0.35;
  const height = (long + cross) * state.domain.surface.waveScale;
  return {
    x, z, height,
    normal: { x: -Math.cos(x * 0.018) * 0.08, y: 1, z: -Math.cos(z * 0.027) * 0.08 },
    velocity: state.domain.surface.current,
    foam: clamp(Math.abs(height) - 0.7, 0, 1),
    material: state.config.material ?? "water",
    hazard: height > 1.2 ? "crest" : null
  };
}

function tickCategory(state, delta) {
  const next = { ...state, tick: state.tick + 1, updatedAt: state.updatedAt + delta, domain: { ...state.domain } };
  const domain = next.domain;
  domain.clock = { ...domain.clock, frame: domain.clock.frame + 1, delta, elapsed: domain.clock.elapsed + delta };

  if (state.provides.includes("random:seeded")) {
    const random = seededRandom(domain.random.seed, domain.clock.frame)();
    domain.random = { ...domain.random, last: random };
  }

  if (state.provides.includes("surface:current-field")) {
    domain.surface = { ...domain.surface, current: { x: Math.sin(domain.clock.elapsed * 0.18) * 0.08, z: Math.cos(domain.clock.elapsed * 0.15) * 0.08 } };
  }

  if (state.provides.includes("surface:height-sampler")) {
    domain.surface = { ...domain.surface, samples: [sampleSurface(next, 0, 0), ...domain.surface.samples].slice(0, 8) };
  }

  if (state.provides.includes("watercraft:physics")) {
    const bodies = { ...domain.vehicle.bodies };
    for (const [id, body] of Object.entries(bodies)) {
      const control = domain.vehicle.controls[id] ?? {};
      const thrust = Number(control.throttle ?? control.forward ?? 0);
      const steer = Number(control.steer ?? control.turn ?? 0);
      const velocity = clamp((body.velocity ?? 0) + thrust * delta * 6, -4, 18) * Math.exp(-delta * 0.35);
      const heading = (body.heading ?? 0) + steer * delta * (0.6 + Math.abs(velocity) * 0.04);
      bodies[id] = { ...body, velocity, heading, x: (body.x ?? 0) + Math.sin(heading) * velocity * delta, z: (body.z ?? 0) - Math.cos(heading) * velocity * delta };
    }
    domain.vehicle = { ...domain.vehicle, bodies };
  }

  if (state.provides.includes("watercraft:wake")) {
    const body = domain.vehicle.bodies[domain.vehicle.activeId];
    if (body && Math.abs(body.velocity ?? 0) > 1) {
      domain.vehicle = { ...domain.vehicle, wakes: [{ x: body.x, z: body.z, age: 0, size: Math.abs(body.velocity) }, ...domain.vehicle.wakes.map((wake) => ({ ...wake, age: wake.age + delta })).filter((wake) => wake.age < 2)].slice(0, 64) };
    }
  }

  if (state.provides.includes("avatar:oxygen") && domain.avatar.mode === "diving") {
    domain.avatar = { ...domain.avatar, oxygen: clamp(domain.avatar.oxygen - delta * 5, 0, 100) };
  } else if (state.provides.includes("avatar:oxygen")) {
    domain.avatar = { ...domain.avatar, oxygen: clamp(domain.avatar.oxygen + delta * 12, 0, 100) };
  }

  if (state.provides.includes("test:state-digest")) {
    domain.diagnostics = { ...domain.diagnostics, digest: hashString(JSON.stringify({ tick: next.tick, mission: domain.mission, vehicle: domain.vehicle, avatar: domain.avatar })) };
  }

  if (state.provides.includes("perf:budget")) {
    domain.diagnostics = { ...domain.diagnostics, perf: { frameMs: delta * 1000, drawCalls: domain.render.descriptors.length, entities: Object.keys(domain.vehicle.bodies).length + domain.world.pois.length } };
  }

  return next;
}

function getState(world, State, fallback) {
  return typeof world?.getResource === "function" ? (world.getResource(State) ?? fallback) : fallback;
}

function buildApi({ id, definition, world, State, Command, createInitialState }) {
  const api = {
    id,
    definition,
    getState() {
      return getState(world, State, createInitialState());
    },
    command(payload = {}) {
      world.emit?.(Command, payload);
      return api.getState();
    },
    configure(config = {}) {
      return api.command({ type: "configure", config });
    },
    reset() {
      world.setResource?.(State, createInitialState());
      return api.getState();
    },
    getSnapshot() {
      return JSON.parse(JSON.stringify(api.getState()));
    }
  };

  api.sampleSurface = (x, z, time) => sampleSurface(api.getState(), x, z, time);
  api.input = (actions) => api.command({ type: "input", actions });
  api.setContext = (context) => api.command({ type: "context", context });
  api.addSector = (sector) => api.command({ type: "sector", sector });
  api.addPoi = (poi) => api.command({ type: "poi", poi });
  api.discover = (discoveryId) => api.command({ type: "discover", id: discoveryId });
  api.spawnVehicle = (vehicle = {}) => api.command({ type: "spawnVehicle", ...vehicle });
  api.controlVehicle = (control = {}) => api.command({ type: "vehicleControl", control, id: control.id });
  api.damageVehicle = (amount, vehicleId) => api.command({ type: "damage", amount, id: vehicleId });
  api.setAvatarMode = (mode, stationId) => api.command({ type: "avatarMode", mode, stationId });
  api.moveAvatar = (delta) => api.command({ type: "avatarMove", ...(delta ?? {}) });
  api.registerInteractable = (interactable) => api.command({ type: "interactable", interactable });
  api.focus = (focusId) => api.command({ type: "focus", id: focusId });
  api.completeInteraction = (interactionId) => api.command({ type: "completeInteraction", id: interactionId });
  api.addItem = (item) => api.command({ type: "addItem", item });
  api.addCargo = (cargo) => api.command({ type: "addCargo", cargo, value: cargo?.value, weight: cargo?.weight });
  api.addCurrency = (amount) => api.command({ type: "currency", amount });
  api.buyUpgrade = (upgradeId) => api.command({ type: "upgrade", id: upgradeId });
  api.addObjective = (objective) => api.command({ type: "objective", objective });
  api.setPhase = (phase) => api.command({ type: "phase", phase });
  api.addScore = (amount) => api.command({ type: "score", amount });
  api.setCamera = (camera) => api.command({ type: "camera", camera });
  api.addDescriptor = (descriptor) => api.command({ type: "descriptor", descriptor });
  api.addEffect = (effect) => api.command({ type: "effect", effect });
  api.check = (check) => api.command({ type: "check", check });
  api.error = (error) => api.command({ type: "error", error });
  return api;
}

export function createGenericProtoKit(NexusEngine, definition, config = {}) {
  ({ NexusEngine, config } = normalizeProtoKitFactoryArgs(NexusEngine, config));
  NexusEngine = withProtoDomainServiceRuntime(NexusEngine, definition.id ?? definition.camelName, {
    version: definition.version ?? GENERIC_KIT_UTILS_VERSION,
    apiName: definition.engineKey
  });
  const defineRuntimeKit = NexusEngine?.defineRuntimeKit ?? fallbackDefineRuntimeKit;
  const id = config.id ?? definition.id;
  const stateBindingName = `${definition.camelName}State`;
  const apiBindingName = `${definition.camelName}Api`;
  const State = typeof NexusEngine?.defineResource === "function" ? NexusEngine.defineResource(`${id}.state`) : `${id}.state`;
  const Command = typeof NexusEngine?.defineEvent === "function" ? NexusEngine.defineEvent(`${id}.command`) : `${id}.command`;
  const Updated = typeof NexusEngine?.defineEvent === "function" ? NexusEngine.defineEvent(`${id}.updated`) : `${id}.updated`;
  const Rejected = typeof NexusEngine?.defineEvent === "function" ? NexusEngine.defineEvent(`${id}.rejected`) : `${id}.rejected`;
  const makeState = () => createInitialState(definition, config, id);

  return defineRuntimeKit({
    id,
    provides: [...(definition.provides ?? [])],
    requires: [...(definition.requires ?? [])],
    resources: { State },
    events: { Command, Updated, Rejected },
    systems: [
      {
        phase: definition.phase ?? "simulate",
        name: `${id}:generic-state-system`,
        system(world) {
          let next = getState(world, State, makeState());
          const delta = Number(world.__nexusClock?.delta ?? 1 / 60);
          for (const command of world.readEvents?.(Command) ?? []) {
            try {
              next = applyCommand(next, command);
            } catch (error) {
              world.emit?.(Rejected, { id, reason: error?.message ?? String(error), command });
            }
          }
          next = tickCategory(next, delta);
          world.setResource(State, next);
          world.emit?.(Updated, { id, tick: next.tick, category: next.category });
        }
      }
    ],
    initWorld({ world }) {
      world.setResource(State, makeState());
      world.emit?.(Updated, { id, initialized: true, category: definition.category });
    },
    install({ engine, world }) {
      const api = buildApi({ id, definition, world, State, Command, createInitialState: makeState });
      if (!engine.genericProtoKits) engine.genericProtoKits = {};
      engine.genericProtoKits[id] = api;
      if (definition.engineKey) engine[definition.engineKey] = api;
    },
    bindings: {
      [stateBindingName]: State,
      [apiBindingName]: Object.freeze({ id, definition }),
      sampleSurface(state, x, z, time) {
        return sampleSurface(state, x, z, time);
      }
    },
    metadata: {
      protoKit: id,
      category: definition.category,
      tier: definition.tier ?? "atomic",
      status: "functional",
      purpose: definition.purpose ?? "Generic compositional ProtoKit."
    }
  });
}
