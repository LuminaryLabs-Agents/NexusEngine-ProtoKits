import {
  createGenericDefenseKits as createLegacyGenericDefenseKits,
  createGenericDefenseLevel,
  GENERIC_DEFENSE_KITS_VERSION as LEGACY_GENERIC_DEFENSE_KITS_VERSION
} from "../generic-defense-kits/index.js";

export const GENERIC_DEFENSE_AAA_KITS_VERSION = "0.2.0";

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function idOf(value, fallback = "id") {
  const text = String(value ?? fallback).trim();
  return text || fallback;
}

function createLedger() {
  const seen = new Set();
  const events = [];
  return {
    seen,
    events,
    accept(commandId) {
      if (!commandId) return true;
      if (seen.has(commandId)) return false;
      seen.add(commandId);
      return true;
    },
    record(event) {
      events.unshift({ at: Date.now(), ...event });
      events.length = Math.min(events.length, 128);
      return event;
    }
  };
}

function stableDigest(value) {
  const text = JSON.stringify(value, Object.keys(value ?? {}).sort());
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getGeneric(engine) {
  return engine.genericDefense ?? null;
}

function getSnapshot(engine) {
  return getGeneric(engine)?.getSnapshot?.() ?? {};
}

function getResources(engine) {
  return getGeneric(engine)?.resources ?? {};
}

function setSessionBlueprint(world, engine, blueprintId) {
  const resources = getResources(engine);
  if (!resources.SessionState) return null;
  const session = world.getResource(resources.SessionState);
  if (!session) return null;
  const next = { ...session, blueprintId, message: `${blueprintId} selected.` };
  world.setResource(resources.SessionState, next);
  return next;
}

function findSlot(snapshot, point) {
  const slots = Object.values(snapshot?.map?.slots ?? {});
  return slots.find((slot) => Math.hypot(n(point?.x) - n(slot.x), n(point?.y) - n(slot.y)) <= n(slot.radius, 26)) ?? null;
}

function findStructure(snapshot, structureId) {
  return snapshot?.structures?.structures?.[structureId] ?? null;
}

function makeFacadeKit(NexusRealtime, spec) {
  const { defineRuntimeKit } = NexusRealtime;
  return defineRuntimeKit({
    id: spec.id,
    requires: spec.requires ?? ["game:generic-defense"],
    provides: spec.provides ?? [],
    resources: spec.resources ?? {},
    events: spec.events ?? {},
    systems: spec.systems ?? [],
    initWorld: spec.initWorld,
    install: spec.install,
    metadata: {
      version: GENERIC_DEFENSE_AAA_KITS_VERSION,
      purpose: spec.purpose,
      consolidated: true,
      legacyCoreVersion: LEGACY_GENERIC_DEFENSE_KITS_VERSION
    }
  });
}

export function createGenericDefenseFoundationKit(NexusRealtime, config = {}) {
  const ledger = createLedger();
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-foundation-kit",
    requires: [],
    provides: ["foundation:commands", "foundation:events", "foundation:digest", "gamehost:bridge"],
    purpose: "Consolidated deterministic command/event/digest/GameHost foundation for defense games.",
    install({ engine }) {
      engine.defenseFoundation = {
        command(command = {}) {
          const commandId = command.commandId ?? command.id;
          const accepted = ledger.accept(commandId);
          ledger.record({ type: "command", command, accepted });
          return { accepted, commandId };
        },
        hasCommand(commandId) { return ledger.seen.has(commandId); },
        recordEvent(event = {}) { return ledger.record({ type: "event", event }); },
        getDigest() { return stableDigest(getSnapshot(engine)); },
        getSnapshot() {
          return {
            version: GENERIC_DEFENSE_AAA_KITS_VERSION,
            processedCommandCount: ledger.seen.size,
            recentEvents: clone(ledger.events),
            digest: stableDigest(getSnapshot(engine))
          };
        }
      };
    }
  });
}

export function createGenericDefenseWorldKit(NexusRealtime, config = {}) {
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-world-kit",
    provides: ["world:paths", "world:lanes", "world:slots", "world:vital-targets", "world:affordances", "world:spawn-gates"],
    purpose: "Consolidated battlefield topology: paths, slots, vital targets, terrain affordances, and gates.",
    install({ engine, world }) {
      engine.defenseWorld = {
        loadMap(mapPreset = {}) { return { accepted: false, reason: "map-load-is-preset-owned", mapPreset }; },
        samplePath(pathIdOrT = 0, maybeT) {
          const t = typeof maybeT === "number" ? maybeT : pathIdOrT;
          return engine.defenseMap?.samplePath?.(t) ?? null;
        },
        queryBuildSlot(point) { return findSlot(getSnapshot(engine), point); },
        getVitalTarget(id = "core") {
          const vital = getSnapshot(engine)?.map?.vital ?? null;
          return !vital || vital.id === id ? vital : null;
        },
        damageVitalTarget(id = "core", payload = {}) {
          const resources = getResources(engine);
          const events = getGeneric(engine)?.events ?? {};
          if (!events.VitalDamaged) return { accepted: false, reason: "vital-damage-event-missing" };
          world.emit(events.VitalDamaged, { id, ...payload });
          return { accepted: true };
        },
        getSnapshot() { return clone(getSnapshot(engine)?.map ?? {}); }
      };
    }
  });
}

export function createGenericDefenseBuildKit(NexusRealtime, config = {}) {
  const ledger = createLedger();
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-build-kit",
    provides: ["build:blueprints", "build:placement", "structure:runtime", "structure:upgrade", "structure:sell", "structure:repair"],
    purpose: "Consolidated blueprints, placement, structure lifecycle, upgrades, sell, and repair API.",
    install({ engine, world }) {
      engine.defenseBuild = {
        setBlueprint(blueprintId) { return setSessionBlueprint(world, engine, blueprintId); },
        validatePlacement(slotId, blueprintId) {
          const snapshot = getSnapshot(engine);
          const slot = snapshot?.map?.slots?.[slotId];
          const blueprint = snapshot?.structures?.blueprints?.[blueprintId];
          const occupied = Object.values(snapshot?.structures?.structures ?? {}).some((structure) => structure.slotId === slotId);
          if (!slot) return { valid: false, reason: "unknown-slot" };
          if (!blueprint) return { valid: false, reason: "unknown-blueprint" };
          if (occupied) return { valid: false, reason: "slot-occupied" };
          if (n(snapshot?.economy?.currency) < n(blueprint.cost)) return { valid: false, reason: "insufficient-currency" };
          return { valid: true, slot, blueprint };
        },
        build(slotId, blueprintId, payload = {}) { return getGeneric(engine)?.build?.(slotId, blueprintId, payload); },
        upgrade(structureId, branchIdOrPayload = {}, maybePayload = {}) {
          const payload = typeof branchIdOrPayload === "string" ? { ...maybePayload, branchId: branchIdOrPayload } : branchIdOrPayload;
          return getGeneric(engine)?.upgrade?.(structureId, payload);
        },
        sell(structureId, payload = {}) {
          const commandId = payload.commandId ?? `sell:${structureId}`;
          if (!ledger.accept(commandId)) return { accepted: false, duplicate: true };
          const resources = getResources(engine);
          if (!resources.StructureState || !resources.EconomyState) return { accepted: false, reason: "resources-missing" };
          const structures = world.getResource(resources.StructureState);
          const economy = world.getResource(resources.EconomyState);
          const target = structures?.structures?.[structureId];
          if (!target) return { accepted: false, reason: "unknown-structure" };
          const blueprints = structures.blueprints ?? {};
          const blueprint = blueprints[target.blueprintId] ?? {};
          const refund = Math.max(0, Math.round(n(blueprint.cost, 0) * 0.65));
          const nextStructures = { ...structures.structures };
          delete nextStructures[structureId];
          world.setResource(resources.StructureState, { ...structures, structures: nextStructures });
          world.setResource(resources.EconomyState, { ...economy, currency: n(economy?.currency) + refund });
          return { accepted: true, refund };
        },
        repair(structureId, payload = {}) { return { accepted: false, reason: "repair-requires-structure-health-phase", structureId, payload }; },
        getSnapshot() { return clone(getSnapshot(engine)?.structures ?? {}); }
      };
    }
  });
}

export function createGenericDefenseCombatKit(NexusRealtime, config = {}) {
  const targetModes = new Map();
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-combat-kit-consolidated",
    provides: ["target:query", "target:priority", "combat:attack", "projectile:motion", "combat:damage", "combat:status", "combat:death"],
    purpose: "Consolidated targeting, attacks, projectile, damage, health, shield, status, and death facade.",
    install({ engine }) {
      engine.defenseCombat = {
        registerTarget(entity) { return { accepted: true, entity }; },
        setTargetMode(actorId, mode = "first") { targetModes.set(actorId, mode); return { actorId, mode }; },
        requestAttack(actorId, targetId, payload = {}) { return { accepted: false, reason: "attacks-are-system-driven", actorId, targetId, payload }; },
        requestDamage(targetId, damage, payload = {}) { return { accepted: false, reason: "damage-is-resolved-by-projectile-system", targetId, damage, payload }; },
        applyStatus(targetId, status, payload = {}) { return { accepted: false, reason: "status-runtime-is-currently-projectile-slow-only", targetId, status, payload }; },
        getTargetModes() { return Object.fromEntries(targetModes.entries()); },
        getSnapshot() { return clone(getSnapshot(engine)?.combat ?? {}); }
      };
    }
  });
}

export function createGenericDefenseAgentKit(NexusRealtime, config = {}) {
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-agent-kit",
    provides: ["agent:roster", "agent:spawn", "agent:path-follow", "agent:breach", "agent:boss-phase"],
    purpose: "Consolidated enemy/agent roster, spawning, path-follow, modifiers, boss, and breach API.",
    install({ engine, world }) {
      engine.defenseAgents = {
        registerArchetype(archetype = {}) {
          const resources = getResources(engine);
          if (!resources.AgentState) return { accepted: false, reason: "agent-resource-missing" };
          const state = world.getResource(resources.AgentState);
          const id = idOf(archetype.id, `agent-${Object.keys(state?.archetypes ?? {}).length + 1}`);
          world.setResource(resources.AgentState, { ...state, archetypes: { ...(state?.archetypes ?? {}), [id]: { ...archetype, id } } });
          return { accepted: true, id };
        },
        spawn(archetypeId, payload = {}) { return { accepted: false, reason: "spawns-are-wave-scheduled", archetypeId, payload }; },
        assignPath(agentId, pathId) { return { accepted: false, reason: "agents-use-map-default-path", agentId, pathId }; },
        applyModifier(agentId, modifier) { return { accepted: false, reason: "modifiers-come-from-combat-status", agentId, modifier }; },
        getSnapshot() { return clone(getSnapshot(engine)?.agents ?? {}); }
      };
    }
  });
}

export function createGenericDefenseWaveKit(NexusRealtime, config = {}) {
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-wave-kit",
    provides: ["wave:definition", "wave:scheduler", "wave:director", "wave:pressure", "wave:preview", "wave:boss"],
    purpose: "Consolidated wave definition, scheduling, pressure, preview, and boss wave API.",
    install({ engine }) {
      engine.defenseWaves = {
        loadWaveTable(waves) { return { accepted: false, reason: "wave-table-is-preset-owned", waves }; },
        previewNextWave() {
          const snapshot = getSnapshot(engine);
          const index = n(snapshot?.session?.waveIndex, 0);
          return snapshot?.level?.waves?.[index] ?? null;
        },
        startWave(payload = {}) { return getGeneric(engine)?.startWave?.(payload); },
        completeWave(waveId, payload = {}) { return { accepted: false, reason: "wave-completion-is-system-driven", waveId, payload }; },
        getPressure() {
          const snapshot = getSnapshot(engine);
          const active = Object.keys(snapshot?.agents?.active ?? {}).length;
          const queued = snapshot?.agents?.spawnQueue?.length ?? 0;
          return { active, queued, pressure: active + queued * 0.35 };
        },
        getSnapshot() { return clone(getSnapshot(engine)?.agents ?? {}); }
      };
    }
  });
}

export function createGenericDefenseEconomyKit(NexusRealtime, config = {}) {
  const ledger = createLedger();
  const rewardChoices = new Map();
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-economy-kit-consolidated",
    provides: ["economy:wallet", "economy:costs", "economy:income", "economy:rewards", "economy:shop"],
    purpose: "Consolidated wallet, cost resolution, income, reward choices, shop, discounts, and unlock API.",
    install({ engine, world }) {
      engine.defenseEconomy = {
        canPay(cost = 0) { return n(getSnapshot(engine)?.economy?.currency) >= n(cost); },
        commitCost(cost = 0, payload = {}) {
          const commandId = payload.commandId ?? `cost:${cost}`;
          if (!ledger.accept(commandId)) return { accepted: false, duplicate: true };
          const resources = getResources(engine);
          if (!resources.EconomyState) return { accepted: false, reason: "economy-resource-missing" };
          const state = world.getResource(resources.EconomyState);
          if (n(state?.currency) < n(cost)) return { accepted: false, reason: "insufficient-currency" };
          world.setResource(resources.EconomyState, { ...state, currency: n(state.currency) - n(cost) });
          return { accepted: true, cost: n(cost) };
        },
        credit(amount = 0, payload = {}) {
          const resources = getResources(engine);
          if (!resources.EconomyState) return { accepted: false, reason: "economy-resource-missing" };
          const state = world.getResource(resources.EconomyState);
          world.setResource(resources.EconomyState, { ...state, currency: n(state?.currency) + Math.max(0, n(amount)) });
          return { accepted: true, amount };
        },
        openRewardChoice(rewards = [], payload = {}) {
          const id = payload.choiceId ?? `reward-${rewardChoices.size + 1}`;
          rewardChoices.set(id, { id, rewards: clone(rewards), chosen: null });
          return { accepted: true, id };
        },
        chooseReward(choiceId, payload = {}) {
          const choice = rewardChoices.get(choiceId);
          if (!choice) return { accepted: false, reason: "unknown-choice" };
          if (choice.chosen) return { accepted: false, reason: "choice-already-used" };
          choice.chosen = payload.rewardId ?? choice.rewards?.[0]?.id ?? null;
          return { accepted: true, chosen: choice.chosen };
        },
        getSnapshot() { return { ...clone(getSnapshot(engine)?.economy ?? {}), rewardChoices: Object.fromEntries(rewardChoices.entries()) }; }
      };
    }
  });
}

export function createGenericDefenseAbilityKit(NexusRealtime, config = {}) {
  const state = { activeCast: null, cooldowns: {}, charges: {}, ultimate: 0 };
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-ability-kit",
    provides: ["ability:registry", "ability:cooldown", "ability:targeting", "ability:cast", "ability:ultimate", "ability:consumable"],
    purpose: "Consolidated ability registry, cooldown, targeting, cast, ultimate, and consumable API.",
    install({ engine }) {
      engine.defenseAbilities = {
        beginCast(abilityId) { state.activeCast = { abilityId, aim: null }; return clone(state.activeCast); },
        aim(point) { if (state.activeCast) state.activeCast.aim = clone(point); return clone(state.activeCast); },
        confirmCast(payload = {}) { const cast = state.activeCast; state.activeCast = null; return cast ? { accepted: true, cast, payload } : { accepted: false, reason: "no-active-cast" }; },
        cancelCast() { state.activeCast = null; return { accepted: true }; },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericDefenseObjectiveKit(NexusRealtime, config = {}) {
  const objectives = new Map();
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-objective-kit",
    provides: ["objective:state", "objective:completion", "objective:score", "objective:failure", "objective:stars"],
    purpose: "Consolidated objectives, completion, score, stars, failure, and session outcome API.",
    install({ engine }) {
      engine.defenseObjectives = {
        setPrimaryObjective(objective = {}) { objectives.set("primary", { ...objective, id: objective.id ?? "primary", progress: 0, complete: false }); return objectives.get("primary"); },
        progress(id, amount = 1) { const obj = objectives.get(id); if (!obj) return { accepted: false, reason: "unknown-objective" }; obj.progress = n(obj.progress) + n(amount); return clone(obj); },
        complete(id) { const obj = objectives.get(id); if (!obj) return { accepted: false, reason: "unknown-objective" }; obj.complete = true; return clone(obj); },
        fail(id, payload = {}) { const obj = objectives.get(id) ?? { id }; obj.failed = true; obj.payload = payload; objectives.set(id, obj); return clone(obj); },
        getSnapshot() { return { objectives: Object.fromEntries(objectives.entries()), session: clone(getSnapshot(engine)?.session ?? {}) }; }
      };
    }
  });
}

export function createGenericDefensePresentationKit(NexusRealtime, config = {}) {
  const signals = [];
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-presentation-kit",
    provides: ["presentation:render", "presentation:hud", "presentation:vfx", "presentation:audio", "presentation:camera"],
    purpose: "Consolidated renderer-agnostic descriptors, HUD, VFX, audio, music, screen feedback, and camera beats.",
    install({ engine }) {
      engine.defensePresentation = {
        getRenderDescriptors() { return clone(engine.defenseRender?.getSnapshot?.()?.descriptors ?? []); },
        getHudDescriptors() { return clone(engine.defenseRender?.getSnapshot?.()?.hud ?? {}); },
        getAudioDescriptors() { return signals.filter((signal) => signal.channel === "audio"); },
        emitSignal(signal = {}) { signals.unshift({ at: performance?.now?.() ?? Date.now(), ...signal }); signals.length = Math.min(signals.length, 64); return signal; },
        getSnapshot() { return { render: engine.defenseRender?.getSnapshot?.() ?? {}, signals: clone(signals) }; }
      };
    }
  });
}

export function createGenericDefenseScaleKit(NexusRealtime, config = {}) {
  const entities = new Map();
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-scale-kit",
    provides: ["scale:entities", "scale:spatial-index", "scale:batch-targeting", "scale:budget", "scale:lod"],
    purpose: "Consolidated entity registry, spatial query, batch targeting, batch damage, object pools, LOD, and budget API.",
    install({ engine }) {
      engine.defenseScale = {
        registerEntity(entity = {}) { const id = idOf(entity.id, `entity-${entities.size + 1}`); entities.set(id, { ...entity, id }); return { accepted: true, id }; },
        queryRadius(point = {}, radius = 0) {
          const snapshot = getSnapshot(engine);
          const candidates = [
            ...Object.values(snapshot?.structures?.structures ?? {}),
            ...Object.values(snapshot?.agents?.active ?? {})
          ];
          return candidates.filter((item) => Math.hypot(n(item.x) - n(point.x), n(item.y) - n(point.y)) <= n(radius));
        },
        enqueueTargetQuery(query) { return { accepted: false, reason: "batch-targeting-next-phase", query }; },
        enqueueDamage(request) { return { accepted: false, reason: "batch-damage-next-phase", request }; },
        getBudgetSnapshot() { const snapshot = getSnapshot(engine); return { agents: Object.keys(snapshot?.agents?.active ?? {}).length, projectiles: Object.keys(snapshot?.combat?.projectiles ?? {}).length, descriptors: snapshot?.render?.descriptors?.length ?? 0 }; }
      };
    }
  });
}

export function createGenericDefenseAuthoringQaKit(NexusRealtime, config = {}) {
  return makeFacadeKit(NexusRealtime, {
    id: config.kitId ?? "generic-defense-authoring-qa-kit",
    requires: [],
    provides: ["authoring:validation", "qa:scenario", "qa:replay", "qa:metrics", "qa:inspector"],
    purpose: "Consolidated preset validation, scenario QA, replay harness, balance metrics, heatmaps, and inspector API.",
    install({ engine }) {
      engine.defenseAuthoring = {
        validatePreset(preset = {}) {
          const level = preset.level ?? preset;
          const errors = [];
          if (!Array.isArray(level.path) || level.path.length < 2) errors.push("level.path must contain at least two points");
          if (!Array.isArray(level.slots) || level.slots.length < 1) errors.push("level.slots must contain at least one build slot");
          if (!level.blueprints || Object.keys(level.blueprints).length < 1) errors.push("level.blueprints must contain at least one blueprint");
          if (!Array.isArray(level.waves) || level.waves.length < 1) errors.push("level.waves must contain at least one wave");
          return { valid: errors.length === 0, errors };
        },
        runScenario(scenario = {}) { return { accepted: false, reason: "scenario-runner-next-phase", scenario }; },
        recordReplay() { return { accepted: false, reason: "replay-recorder-next-phase" }; },
        replay(inputLog) { return { accepted: false, reason: "replay-runner-next-phase", inputLog }; },
        getMetrics() { return engine.defenseScale?.getBudgetSnapshot?.() ?? {}; }
      };
    }
  });
}

export function createGenericDefenseKits(NexusRealtime, config = {}) {
  const legacyKits = createLegacyGenericDefenseKits(NexusRealtime, config);
  return [
    ...legacyKits,
    createGenericDefenseFoundationKit(NexusRealtime, config.foundation ?? {}),
    createGenericDefenseAuthoringQaKit(NexusRealtime, config.authoring ?? {}),
    createGenericDefenseWorldKit(NexusRealtime, config.world ?? {}),
    createGenericDefenseEconomyKit(NexusRealtime, config.economy ?? {}),
    createGenericDefenseBuildKit(NexusRealtime, config.build ?? {}),
    createGenericDefenseAgentKit(NexusRealtime, config.agents ?? {}),
    createGenericDefenseWaveKit(NexusRealtime, config.waves ?? {}),
    createGenericDefenseCombatKit(NexusRealtime, config.combat ?? {}),
    createGenericDefenseAbilityKit(NexusRealtime, config.abilities ?? {}),
    createGenericDefenseObjectiveKit(NexusRealtime, config.objectives ?? {}),
    createGenericDefenseScaleKit(NexusRealtime, config.scale ?? {}),
    createGenericDefensePresentationKit(NexusRealtime, config.presentation ?? {})
  ];
}

export function createGenericDefenseGame(NexusRealtime, config = {}) {
  if (typeof NexusRealtime?.createRealtimeGame !== "function") {
    throw new TypeError("createGenericDefenseGame requires NexusRealtime.createRealtimeGame.");
  }
  return NexusRealtime.createRealtimeGame({
    kits: createGenericDefenseKits(NexusRealtime, config),
    renderer: typeof NexusRealtime.createRenderer === "function" ? NexusRealtime.createRenderer("headless") : undefined
  });
}

export { createGenericDefenseLevel };
export default createGenericDefenseKits;
