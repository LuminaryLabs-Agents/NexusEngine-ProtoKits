import {
  ARCADE_RACE_CORE_VERSION,
  clamp,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  distance2,
  getClockElapsed,
  number,
  speed2
} from "../arcade-race-core/index.js";

export const RACER_CONTACT_KIT_VERSION = "0.0.1";

function defaultContact(options = {}) {
  return {
    radius: number(options.radius, 0.82),
    bumpPower: number(options.bumpPower, 8),
    shovePower: number(options.shovePower, 5),
    blockPower: number(options.blockPower, 0.35),
    spinoutThreshold: number(options.spinoutThreshold, 24),
    cooldown: number(options.cooldown, 0.35),
    recoverySeconds: number(options.recoverySeconds, 0.85),
    maxSpinoutsPerWindow: number(options.maxSpinoutsPerWindow, 1),
    fairnessWindow: number(options.fairnessWindow, 3.5),
    lastContacts: new Map(),
    spinouts: []
  };
}

function ensureContact(world, components, entity, options) {
  if (world.hasComponent(entity, components.RacerContact)) {
    const contact = world.getComponent(entity, components.RacerContact);
    if (!(contact.lastContacts instanceof Map)) contact.lastContacts = new Map();
    if (!Array.isArray(contact.spinouts)) contact.spinouts = [];
    return contact;
  }
  return world.setComponent(entity, components.RacerContact, defaultContact(options));
}

function canContact(contact, other, now) {
  const lastContacts = contact.lastContacts instanceof Map ? contact.lastContacts : new Map();
  contact.lastContacts = lastContacts;
  const last = number(lastContacts.get(other), -Infinity);
  return now - last >= number(contact.cooldown, 0.35);
}

function markContact(contact, other, now) {
  const lastContacts = contact.lastContacts instanceof Map ? contact.lastContacts : new Map();
  contact.lastContacts = lastContacts;
  lastContacts.set(other, now);
}

function canSpinout(contact, now) {
  const window = number(contact.fairnessWindow, 3.5);
  contact.spinouts = (contact.spinouts ?? []).filter((time) => now - time <= window);
  return contact.spinouts.length < number(contact.maxSpinoutsPerWindow, 1);
}

function markSpinout(contact, now) {
  contact.spinouts = contact.spinouts ?? [];
  contact.spinouts.push(now);
}

function createContactSystem(definitions, options = {}) {
  const { components, events } = definitions;

  return function racerContactSystem(world) {
    const racers = world.query(components.Racer, components.Position, components.Velocity);
    const now = getClockElapsed(world);

    for (let i = 0; i < racers.length; i += 1) {
      const a = racers[i];
      const aPosition = world.getComponent(a, components.Position);
      const aVelocity = world.getComponent(a, components.Velocity);
      const aContact = ensureContact(world, components, a, options);

      for (let j = i + 1; j < racers.length; j += 1) {
        const b = racers[j];
        const bPosition = world.getComponent(b, components.Position);
        const bVelocity = world.getComponent(b, components.Velocity);
        const bContact = ensureContact(world, components, b, options);

        const radius = number(aContact.radius, 0.82) + number(bContact.radius, 0.82);
        const distance = distance2(aPosition, bPosition);
        if (distance > radius || distance <= 0.0001) continue;
        if (!canContact(aContact, b, now) || !canContact(bContact, a, now)) continue;

        markContact(aContact, b, now);
        markContact(bContact, a, now);

        const nx = (number(aPosition.x) - number(bPosition.x)) / distance;
        const nz = (number(aPosition.z ?? aPosition.y) - number(bPosition.z ?? bPosition.y)) / distance;
        const overlap = radius - distance;
        const relativeX = number(aVelocity.x) - number(bVelocity.x);
        const relativeZ = number(aVelocity.z ?? aVelocity.y) - number(bVelocity.z ?? bVelocity.y);
        const closing = Math.abs(relativeX * nx + relativeZ * nz);
        const impact = closing + overlap * number(options.overlapImpactScale, 8);
        const shove = clamp(impact / Math.max(1, number(options.spinoutThreshold, 24)), 0.15, 1.6);

        aPosition.x += nx * overlap * 0.5;
        bPosition.x -= nx * overlap * 0.5;
        if ("z" in aPosition || "z" in bPosition) {
          aPosition.z = number(aPosition.z) + nz * overlap * 0.5;
          bPosition.z = number(bPosition.z) - nz * overlap * 0.5;
        } else {
          aPosition.y = number(aPosition.y) + nz * overlap * 0.5;
          bPosition.y = number(bPosition.y) - nz * overlap * 0.5;
        }

        const aPower = number(aContact.bumpPower, 8) * shove;
        const bPower = number(bContact.bumpPower, 8) * shove;
        aVelocity.x += nx * aPower;
        bVelocity.x -= nx * bPower;
        if ("z" in aVelocity || "z" in bVelocity) {
          aVelocity.z = number(aVelocity.z) + nz * aPower;
          bVelocity.z = number(bVelocity.z) - nz * bPower;
        } else {
          aVelocity.y = number(aVelocity.y) + nz * aPower;
          bVelocity.y = number(bVelocity.y) - nz * bPower;
        }

        world.emit(events.RacerBumped, {
          a,
          b,
          impact,
          overlap,
          shove,
          aSpeed: speed2(aVelocity),
          bSpeed: speed2(bVelocity)
        });

        const spinoutThreshold = Math.min(
          number(aContact.spinoutThreshold, number(options.spinoutThreshold, 24)),
          number(bContact.spinoutThreshold, number(options.spinoutThreshold, 24))
        );
        if (impact >= spinoutThreshold) {
          const target = speed2(aVelocity) > speed2(bVelocity) ? b : a;
          const targetContact = target === a ? aContact : bContact;
          if (canSpinout(targetContact, now)) {
            markSpinout(targetContact, now);
            const recoverAt = now + number(targetContact.recoverySeconds, 0.85);
            world.setComponent(target, components.CrashState, {
              active: true,
              reason: "racer-contact-spinout",
              recoverAt,
              speed: target === a ? speed2(aVelocity) : speed2(bVelocity),
              drag: 6,
              intensity: shove
            });
            world.emit(events.RacerSpinout, {
              entity: target,
              source: target === a ? b : a,
              impact,
              recoverAt,
              fairnessWindow: number(targetContact.fairnessWindow, 3.5)
            });
          }
        }
      }
    }
  };
}

export function createRacerContactKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, events } = definitions;

  const bindings = {
    definitions,
    configureContact(world, entity, contact = {}) {
      const current = ensureContact(world, components, entity, options);
      return world.setComponent(entity, components.RacerContact, { ...current, ...contact });
    },
    snapshot(world) {
      return world.query(components.RacerContact).map((entity) => ({
        entity,
        contact: world.getComponent(entity, components.RacerContact)
      }));
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "racer-contact-kit",
    components: {
      Racer: components.Racer,
      Position: components.Position,
      Velocity: components.Velocity,
      RacerContact: components.RacerContact,
      CrashState: components.CrashState
    },
    events: {
      RacerBumped: events.RacerBumped,
      RacerSpinout: events.RacerSpinout
    },
    systems: [
      { phase: "resolve", name: "racerContactSystem", system: createContactSystem(definitions, options) }
    ],
    provides: ["arcade-race", "racer-contact"],
    bindings: {
      racerContact: bindings
    },
    install({ engine }) {
      engine.racerContact = bindings;
    },
    metadata: {
      version: RACER_CONTACT_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Bumping, blocking, shoving, spinout thresholds, recovery windows, and fairness limits.",
      usesNexusEngineKits: ["runtime-kit", "common-game-definitions", "world-physics-compatible"]
    }
  });
}
