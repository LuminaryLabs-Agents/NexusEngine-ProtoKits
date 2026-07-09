import { clamp, createDefinitions, ensureState, len3, makeRuntimeKit, now, num, writeState } from './core.js';

export const ARTICULATED_RIG_DESCRIPTOR_KIT_VERSION = '0.1.0';
export const PROCEDURAL_WING_FLAP_KIT_VERSION = '0.1.0';
export const FLIGHT_POSE_DRIVER_KIT_VERSION = '0.1.0';
export const RIG_ANIMATION_DESCRIPTOR_KIT_VERSION = '0.1.0';

function defaultBirdRig(config = {}) {
  const wingSpan = num(config.wingSpan, 8.6);
  const innerLength = num(config.innerWingLength, wingSpan * 0.46);
  const outerLength = num(config.outerWingLength, wingSpan * 0.38);
  return {
    id: config.rigId ?? 'bird-rig',
    type: 'articulated-winged-body',
    parts: {
      body: { kind: 'body', length: num(config.bodyLength, 5.2), radius: num(config.bodyRadius, 1.2) },
      head: { kind: 'head', radius: num(config.headRadius, 0.82), offset: { x: 0, y: 0.55, z: -2.8 } },
      leftInnerWing: { kind: 'wing-inner', side: -1, length: innerLength, chord: num(config.innerChord, 1.35), joint: 'leftShoulder' },
      rightInnerWing: { kind: 'wing-inner', side: 1, length: innerLength, chord: num(config.innerChord, 1.35), joint: 'rightShoulder' },
      leftOuterWing: { kind: 'wing-outer', side: -1, length: outerLength, chord: num(config.outerChord, 1.05), joint: 'leftElbow' },
      rightOuterWing: { kind: 'wing-outer', side: 1, length: outerLength, chord: num(config.outerChord, 1.05), joint: 'rightElbow' }
    },
    joints: {
      leftShoulder: { side: -1, parent: 'body', offset: { x: -0.72, y: 0, z: -0.35 } },
      rightShoulder: { side: 1, parent: 'body', offset: { x: 0.72, y: 0, z: -0.35 } },
      leftElbow: { side: -1, parent: 'leftInnerWing', offset: { x: -innerLength, y: 0, z: 0 } },
      rightElbow: { side: 1, parent: 'rightInnerWing', offset: { x: innerLength, y: 0, z: 0 } },
      leftTip: { side: -1, parent: 'leftOuterWing', offset: { x: -outerLength, y: 0, z: 0 } },
      rightTip: { side: 1, parent: 'rightOuterWing', offset: { x: outerLength, y: 0, z: 0 } }
    }
  };
}

function rigConfig(config = {}) {
  return {
    baseFlapRate: num(config.baseFlapRate, 3.25),
    speedFlapRate: num(config.speedFlapRate, 0.012),
    minAmplitude: num(config.minAmplitude, 0.045),
    maxAmplitude: num(config.maxAmplitude, 0.68),
    climbAmplitude: num(config.climbAmplitude, 0.22),
    boostAmplitude: num(config.boostAmplitude, 0.22),
    glideFlattening: num(config.glideFlattening, 0.82),
    tipLag: num(config.tipLag, 0.54),
    tipFold: num(config.tipFold, 0.72),
    downstrokeBias: num(config.downstrokeBias, 1.34),
    bodyBob: num(config.bodyBob, 0.05),
    ...config
  };
}

export const ARTICULATED_RIG_DESCRIPTOR_KIT_DEFINITION = Object.freeze({
  id: 'articulated-rig-descriptor-kit',
  provides: ['rig:definition', 'render:rig-descriptor'],
  requires: ['aerial:body'],
  purpose: 'Renderer-neutral articulated body, joint, and part descriptor service.'
});
export function createArticulatedRigDescriptorKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: config.kitId ?? ARTICULATED_RIG_DESCRIPTOR_KIT_DEFINITION.id,
    provides: ARTICULATED_RIG_DESCRIPTOR_KIT_DEFINITION.provides,
    requires: ARTICULATED_RIG_DESCRIPTOR_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'articulated-rig-descriptor-system', system(world) {
      const state = ensureState(world, definitions, config);
      if (!state.rig?.definition || state.rig.definition.id !== (config.rigId ?? 'bird-rig')) {
        state.rig = { ...(state.rig ?? {}), definition: config.rig ?? defaultBirdRig(config), settings: rigConfig(config) };
        writeState(world, definitions, state);
      }
    } }],
    install({ engine, world }) {
      engine.articulatedRig = { getState: () => ensureState(world, definitions, config).rig ?? {} };
    },
    metadata: ARTICULATED_RIG_DESCRIPTOR_KIT_DEFINITION
  });
}

export const PROCEDURAL_WING_FLAP_KIT_DEFINITION = Object.freeze({
  id: 'procedural-wing-flap-kit',
  provides: ['rig:wing-flap'],
  requires: ['aerial:body', 'rig:definition'],
  purpose: 'Procedural wing-flap phase, amplitude, and stroke timing from flight state.'
});
export function createProceduralWingFlapKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: config.kitId ?? PROCEDURAL_WING_FLAP_KIT_DEFINITION.id,
    provides: PROCEDURAL_WING_FLAP_KIT_DEFINITION.provides,
    requires: PROCEDURAL_WING_FLAP_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'procedural-wing-flap-system', system(world) {
      const state = ensureState(world, definitions, config);
      const settings = rigConfig({ ...(state.rig?.settings ?? {}), ...config });
      const body = state.body ?? {};
      const speed = num(body.speed, len3(body.velocity));
      const boostFlash = clamp(num(state.vfx?.boostFlash, 0), 0, 1);
      const climb = clamp(num(body.velocity?.y, 0) / 32, 0, 1);
      const stall = body.stalled ? 1 : 0;
      const glide = clamp((speed - 88) / 70, 0, 1);
      const rate = settings.baseFlapRate + speed * settings.speedFlapRate + boostFlash * 2.4 + stall * 1.3;
      const phase = now(world) * rate * Math.PI * 2;
      const wave = Math.sin(phase);
      const downstroke = wave < 0 ? Math.pow(-wave, settings.downstrokeBias) : 0;
      const upstroke = wave > 0 ? wave : 0;
      const amplitude = clamp(settings.minAmplitude + climb * settings.climbAmplitude + boostFlash * settings.boostAmplitude + stall * 0.2 - glide * settings.glideFlattening * 0.12, settings.minAmplitude, settings.maxAmplitude);
      state.rig = { ...(state.rig ?? {}), flap: { phase, wave, upstroke, downstroke, rate, amplitude, tipLag: settings.tipLag, tipFold: settings.tipFold, bodyBob: settings.bodyBob } };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.proceduralWingFlap = { getState: () => ensureState(world, definitions, config).rig?.flap ?? {} }; },
    metadata: PROCEDURAL_WING_FLAP_KIT_DEFINITION
  });
}

export const FLIGHT_POSE_DRIVER_KIT_DEFINITION = Object.freeze({
  id: 'flight-pose-driver-kit',
  provides: ['rig:flight-pose'],
  requires: ['aerial:body', 'rig:wing-flap'],
  purpose: 'Flight-mode pose weights for glide, flap, boost, climb, dive, and stall.'
});
export function createFlightPoseDriverKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: config.kitId ?? FLIGHT_POSE_DRIVER_KIT_DEFINITION.id,
    provides: FLIGHT_POSE_DRIVER_KIT_DEFINITION.provides,
    requires: FLIGHT_POSE_DRIVER_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'flight-pose-driver-system', system(world) {
      const state = ensureState(world, definitions, config);
      const body = state.body ?? {};
      const speed = num(body.speed, len3(body.velocity));
      const pitch = num(body.rotation?.pitch, 0);
      const boost = clamp(num(state.vfx?.boostFlash, 0), 0, 1);
      const dive = clamp(-pitch * 2.4, 0, 1);
      const climb = clamp(pitch * 2.2 + num(body.velocity?.y, 0) / 45, 0, 1);
      const stall = body.stalled ? 1 : 0;
      const glide = clamp((speed - 80) / 80, 0, 1) * (1 - boost * 0.35) * (1 - stall * 0.6);
      state.rig = { ...(state.rig ?? {}), pose: { mode: stall ? 'stall' : boost ? 'boost' : dive > 0.45 ? 'dive' : climb > 0.45 ? 'climb' : glide > 0.45 ? 'glide' : 'flap', weights: { glide, boost, dive, climb, stall } } };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.flightPoseDriver = { getState: () => ensureState(world, definitions, config).rig?.pose ?? {} }; },
    metadata: FLIGHT_POSE_DRIVER_KIT_DEFINITION
  });
}

export const RIG_ANIMATION_DESCRIPTOR_KIT_DEFINITION = Object.freeze({
  id: 'rig-animation-descriptor-kit',
  provides: ['render:rig-animation-descriptor'],
  requires: ['rig:definition', 'rig:wing-flap', 'rig:flight-pose'],
  purpose: 'Final renderer-neutral joint rotations and body offsets for articulated rigs.'
});
export function createRigAnimationDescriptorKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: config.kitId ?? RIG_ANIMATION_DESCRIPTOR_KIT_DEFINITION.id,
    provides: RIG_ANIMATION_DESCRIPTOR_KIT_DEFINITION.provides,
    requires: RIG_ANIMATION_DESCRIPTOR_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'cleanup', name: 'rig-animation-descriptor-system', system(world) {
      const state = ensureState(world, definitions, config);
      const flap = state.rig?.flap ?? {};
      const pose = state.rig?.pose?.weights ?? {};
      const roll = num(state.body?.rotation?.roll, 0);
      const amp = num(flap.amplitude, 0.08);
      const wave = num(flap.wave, 0);
      const tipWave = Math.sin(num(flap.phase, 0) - num(flap.tipLag, 0));
      const glideFlatten = num(pose.glide, 0) * 0.25;
      const diveFlatten = num(pose.dive, 0) * 0.36;
      const boostPower = num(pose.boost, 0) * 0.24;
      const shoulder = wave * amp - glideFlatten + boostPower - diveFlatten;
      const tip = tipWave * amp * (1 + num(flap.tipFold, 0.6)) - num(flap.upstroke, 0) * amp * 0.45 - diveFlatten * 0.55;
      const bodyBob = Math.max(0, -wave) * num(flap.bodyBob, 0.04);
      state.rig = {
        ...(state.rig ?? {}),
        animation: {
          id: 'bird-wing-animation',
          elapsed: now(world),
          joints: {
            leftShoulder: { rotation: { x: 0, y: 0, z: -shoulder - roll * 0.35 } },
            rightShoulder: { rotation: { x: 0, y: 0, z: shoulder + roll * 0.35 } },
            leftElbow: { rotation: { x: 0, y: 0, z: -tip - roll * 0.15 } },
            rightElbow: { rotation: { x: 0, y: 0, z: tip + roll * 0.15 } },
            leftTip: { rotation: { x: 0, y: 0, z: -tip * 0.35 } },
            rightTip: { rotation: { x: 0, y: 0, z: tip * 0.35 } }
          },
          bodyOffset: { x: 0, y: bodyBob, z: 0 },
          pose: state.rig?.pose ?? {},
          flap
        }
      };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.rigAnimationDescriptor = { getState: () => ensureState(world, definitions, config).rig?.animation ?? {} }; },
    metadata: RIG_ANIMATION_DESCRIPTOR_KIT_DEFINITION
  });
}
