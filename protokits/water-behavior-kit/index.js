import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_BEHAVIOR_KIT_VERSION = "0.1.0";

function createInitial(config = {}) {
  return {
    actors: cloneFluidValue(config.actors ?? {}),
    zones: asFluidArray(config.zones ?? [{ id: "demo-pond", kind: "safe", depth: 3 }]),
    interactions: [],
    recentEvents: [],
    rules: cloneFluidValue(config.rules ?? { canSwim: true, canDive: true, drowningEnabled: false })
  };
}

function actorState(state, actorId = "player") {
  return state.actors[actorId] ?? { id: actorId, mode: "dry", oxygen: 1, wetness: 0, depth: 0 };
}

function record(state, event) {
  return { ...state, recentEvents: [event, ...state.recentEvents].slice(0, 24) };
}

export function createWaterBehaviorKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: WATER_BEHAVIOR_KIT_VERSION,
    factoryName: "createWaterBehaviorKit",
    kitId: "water-behavior-kit",
    engineKey: "waterBehavior",
    resourceName: "waterBehavior.state",
    eventStem: "waterBehavior",
    domain: "fluid.water",
    service: "behavior",
    requires: ["water:data", "water:surface", "water:physics"],
    provides: ["water:behavior", "water:interaction", "water:swim", "water:dive"],
    purpose: "Water DSK meaning: enter, exit, swim, dive, splash, disturb, safe/deep/hazard water, and actor wetness state.",
    createInitial,
    tick(state, { dt }) {
      const actors = Object.fromEntries(Object.entries(state.actors).map(([id, actor]) => {
        const oxygenDrain = actor.mode === "diving" ? dt * 0.04 : actor.mode === "swimming" ? dt * 0.012 : -dt * 0.08;
        const oxygen = Math.max(0, Math.min(1, toFluidNumber(actor.oxygen, 1) - oxygenDrain));
        return [id, { ...actor, oxygen }];
      }));
      return { ...state, actors };
    },
    reduceAction(state, event) {
      const actorId = String(event.actorId ?? "player");
      const before = actorState(state, actorId);
      let after = before;
      let type = null;
      if (event.type === "enter") { after = { ...before, mode: "swimming", wetness: 1, depth: toFluidNumber(event.depth, 1) }; type = "water.entered"; }
      if (event.type === "exit") { after = { ...before, mode: "dry", wetness: 0.35, depth: 0 }; type = "water.exited"; }
      if (event.type === "swim") { after = { ...before, mode: "swimming", intent: cloneFluidValue(event.intent ?? {}) }; type = "water.swam"; }
      if (event.type === "dive") { after = { ...before, mode: "diving", depth: Math.max(1, toFluidNumber(event.depth, before.depth ?? 1)) }; type = "water.dived"; }
      if (event.type === "disturb" || event.type === "splash") type = event.type === "splash" ? "water.splashed" : "water.disturbed";
      if (!type) return state;
      const actors = { ...state.actors, [actorId]: after };
      return record({ ...state, actors, interactions: [{ type, actorId, at: state.updatedAtTick, payload: cloneFluidValue(event) }, ...state.interactions].slice(0, 32) }, { type, actorId });
    },
    methods({ getState, patchState }) {
      function apply(type, payload = {}) {
        const state = getState();
        const actorId = String(payload.actorId ?? "player");
        const before = actorState(state, actorId);
        const event = { type, actorId, payload: cloneFluidValue(payload), at: state.updatedAtTick };
        let after = before;
        if (type === "enter") after = { ...before, mode: "swimming", wetness: 1, depth: toFluidNumber(payload.depth, 1) };
        if (type === "exit") after = { ...before, mode: "dry", wetness: 0.35, depth: 0 };
        if (type === "swim") after = { ...before, mode: "swimming", intent: cloneFluidValue(payload.intent ?? {}) };
        if (type === "dive") after = { ...before, mode: "diving", depth: Math.max(1, toFluidNumber(payload.depth, before.depth ?? 1)) };
        return patchState({ actors: { ...state.actors, [actorId]: after }, interactions: [event, ...state.interactions].slice(0, 32), recentEvents: [event, ...state.recentEvents].slice(0, 24) }, type);
      }
      return {
        enter: (payload = {}) => apply("enter", payload),
        exit: (payload = {}) => apply("exit", payload),
        swim: (payload = {}) => apply("swim", payload),
        dive: (payload = {}) => apply("dive", payload),
        splash: (payload = {}) => apply("splash", payload),
        disturb: (payload = {}) => apply("disturb", payload),
        getActor: (actorId = "player") => cloneFluidValue(actorState(getState(), actorId))
      };
    }
  }, config);
}

export default createWaterBehaviorKit;
