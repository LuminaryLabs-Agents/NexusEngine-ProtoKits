import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, scopedSeed } from "../protokit-core/index.js";

export const FLOCK_AGENT_KIT_VERSION = "0.1.0";

export function createFlockState(options = {}) {
  const count = number(options.count, 8);
  const rng = createSeededRandom(options.seed ?? "flock");
  const agents = asList(options.agents).length ? asList(options.agents) : Array.from({ length: count }, (_, index) => ({
    id: `agent-${index + 1}`,
    archetype: options.archetype ?? "bird",
    position: { x: rng.range(-100, 100), y: rng.range(140, 220), z: rng.range(-260, -80) },
    velocity: { x: rng.range(-4, 4), y: rng.range(-1, 1), z: rng.range(-32, -18) },
    targetOffset: { x: rng.range(-80, 80), y: rng.range(-24, 30), z: rng.range(-100, -45) },
    phase: rng.range(0, Math.PI * 2)
  }));
  return { version: FLOCK_AGENT_KIT_VERSION, seed: options.seed ?? "flock", config: { maxSpeed: number(options.maxSpeed, 38), followForce: number(options.followForce, 18), damping: number(options.damping, 0.985) }, agents };
}

const add = (a, b, s = 1) => ({ x: number(a.x) + number(b.x) * s, y: number(a.y) + number(b.y) * s, z: number(a.z) + number(b.z) * s });
const len = (v) => Math.hypot(number(v.x), number(v.y), number(v.z));
const norm = (v) => { const l = len(v) || 1; return { x: number(v.x) / l, y: number(v.y) / l, z: number(v.z) / l }; };

export function stepFlock(state = {}, target = {}, dt = 1 / 60) {
  const next = clone(state);
  const cfg = next.config ?? {};
  for (const agent of next.agents) {
    const desired = add(target, agent.targetOffset ?? {});
    const toTarget = { x: desired.x - agent.position.x, y: desired.y - agent.position.y, z: desired.z - agent.position.z };
    if (len(toTarget) > 5) agent.velocity = add(agent.velocity, norm(toTarget), number(cfg.followForce, 18) * dt);
    const speed = len(agent.velocity);
    if (speed > number(cfg.maxSpeed, 38)) agent.velocity = { ...norm(agent.velocity), x: norm(agent.velocity).x * cfg.maxSpeed, y: norm(agent.velocity).y * cfg.maxSpeed, z: norm(agent.velocity).z * cfg.maxSpeed };
    agent.velocity = { x: agent.velocity.x * cfg.damping, y: agent.velocity.y * cfg.damping, z: agent.velocity.z * cfg.damping };
    agent.position = add(agent.position, agent.velocity, dt);
    agent.phase = number(agent.phase) + dt * 12;
  }
  return next;
}

export function createFlockAgentKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const FlockAgentState = resource(options.resourceName ?? "flockAgent.state");
  const FlockAgentUpdated = event("flockAgent.updated");
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "flock-agent-kit",
    resources: { FlockAgentState },
    events: { FlockAgentUpdated },
    provides: ["flock-agent", "companion-agent"],
    initWorld({ world }) { ensureResource(world, FlockAgentState, () => createFlockState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, FlockAgentState, () => createFlockState(options));
      engine.flockAgent = {
        getState: state,
        step(target = engine.flightMotion?.snapshot?.()?.position ?? {}, dt = 1 / 60) {
          const next = stepFlock(state(), target, dt);
          world.setResource(FlockAgentState, next);
          world.emit(FlockAgentUpdated, { state: clone(next) });
          return next;
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: FLOCK_AGENT_KIT_VERSION, purpose: "Generic companion flock/swarm follow descriptors for birds, fish, drones, boats, or cars." }
  });
}
