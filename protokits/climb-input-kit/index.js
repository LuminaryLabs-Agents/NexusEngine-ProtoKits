import { clamp, clone, defineInjectedRuntimeKit, ensureResource, getClockElapsed, number } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions } from "../vertical-climb-core/index.js";

export const CLIMB_INPUT_KIT_VERSION = "0.0.1";

function createInitialState(options = {}) {
  return { version: CLIMB_INPUT_KIT_VERSION, inputMode: options.inputMode ?? "pointer", hoveredTargetId: null, lastTargetId: null, swingAxis: 0, lastClick: null, lastAction: null, focusActive: true };
}

export function createClimbInputKit(nexusRealtime = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusRealtime, options);
  const { resources, events } = definitions;
  const system = (world) => {
    const state = ensureResource(world, resources.InputState, () => createInitialState(options));
    const now = getClockElapsed(world);
    for (const event of world.readEvents(events.TargetHovered)) { state.hoveredTargetId = event?.targetId ?? null; state.lastAction = { type: "hover", at: now, targetId: state.hoveredTargetId }; }
    for (const event of world.readEvents(events.LedgeChosen)) { state.lastTargetId = event?.targetId ?? null; state.lastClick = { at: now, targetId: state.lastTargetId, source: event?.source ?? "input" }; state.lastAction = { type: "choose", at: now, targetId: state.lastTargetId }; }
    for (const event of world.readEvents(events.SwingInput)) { state.swingAxis = clamp(event?.axis ?? 0, -1, 1); state.lastAction = { type: "swing", at: now, axis: state.swingAxis }; }
    if (world.readEvents(events.ClimbRestarted).length) { state.swingAxis = 0; state.hoveredTargetId = null; state.lastAction = { type: "restart", at: now }; }
    world.setResource(resources.InputState, state);
  };
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "climb-input-kit",
    resources: { InputState: resources.InputState },
    events: { LedgeChosen: events.LedgeChosen, SwingInput: events.SwingInput, TargetHovered: events.TargetHovered, ClimbRestarted: events.ClimbRestarted },
    systems: [{ phase: "input", name: "climbInputStateSystem", system }],
    provides: ["climb-input"],
    initWorld({ world }) { ensureResource(world, resources.InputState, () => createInitialState(options)); },
    install({ engine, world }) {
      engine.climbInput = {
        definitions,
        choose(targetId, payload = {}) { world.emit(events.LedgeChosen, { targetId, source: "climb-input", ...payload }); return world.getResource(resources.InputState); },
        clickTarget(targetId, payload = {}) { return this.choose(targetId, payload); },
        hover(targetId) { world.emit(events.TargetHovered, { targetId }); return world.getResource(resources.InputState); },
        swingAxis(axis = 0) { world.emit(events.SwingInput, { axis: clamp(number(axis), -1, 1), source: "climb-input" }); return world.getResource(resources.InputState); },
        clearSwing() { world.emit(events.SwingInput, { axis: 0, source: "climb-input" }); return world.getResource(resources.InputState); },
        restart(payload = {}) { world.emit(events.ClimbRestarted, { source: "climb-input", ...payload }); return world.getResource(resources.InputState); },
        focus(active = true) { const state = ensureResource(world, resources.InputState, () => createInitialState(options)); state.focusActive = Boolean(active); if (!active) { state.swingAxis = 0; world.emit(events.SwingInput, { axis: 0, source: "focus-loss" }); } world.setResource(resources.InputState, state); return state; },
        snapshot: () => clone(world.getResource(resources.InputState))
      };
    },
    metadata: { version: CLIMB_INPUT_KIT_VERSION, purpose: "Renderer-agnostic click/hover/restart/swing intent routing." }
  });
}
