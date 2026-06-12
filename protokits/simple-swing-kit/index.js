import { clamp, clone, defineInjectedRuntimeKit, ensureResource, getClockDelta, number } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions, patchClimbState } from "../vertical-climb-core/index.js";

export const SIMPLE_SWING_KIT_VERSION = "0.0.1";

export function createDefaultSwingState(options = {}) {
  return { version: SIMPLE_SWING_KIT_VERSION, attached: false, anchorId: null, anchor: { x: 0, y: 0, z: 0 }, ropeLength: number(options.ropeLength, 3.5), angle: number(options.angle, 0), velocity: 0, horizontalMomentum: 0, axis: 0, maxAngle: number(options.maxAngle, 0.78), releasedAt: null };
}

export function updateSimpleSwing(swingState = {}, inputAxis = 0, dt = 1 / 60, options = {}) {
  const next = { ...createDefaultSwingState(options), ...swingState };
  if (!next.attached) { next.axis = 0; next.horizontalMomentum *= Math.pow(number(options.releaseDecay, 0.9), dt * 60); return next; }
  const axis = clamp(inputAxis, -1, 1);
  next.axis = axis;
  next.velocity += (-Math.sin(next.angle) * number(options.gravity, 4.4) + axis * number(options.inputAcceleration, 2.6)) * dt;
  next.velocity *= Math.pow(number(options.damping, 0.986), dt * 60);
  next.velocity = clamp(next.velocity, -number(options.maxVelocity, 2.4), number(options.maxVelocity, 2.4));
  next.angle = clamp(next.angle + next.velocity * dt, -next.maxAngle, next.maxAngle);
  next.horizontalMomentum = next.velocity + Math.sin(next.angle) * number(options.angleMomentumScale, 0.65);
  return next;
}

export function swingPlayerPosition(swingState = {}) {
  const anchor = swingState.anchor ?? {};
  const length = number(swingState.ropeLength, 3.5);
  const angle = number(swingState.angle);
  return { x: number(anchor.x) + Math.sin(angle) * length, y: number(anchor.y) - Math.cos(angle) * length, z: number(anchor.z), rotation: -angle * 0.55 };
}

export function createSimpleSwingKit(nexusRealtime = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusRealtime, options);
  const { resources, events } = definitions;
  const system = (world) => {
    let swingState = ensureResource(world, resources.SwingState, () => createDefaultSwingState(options));
    const climbState = world.getResource(resources.ClimbState);
    let axis = number(swingState.axis);
    for (const input of world.readEvents(events.SwingInput)) axis = clamp(input?.axis ?? 0, -1, 1);
    if (climbState?.mode !== "swinging" && swingState.attached && options.detachWhenNotSwinging !== false) swingState = { ...swingState, attached: false, axis: 0 };
    swingState = updateSimpleSwing(swingState, axis, getClockDelta(world), options);
    if (swingState.attached && climbState && options.bindClimbState !== false) world.setResource(resources.ClimbState, patchClimbState(climbState, { player: swingPlayerPosition(swingState), mode: "swinging" }));
    world.setResource(resources.SwingState, swingState);
  };
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "simple-swing-kit",
    resources: { SwingState: resources.SwingState, ClimbState: resources.ClimbState },
    events: { SwingInput: events.SwingInput, SwingStarted: events.SwingStarted, SwingReleased: events.SwingReleased },
    systems: [{ phase: "simulate", name: "simpleSwingSystem", system }],
    provides: ["simple-swing"],
    initWorld({ world }) { ensureResource(world, resources.SwingState, () => createDefaultSwingState(options)); },
    install({ engine, world }) {
      engine.simpleSwing = {
        definitions,
        getState: () => world.getResource(resources.SwingState),
        attach(anchor = {}, attachOptions = {}) { const state = { ...createDefaultSwingState(options), ...world.getResource(resources.SwingState), attached: true, anchorId: attachOptions.anchorId ?? anchor.id ?? null, anchor: { x: number(anchor.x), y: number(anchor.y), z: number(anchor.z) }, ropeLength: number(attachOptions.ropeLength, number(anchor.ropeLength, number(options.ropeLength, 3.5))), angle: number(attachOptions.angle, number(options.attachAngle, -0.25)), velocity: number(attachOptions.velocity, number(options.attachVelocity, 0.5)), axis: 0 }; world.setResource(resources.SwingState, state); world.emit(events.SwingStarted, { swing: state }); return state; },
        input(axis = 0) { world.emit(events.SwingInput, { axis: clamp(axis, -1, 1) }); return world.getResource(resources.SwingState); },
        release() { const state = { ...world.getResource(resources.SwingState), attached: false, axis: 0, releasedAt: world.__nexusClock?.elapsed ?? 0 }; world.setResource(resources.SwingState, state); world.emit(events.SwingReleased, { swing: state }); return state; },
        reset() { const state = createDefaultSwingState(options); world.setResource(resources.SwingState, state); return state; },
        snapshot: () => clone(world.getResource(resources.SwingState))
      };
    },
    metadata: { version: SIMPLE_SWING_KIT_VERSION, purpose: "Simple A/D rope swing momentum." }
  });
}
