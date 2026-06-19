export const AFFORDANCE_DESCRIPTOR_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createAffordanceDescriptorDomainKit requires NexusRealtime.${key}.`);
    }
  }
}

function normalizeAffordance(item = {}, index = 0) {
  const id = String(item.id ?? item.targetId ?? `affordance-${index + 1}`);
  return {
    id,
    targetId: String(item.targetId ?? id),
    actions: asArray(item.actions ?? item.action).map(String).filter(Boolean),
    label: String(item.label ?? id),
    enabled: item.enabled !== false,
    metadata: clone(item.metadata ?? {})
  };
}

function createState(config = {}) {
  const affordances = asArray(config.affordances).map(normalizeAffordance);
  return {
    version: AFFORDANCE_DESCRIPTOR_DOMAIN_KIT_VERSION,
    id: config.stateId ?? "affordance-descriptor-domain",
    domain: "affordance-descriptor",
    affordances,
    affordancesByTarget: Object.fromEntries(affordances.map((item) => [item.targetId, item])),
    lastResolution: null
  };
}

export function createAffordanceDescriptorDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const AffordanceDescriptorState = defineResource(config.resourceName ?? "affordanceDescriptorDomain.state");
  const AffordanceResolved = defineEvent("affordance.resolved");
  const AffordanceRejected = defineEvent("affordance.rejected");

  function setState(world, state) {
    world.setResource(AffordanceDescriptorState, {
      ...state,
      affordancesByTarget: Object.fromEntries(state.affordances.map((item) => [item.targetId, item]))
    });
  }

  return defineRuntimeKit({
    id: config.kitId ?? "affordance-descriptor-domain-kit",
    provides: ["n:affordance-descriptor", "interaction:affordances"],
    resources: { AffordanceDescriptorState },
    events: { AffordanceResolved, AffordanceRejected },
    systems: [],
    initWorld({ world }) {
      setState(world, createState(config));
    },
    install({ engine, world }) {
      engine.affordanceDescriptorDomain = {
        register(affordance) {
          const state = world.getResource(AffordanceDescriptorState) ?? createState(config);
          const normalized = normalizeAffordance(affordance, state.affordances.length);
          const affordances = [...state.affordances.filter((item) => item.targetId !== normalized.targetId), normalized];
          setState(world, { ...state, affordances });
          return normalized;
        },
        resolve(targetId, action, payload = {}) {
          const state = world.getResource(AffordanceDescriptorState) ?? createState(config);
          const affordance = state.affordancesByTarget?.[String(targetId)];
          const result = { targetId: String(targetId), action: String(action ?? ""), routeId: payload.routeId ?? null };

          if (!affordance || !affordance.enabled || (affordance.actions.length && !affordance.actions.includes(result.action))) {
            const rejection = {
              ...result,
              reason: !affordance ? "missing-affordance" : !affordance.enabled ? "affordance-disabled" : "action-not-supported"
            };
            world.emit(AffordanceRejected, rejection);
            setState(world, { ...state, lastResolution: rejection });
            return { ok: false, ...rejection };
          }

          const accepted = { ok: true, ...result, affordance };
          world.emit(AffordanceResolved, accepted);
          setState(world, { ...state, lastResolution: accepted });
          return clone(accepted);
        },
        getState() {
          return clone(world.getResource(AffordanceDescriptorState));
        }
      };
    },
    metadata: {
      domain: "affordance-descriptor",
      scope: "large-domain",
      extendsBase: "DomainServiceKit",
      composes: ["interaction-domain-kit", "input-action-domain-kit"],
      ownsLoop: false,
      purpose: "Owns target/action affordance descriptors and validation without deciding gameplay outcomes."
    }
  });
}

export default createAffordanceDescriptorDomainKit;
