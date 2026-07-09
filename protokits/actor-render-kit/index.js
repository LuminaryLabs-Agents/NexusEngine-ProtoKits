import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const ACTOR_RENDER_KIT_VERSION = "0.1.0";

export const DEFAULT_ACTOR_ARCHETYPES = Object.freeze({
  bird: {
    id: "bird",
    parts: [
      { id: "body", kind: "body", material: "actor.body", geometry: "low-poly-body", socket: "root" },
      { id: "head", kind: "head", material: "actor.body", geometry: "small-head", socket: "front" },
      { id: "leftWing", kind: "wing", material: "actor.body", geometry: "feather-wing", socket: "left" },
      { id: "rightWing", kind: "wing", material: "actor.body", geometry: "feather-wing", socket: "right" },
      { id: "tail", kind: "tail", material: "actor.body", geometry: "split-tail", socket: "back" }
    ]
  }
});

export function createPoseDescriptor(actor = {}, motion = {}) {
  const speed = number(motion.speed, 0);
  const roll = number(motion.rotation?.roll, 0);
  const pitch = number(motion.rotation?.pitch, 0);
  const dive = Math.max(0, -pitch);
  return {
    actorId: actor.id ?? "player",
    archetype: actor.archetype ?? "bird",
    transform: { position: clone(motion.position ?? actor.position ?? {}), rotation: clone(motion.rotation ?? actor.rotation ?? {}) },
    pose: {
      speed,
      bank: roll,
      dive,
      wingFlex: Math.min(1, speed / 120) * 0.35 + dive * 0.25,
      leftWingRoll: -roll * 0.45,
      rightWingRoll: roll * 0.45,
      trailAmount: Math.max(0, (speed - 50) / 90)
    },
    sockets: actor.sockets ?? { root: { x: 0, y: 0, z: 0 }, left: { x: -1, y: 0, z: 0 }, right: { x: 1, y: 0, z: 0 }, back: { x: 0, y: 0, z: 1 }, front: { x: 0, y: 0, z: -1 } }
  };
}

export function createActorRenderKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const ActorRenderState = resource(options.resourceName ?? "actorRender.state");
  const ActorPoseUpdated = event("actorRender.poseUpdated");
  const initial = () => ({ version: ACTOR_RENDER_KIT_VERSION, actors: asList(options.actors ?? [{ id: "player", archetype: "bird" }]), archetypes: { ...DEFAULT_ACTOR_ARCHETYPES, ...(options.archetypes ?? {}) }, poses: {} });

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "actor-render-kit",
    resources: { ActorRenderState },
    events: { ActorPoseUpdated },
    provides: ["actor-render", "pose-descriptors", "character-visual-state"],
    initWorld({ world }) { ensureResource(world, ActorRenderState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ActorRenderState, initial);
      engine.actorRender = {
        getState: state,
        registerActor(actor) { const next = state(); next.actors.push(clone(actor)); world.setResource(ActorRenderState, next); return actor; },
        updateFromMotion(actorId = "player", motion = engine.flightMotion?.snapshot?.()) {
          const next = state();
          const actor = next.actors.find((entry) => entry.id === actorId) ?? { id: actorId, archetype: "bird" };
          const pose = createPoseDescriptor(actor, motion);
          next.poses[actorId] = pose;
          world.setResource(ActorRenderState, next);
          world.emit(ActorPoseUpdated, { actorId, pose: clone(pose) });
          return pose;
        },
        getArchetype(id) { return clone(state().archetypes[id]); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: ACTOR_RENDER_KIT_VERSION, purpose: "Generic actor part, socket, pose, bank, speed, and trail descriptors." }
  });
}
