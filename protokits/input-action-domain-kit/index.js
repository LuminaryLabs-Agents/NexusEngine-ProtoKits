export const INPUT_ACTION_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createInputActionDomainKit requires NexusEngine.${key}.`);
    }
  }
}

function createState(config = {}) {
  const allowedActions = asArray(config.allowedActions ?? config.actions).map(String).filter(Boolean);
  return {
    version: INPUT_ACTION_DOMAIN_KIT_VERSION,
    id: String(config.stateId ?? "input-action-domain"),
    domain: "input-action",
    allowedActions,
    requests: [],
    accepted: [],
    rejected: [],
    lastAction: null,
    lastRejectionReason: null
  };
}

export function createInputActionDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;

  const InputActionState = defineResource(config.resourceName ?? "inputActionDomain.state");
  const InputActionRequested = defineEvent("inputAction.requested");
  const InputActionAccepted = defineEvent("inputAction.accepted");
  const InputActionRejected = defineEvent("inputAction.rejected");

  function system(world) {
    const previous = world.getResource(InputActionState) ?? createState(config);
    const next = {
      ...previous,
      requests: [...previous.requests],
      accepted: [...previous.accepted],
      rejected: [...previous.rejected]
    };
    const allowed = new Set(next.allowedActions);

    for (const event of world.readEvents(InputActionRequested)) {
      const action = String(event.action ?? "").trim();
      const record = {
        action,
        payload: clone(event.payload ?? {}),
        routeId: event.routeId ?? null
      };
      next.requests.push(record);

      if (!action) {
        const rejection = { ...record, reason: "missing-action" };
        next.rejected.push(rejection);
        next.lastRejectionReason = rejection.reason;
        world.emit(InputActionRejected, rejection);
        continue;
      }

      if (allowed.size && !allowed.has(action)) {
        const rejection = { ...record, reason: "action-not-allowed" };
        next.rejected.push(rejection);
        next.lastRejectionReason = rejection.reason;
        world.emit(InputActionRejected, rejection);
        continue;
      }

      next.accepted.push(record);
      next.lastAction = action;
      next.lastRejectionReason = null;
      world.emit(InputActionAccepted, record);
    }

    world.setResource(InputActionState, next);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "input-action-domain-kit",
    provides: ["n:input-action", "input:actions", "command:input-request"],
    resources: { InputActionState },
    events: { InputActionRequested, InputActionAccepted, InputActionRejected },
    systems: [
      {
        phase: config.phase ?? "input",
        name: "inputActionDomainSystem",
        system
      }
    ],
    initWorld({ world }) {
      world.setResource(InputActionState, createState(config));
    },
    install({ engine, world }) {
      engine.inputActionDomain = {
        request(action, payload = {}) {
          world.emit(InputActionRequested, {
            action,
            payload,
            routeId: payload.routeId ?? config.routeId ?? null
          });
          return world.getResource(InputActionState);
        },
        getState() {
          return clone(world.getResource(InputActionState));
        }
      };
    },
    metadata: {
      domain: "input-action",
      scope: "large-domain",
      extendsBase: "DomainServiceKit",
      composes: ["NexusEngine InputIntentKit", "command surface"],
      ownsLoop: false,
      purpose: "Maps host input requests into validated domain actions without owning browser input or gameplay outcomes."
    }
  });
}

export default createInputActionDomainKit;
