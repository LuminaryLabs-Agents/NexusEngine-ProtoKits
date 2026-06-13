import { add3, clamp, dt, ensureState, forwardFromRotation, installApi, len3, makeRuntimeKit, mix, mul3, norm3, now, num, terrainHeight, writeState, createDefinitions } from './core.js';

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
        state.body = { ...state.body, ...patch, position: { ...(state.body.position ?? {}), ...(patch.position ?? {}) }, velocity: { ...(state.body.velocity ?? {}), ...(patch.velocity ?? {}) }, rotation: { ...(state.body.rotation ?? {}), ...(patch.rotation ?? {}) } };
        writeState(world, definitions, state);
        return state.body;
      };
      api.reset = (overrides = {}) => {
        const state = api.getState();
        const terrainApi = engine.genericTerrainSampler;
        const x = num(overrides.x, 0);
        const z = num(overrides.z, 0);
        const ground = num(terrainApi?.heightAt?.(x, z), terrainHeight(state.terrain, x, z));
        state.body = {
          ...state.body,
          position: { x, y: ground + num(overrides.altitude, num(config.spawnAltitude, 120)), z },
          velocity: { x: 0, y: -2, z: -num(overrides.speed, 38) },
          rotation: { pitch: 0, yaw: 0, roll: 0 },
          speed: num(overrides.speed, 38),
          onGround: false,
          stalled: false,
          lastGroundHeight: ground
        };
        writeState(world, definitions, state);
        return state.body;
      };
      api.impulse = (vector = {}) => {
        const state = api.getState();
        state.body.velocity = add3(state.body.velocity, vector);
        writeState(world, definitions, state);
        return state.body.velocity;
      };
    },
    metadata: GENERIC_AERIAL_BODY_KIT_DEFINITION
  });
}

export const GENERIC_GLIDE_PHYSICS_KIT_DEFINITION = Object.freeze({ id: 'generic-glide-physics-kit', provides: ['aerial:glide-physics'], requires: ['aerial:body', 'input:flight', 'terrain:height-sampler'], purpose: 'Bird/glider steering, lift, drag, stall, speed limits, and terrain collision.' });
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
        const pitchRate = num(config.pitchSpeed, 1.35);
        const rollRate = num(config.rollSpeed, 1.9);
        const yawAssist = num(config.yawAssist, 1.18);
        body.rotation.pitch = clamp(body.rotation.pitch + num(input.pitch) * pitchRate * delta, -1.12, 1.02);
        body.rotation.roll += num(input.bank) * rollRate * delta;
        if (!input.bank) body.rotation.roll *= Math.exp(-num(config.rollRecentering, 3.2) * delta);
        body.rotation.roll = clamp(body.rotation.roll, -1.08, 1.08);
        body.rotation.yaw += (body.rotation.roll * yawAssist + num(input.yaw) * num(config.yawSpeed, 0.72)) * delta;

        const forward = forwardFromRotation(body.rotation);
        let velocity = { ...body.velocity };
        let speed = Math.max(0.001, len3(velocity));
        const velocityDir = norm3(velocity);
        const alignment = clamp((velocityDir.x * forward.x + velocityDir.y * forward.y + velocityDir.z * forward.z + 1) * 0.5, 0, 1);

        velocity.y -= num(config.gravity, 1.72) * delta;

        const dive = clamp(-body.rotation.pitch, 0, 1.1);
        const climb = clamp(body.rotation.pitch, 0, 1.0);
        const brake = clamp(input.brake ?? 0, 0, 1);
        const liftSpeed = clamp((speed - num(config.stallSpeed, 18)) / Math.max(1, num(config.liftFullSpeed, 58) - num(config.stallSpeed, 18)), 0, 1);
        const lift = liftSpeed * (1 - dive * 0.55) * num(config.lift, 5.8);
        velocity.y += lift * delta;
        velocity = add3(velocity, mul3(forward, (dive * num(config.diveAcceleration, 40) - climb * speed * num(config.climbEnergyCost, 0.11)) * delta));

        speed = len3(velocity);
        const alignRate = num(config.velocityAlignRate, 1.15) * (0.45 + alignment * 0.55);
        velocity = {
          x: mix(velocity.x, forward.x * speed, 1 - Math.exp(-alignRate * delta)),
          y: mix(velocity.y, forward.y * speed, 1 - Math.exp(-alignRate * 0.42 * delta)),
          z: mix(velocity.z, forward.z * speed, 1 - Math.exp(-alignRate * delta))
        };

        speed = len3(velocity);
        const drag = num(config.dragCoeff, 0.0065) * speed * speed * (1 + brake * 2.5);
        velocity = add3(velocity, mul3(norm3(velocity), -drag * delta));

        const forwardSpeed = velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z;
        if (forwardSpeed < num(config.minForwardSpeed, 15) && !body.onGround) {
          velocity = add3(velocity, mul3(forward, num(config.forwardRecovery, 9) * delta));
        }
        if (len3(velocity) > num(config.maxSpeed, 155)) velocity = mul3(norm3(velocity), num(config.maxSpeed, 155));

        let position = add3(body.position, mul3(velocity, delta));
        const ground = terrainHeight(state.terrain, position.x, position.z) + num(config.clearance, 2.2);
        body.onGround = false;
        body.stalled = len3(velocity) < num(config.stallSpeed, 18) && body.rotation.pitch > 0.2;
        if (body.stalled) velocity.y -= num(config.stallDrop, 11) * delta;

        if (position.y < ground) {
          position = { ...position, y: ground };
          velocity = { ...velocity, y: Math.max(0, velocity.y), x: velocity.x * Math.exp(-8 * delta), z: velocity.z * Math.exp(-8 * delta) };
          body.onGround = true;
          body.stalled = false;
          body.rotation.pitch = mix(body.rotation.pitch, 0, 1 - Math.exp(-8 * delta));
          body.rotation.roll = mix(body.rotation.roll, 0, 1 - Math.exp(-8 * delta));
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
          state.body.velocity = add3(state.body.velocity, mul3(forwardFromRotation(state.body.rotation), num(config.impulse, 48)));
          state.boost = { cooldown: num(config.cooldown, 1.45), lastTriggeredAt: now(world) };
          world.emit(definitions.Boosted, { bodyId: state.body.id, impulse: num(config.impulse, 48) });
        }
        writeState(world, definitions, state);
      }
    }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericBoostImpulse', config); },
    metadata: GENERIC_BOOST_IMPULSE_KIT_DEFINITION
  });
}
