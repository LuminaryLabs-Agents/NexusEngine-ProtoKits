import { add3, clamp, dt, ensureState, forwardFromRotation, installApi, len3, makeRuntimeKit, mul3, norm3, now, num, terrainHeight, writeState, createDefinitions } from './core.js';

export const GENERIC_AERIAL_BODY_KIT_DEFINITION = Object.freeze({ id: 'generic-aerial-body-kit', provides: ['aerial:body'], requires: ['terrain:height-sampler'], purpose: 'Durable 3D airborne body state.' });
export function createGenericAerialBodyKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_AERIAL_BODY_KIT_DEFINITION.id,
    provides: GENERIC_AERIAL_BODY_KIT_DEFINITION.provides,
    requires: GENERIC_AERIAL_BODY_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    initWorld({ world }) { ensureState(world, definitions, config); },
    install({ engine, world }) {
      const api = installApi(engine, world, definitions, 'genericAerialBody', config);
      api.getActiveBody = () => api.getState().body;
      api.setBody = (patch = {}) => {
        const state = api.getState();
        state.body = { ...state.body, ...patch };
        writeState(world, definitions, state);
        return state.body;
      };
    },
    metadata: GENERIC_AERIAL_BODY_KIT_DEFINITION
  });
}

export const GENERIC_GLIDE_PHYSICS_KIT_DEFINITION = Object.freeze({ id: 'generic-glide-physics-kit', provides: ['aerial:glide-physics'], requires: ['aerial:body', 'input:flight', 'terrain:height-sampler'], purpose: 'Glide steering, lift, drag, speed limits, and terrain collision.' });
export function createGenericGlidePhysicsKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_GLIDE_PHYSICS_KIT_DEFINITION.id,
    provides: GENERIC_GLIDE_PHYSICS_KIT_DEFINITION.provides,
    requires: GENERIC_GLIDE_PHYSICS_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{
      phase: 'simulate',
      name: 'generic-glide-physics-system',
      system(world) {
        const state = ensureState(world, definitions, config);
        const body = {
          ...state.body,
          position: { ...state.body.position },
          velocity: { ...state.body.velocity },
          rotation: { ...state.body.rotation }
        };
        const input = state.input ?? {};
        const delta = dt(world);
        body.rotation.pitch = clamp(body.rotation.pitch + num(input.pitch) * num(config.pitchSpeed, 1.55) * delta, -1.35, 1.35);
        body.rotation.roll = clamp((body.rotation.roll + num(input.bank) * num(config.rollSpeed, 2.0) * delta) * (input.bank ? 1 : Math.exp(-3.8 * delta)), -1.2, 1.2);
        body.rotation.yaw += (body.rotation.roll * 1.35 + num(input.yaw) * 0.7) * delta;
        const forward = forwardFromRotation(body.rotation);
        let velocity = body.velocity;
        velocity.y -= num(config.gravity, 1.7) * delta;
        const speed = len3(velocity);
        if (body.rotation.pitch < 0) {
          velocity = add3(velocity, mul3(forward, Math.abs(Math.sin(body.rotation.pitch)) * num(config.diveAcceleration, 42) * delta));
        } else if (speed > 10) {
          velocity.y += speed * 0.34 * Math.sin(body.rotation.pitch) * delta;
          velocity = add3(velocity, mul3(forward, -speed * 0.18 * Math.sin(body.rotation.pitch) * delta));
        }
        velocity = add3(velocity, mul3(velocity, -Math.min(speed * speed * num(config.dragCoeff, 0.00007), 0.42) * delta));
        if (speed < num(config.minForwardSpeed, 15)) velocity = add3(velocity, mul3(forward, num(config.forwardRecovery, 8) * delta));
        if (len3(velocity) > num(config.maxSpeed, 155)) velocity = mul3(norm3(velocity), num(config.maxSpeed, 155));
        let position = add3(body.position, mul3(velocity, delta));
        const ground = terrainHeight(state.terrain, position.x, position.z) + num(config.clearance, 1.8);
        body.onGround = false;
        if (position.y < ground) {
          position = { ...position, y: ground };
          velocity = { ...velocity, y: Math.max(0, velocity.y), x: velocity.x * 0.94, z: velocity.z * 0.94 };
          body.onGround = true;
          body.rotation.pitch = 0;
          body.rotation.roll = 0;
        }
        state.body = { ...body, position, velocity, speed: len3(velocity), lastGroundHeight: terrainHeight(state.terrain, position.x, position.z) };
        writeState(world, definitions, state);
      }
    }],
    metadata: GENERIC_GLIDE_PHYSICS_KIT_DEFINITION
  });
}

export const GENERIC_BOOST_IMPULSE_KIT_DEFINITION = Object.freeze({ id: 'generic-boost-impulse-kit', provides: ['aerial:boost-impulse'], requires: ['aerial:body', 'input:flight'], purpose: 'Cooldown-gated forward boost impulse.' });
export function createGenericBoostImpulseKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_BOOST_IMPULSE_KIT_DEFINITION.id,
    provides: GENERIC_BOOST_IMPULSE_KIT_DEFINITION.provides,
    requires: GENERIC_BOOST_IMPULSE_KIT_DEFINITION.requires,
    events: { Boosted: definitions.Boosted },
    resources: { State: definitions.State },
    systems: [{
      phase: 'simulate',
      name: 'generic-boost-impulse-system',
      system(world) {
        const state = ensureState(world, definitions, config);
        const delta = dt(world);
        state.boost = { cooldown: Math.max(0, num(state.boost?.cooldown) - delta), lastTriggeredAt: num(state.boost?.lastTriggeredAt, -999) };
        if (state.input?.boost && state.boost.cooldown <= 0) {
          state.body.velocity = add3(state.body.velocity, mul3(forwardFromRotation(state.body.rotation), num(config.impulse, 52)));
          state.boost = { cooldown: num(config.cooldown, 1.5), lastTriggeredAt: now(world) };
          world.emit(definitions.Boosted, { bodyId: state.body.id });
        }
        writeState(world, definitions, state);
      }
    }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericBoostImpulse', config); },
    metadata: GENERIC_BOOST_IMPULSE_KIT_DEFINITION
  });
}
