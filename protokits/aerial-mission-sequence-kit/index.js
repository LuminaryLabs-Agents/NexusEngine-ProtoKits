import { defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const AERIAL_MISSION_SEQUENCE_KIT_VERSION = "0.1.1";

function defineResource(NexusRealtime, name) {
  return typeof NexusRealtime.defineResource === "function" ? NexusRealtime.defineResource(name) : `resource:${name}`;
}

function defineEvent(NexusRealtime, name) {
  return typeof NexusRealtime.defineEvent === "function" ? NexusRealtime.defineEvent(name) : `event:${name}`;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizePhase(phase, fallback = "cleanup") {
  const value = String(phase ?? fallback);
  if (value === "post" || value === "render") return "cleanup";
  if (["input", "simulate", "resolve", "cleanup"].includes(value)) return value;
  return fallback;
}

function initialState(config = {}) {
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

export function createAerialMissionSequenceKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialMission.state");
  const Start = defineEvent(NexusRealtime, "aerialMission.start");
  const Reset = defineEvent(NexusRealtime, "aerialMission.reset");
  let installedEngine = null;

  function system(world) {
    let state = clone(world.getResource(State) ?? initialState(config));
    for (const event of world.readEvents(Start)) {
      state = { ...state, status: "running", phase: event.phase ?? "takeoff", prompt: event.prompt ?? state.prompt };
    }
    for (const event of world.readEvents(Reset)) state = initialState({ ...config, ...event });
    const flight = installedEngine?.poweredAerialFlight?.getState?.();
    const combat = installedEngine?.aerialCombat?.getState?.();
    const destroyed = combat?.destroyedIds ?? [];
    const targetBandits = number(config.targetBandits, 5);
    const destroyedCount = destroyed.filter((id) => String(id).startsWith("bandit-")).length;
    const zeppelinDestroyed = destroyed.includes("command-zeppelin");
    if (flight?.status === "failed") {
      state = { ...state, status: "failed", failed: true, phase: "failed", prompt: "Aircraft lost below the safe terrain envelope." };
    } else if (zeppelinDestroyed) {
      state = { ...state, status: "complete", completed: true, phase: "victory", prompt: "The command zeppelin is down. Canyon route cleared." };
    } else if (destroyedCount >= targetBandits) {
      state = { ...state, status: "running", phase: "zeppelin", prompt: "Bandits cleared. Break the command zeppelin." };
    } else if (destroyedCount > 0) {
      state = { ...state, status: "running", phase: "bandit-wave", prompt: `Bandits down ${destroyedCount}/${targetBandits}.` };
    } else if (flight?.body?.position?.z > 600) {
      state = { ...state, status: "running", phase: "first-checkpoint", prompt: "Follow the checkpoint corridor." };
    }
    state.score = number(combat?.score, 0);
    state.frame += 1;
    world.setResource(State, state);
  }

  return defineInjectedRuntimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-mission-sequence-kit",
    requires: ["aerial:body", "combat:events", "encounter:aerial"],
    provides: ["sequence:aerial-mission", "mission:objective", "mission:events", "ui:prompt-descriptors"],
    resources: { State },
    events: { Start, Reset },
    systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialMissionSequenceSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState(config)); },
    install({ engine, world }) {
      installedEngine = engine;
      engine.aerialMission = {
        start(payload = {}) { world.emit(Start, payload); return world.getResource(State); },
        reset(payload = {}) { world.emit(Reset, payload); return world.getResource(State); },
        getState() { return world.getResource(State); },
        getSnapshot() { return clone(world.getResource(State)); },
        getPromptDescriptor() {
          const state = world.getResource(State);
          return state ? { id: "mission.prompt", kind: "prompt", text: state.prompt, phase: state.phase, status: state.status } : null;
        }
      };
    },
    metadata: {
      version: AERIAL_MISSION_SEQUENCE_KIT_VERSION,
      domain: "aerial-mission-sequence",
      purpose: "Authored aerial mission phase, prompt, failure, victory, and score state."
    }
  });
}

export default createAerialMissionSequenceKit;
