export const COMBAT_STANCE_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createCombatStanceDomainKit requires NexusRealtime.${key}.`);
  }
}

const allowed = Object.freeze({
  exploration: ["neutral", "cast"],
  neutral: ["guard", "attack", "cast", "dodge", "exploration"],
  guard: ["neutral", "parry", "dodge"],
  parry: ["neutral", "counter"],
  counter: ["neutral"],
  attack: ["neutral", "combo", "dodge"],
  combo: ["neutral", "attack", "dodge"],
  cast: ["neutral", "dodge"],
  dodge: ["neutral"],
  stagger: ["neutral", "downed"],
  downed: ["neutral"]
});

function createState(config = {}) {
  return { version: COMBAT_STANCE_DOMAIN_KIT_VERSION, id: config.stateId ?? "combat-stance-domain", domain: "combat-stance", actorId: config.actorId ?? "player", stance: config.stance ?? "exploration", history: [], lastRejection: null };
}

export function createCombatStanceDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const CombatStanceState = defineResource(config.resourceName ?? "combatStanceDomain.state");
  const CombatStanceRequested = defineEvent("combatStance.requested");
  const CombatStanceChanged = defineEvent("combatStance.changed");
  const CombatStanceRejected = defineEvent("combatStance.rejected");

  function system(world) {
    let state = world.getResource(CombatStanceState) ?? createState(config);
    for (const event of world.readEvents(CombatStanceRequested)) {
      const nextStance = String(event.stance ?? "");
      if (!(allowed[state.stance] ?? []).includes(nextStance)) {
        const rejection = { from: state.stance, to: nextStance, reason: "illegal-stance-transition" };
        state = { ...state, lastRejection: rejection };
        world.emit(CombatStanceRejected, rejection);
        continue;
      }
      const change = { from: state.stance, to: nextStance, actorId: event.actorId ?? state.actorId };
      state = { ...state, stance: nextStance, history: [...state.history, change], lastRejection: null };
      world.emit(CombatStanceChanged, change);
    }
    world.setResource(CombatStanceState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "combat-stance-domain-kit",
    provides: ["n:combat-stance", "combat:stance"],
    resources: { CombatStanceState },
    events: { CombatStanceRequested, CombatStanceChanged, CombatStanceRejected },
    systems: [{ phase: config.phase ?? "simulate", name: "combatStanceDomainSystem", system }],
    initWorld({ world }) { world.setResource(CombatStanceState, createState(config)); },
    install({ engine, world }) {
      engine.combatStanceDomain = {
        request(stance, payload = {}) { world.emit(CombatStanceRequested, { stance, ...payload }); return world.getResource(CombatStanceState); },
        getState() { return clone(world.getResource(CombatStanceState)); }
      };
    },
    metadata: { domain: "combat-stance", parentDomain: "combat", scope: "atomic-domain", extendsBase: "DomainServiceKit", composes: ["input-action-domain-kit", "melee-strike-domain-kit", "spell-cast-domain-kit", "guard-domain-kit"], ownsLoop: false, purpose: "Owns legal combat stance transitions for RPG/Tekken-like combat flow." }
  });
}

export default createCombatStanceDomainKit;
