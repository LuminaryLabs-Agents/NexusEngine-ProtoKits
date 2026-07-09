export const SPELL_CAST_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createSpellCastDomainKit requires NexusEngine.${key}.`);
  }
}

function createState(config = {}) {
  return { version: SPELL_CAST_DOMAIN_KIT_VERSION, id: config.stateId ?? "spell-cast-domain", domain: "spell-cast", mana: toNumber(config.mana, 100), maxMana: toNumber(config.maxMana, 100), casts: [], lastCast: null, lastRejection: null };
}

export function createSpellCastDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const SpellCastState = defineResource(config.resourceName ?? "spellCastDomain.state");
  const SpellCastRequested = defineEvent("spellCast.requested");
  const SpellCastReleased = defineEvent("spellCast.released");
  const SpellCastRejected = defineEvent("spellCast.rejected");

  function system(world) {
    let state = world.getResource(SpellCastState) ?? createState(config);
    for (const event of world.readEvents(SpellCastRequested)) {
      const spellId = String(event.spellId ?? event.id ?? "spell");
      const cost = Math.max(0, toNumber(event.cost, 10));
      if (state.mana < cost) {
        const rejection = { spellId, cost, mana: state.mana, reason: "not-enough-mana" };
        state = { ...state, lastRejection: rejection };
        world.emit(SpellCastRejected, rejection);
        continue;
      }
      const cast = { spellId, cost, actorId: event.actorId ?? "player", element: event.element ?? "arcane" };
      state = { ...state, mana: state.mana - cost, casts: [...state.casts, cast], lastCast: cast, lastRejection: null };
      world.emit(SpellCastReleased, cast);
    }
    world.setResource(SpellCastState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "spell-cast-domain-kit",
    provides: ["n:spell-cast", "magic:spell-cast"],
    resources: { SpellCastState },
    events: { SpellCastRequested, SpellCastReleased, SpellCastRejected },
    systems: [{ phase: config.phase ?? "simulate", name: "spellCastDomainSystem", system }],
    initWorld({ world }) { world.setResource(SpellCastState, createState(config)); },
    install({ engine, world }) {
      engine.spellCastDomain = {
        cast(spellId, payload = {}) { world.emit(SpellCastRequested, { spellId, ...payload }); return world.getResource(SpellCastState); },
        getState() { return clone(world.getResource(SpellCastState)); }
      };
    },
    metadata: { domain: "spell-cast", parentDomain: "magic-combat", scope: "atomic-domain", extendsBase: "DomainServiceKit", composes: ["combat-stance-domain-kit", "mana-meter-domain-kit", "status-effect-domain-kit"], ownsLoop: false, purpose: "Owns spell cast validation, mana cost, and cast release events without renderer ownership." }
  });
}

export default createSpellCastDomainKit;
