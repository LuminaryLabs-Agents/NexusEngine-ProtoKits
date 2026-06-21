import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FOOTSTEP_FEEDBACK_KIT_VERSION = "0.1.0";

export function createFootstepFeedbackState(options = {}) {
  return { version: FOOTSTEP_FEEDBACK_KIT_VERSION, accumulatedDistance: 0, lastStepDistance: 0, events: [], cadence: { walk: number(options.walkCadence, 1.8), sprint: number(options.sprintCadence, 2.4) }, intensity: { walk: number(options.walkIntensity, 0.9), sprint: number(options.sprintIntensity, 1.25) }, defaultSurface: options.defaultSurface ?? "ground" };
}

export function updateFootstepFeedback(state = createFootstepFeedbackState(), motion = {}, dt = 1 / 60, surface = state.defaultSurface) {
  const next = clone(state);
  const speed = number(motion.speed, Math.hypot(number(motion.velocity?.x, 0), number(motion.velocity?.z, 0)));
  next.accumulatedDistance += speed * Math.max(0, number(dt, 0));
  const sprinting = Boolean(motion.sprinting);
  const cadence = sprinting ? next.cadence.sprint : next.cadence.walk;
  const events = [];
  if (speed > 0.6 && next.accumulatedDistance - next.lastStepDistance >= cadence) {
    next.lastStepDistance = next.accumulatedDistance;
    events.push({ type: "footstep.triggered", intensity: sprinting ? next.intensity.sprint : next.intensity.walk, sprinting, surface, position: clone(motion.position ?? {}), distance: next.accumulatedDistance });
  }
  next.events = [...next.events, ...events].slice(-32);
  return { state: next, events };
}

export function createFootstepFeedbackKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const FootstepFeedbackState = resource(options.resourceName ?? "footstepFeedback.state");
  const FootstepTriggered = event("footstep.triggered");
  const FootstepFeedbackUpdated = event("footstepFeedback.updated");
  const initial = () => createFootstepFeedbackState(options);
  return defineInjectedRuntimeKit(nexusRealtime, { id: options.id ?? "footstep-feedback-kit", resources: { FootstepFeedbackState }, events: { FootstepTriggered, FootstepFeedbackUpdated }, requires: ["fps:motion", "terrain:sampler"], provides: ["audio:footstep-events", "feedback:footstep"], initWorld({ world }) { ensureResource(world, FootstepFeedbackState, initial); }, install({ engine, world }) { const state = () => ensureResource(world, FootstepFeedbackState, initial); const api = { getState: state, stepFromMotion(motion = engine.fpsMotion?.getState?.(), dt = number(world?.__nexusClock?.delta, 1 / 60), surface = options.defaultSurface ?? "ground") { const result = updateFootstepFeedback(state(), motion ?? {}, dt, surface); world.setResource(FootstepFeedbackState, result.state); for (const evt of result.events) world.emit?.(FootstepTriggered, evt); world.emit?.(FootstepFeedbackUpdated, { state: clone(result.state), events: clone(result.events) }); return clone(result); }, consumeEvents() { const events = clone(state().events); const next = { ...state(), events: [] }; world.setResource(FootstepFeedbackState, next); return events; }, snapshot: () => clone(state()) }; engine.footstepFeedback = api; engine.n ??= {}; engine.n.footstepFeedback = api; }, metadata: { version: FOOTSTEP_FEEDBACK_KIT_VERSION, purpose: "Renderer-agnostic footstep cadence and feedback events." } });
}

export default createFootstepFeedbackKit;
