import { asList, clone, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions } from "../vertical-climb-core/index.js";

export const DIEGETIC_FEEDBACK_KIT_VERSION = "0.0.1";

function createInitialState(options = {}) {
  return { version: DIEGETIC_FEEDBACK_KIT_VERSION, overlayUi: options.overlayUi ?? false, signals: [], targetSignals: {}, worldSignals: [], lastMessage: null };
}

export function createDiegeticSignals(snapshot = {}, options = {}) {
  const { climbState = {}, routeState = {}, riskState = {}, swingState = {}, cloudState = {}, inputState = {} } = snapshot;
  const signals = [];
  const targetSignals = {};
  const available = new Set(asList(routeState.availableTargetIds));
  const evaluations = riskState.evaluations ?? {};
  for (const node of Object.values(routeState.nodes ?? {})) {
    const evaluation = evaluations[node.id];
    const reachable = available.has(node.id) || evaluation?.reachable;
    const hovered = inputState.hoveredTargetId === node.id || climbState.hoveredTargetId === node.id;
    const feedback = evaluation?.feedback ?? (reachable ? "glow" : "dim");
    targetSignals[node.id] = { targetId: node.id, kind: node.kind, reachable: Boolean(reachable), hovered, intensity: hovered ? 1 : reachable ? 0.72 : 0.18, feedback, colorRole: node.kind === "rest" ? "rest" : node.kind === "risky" || evaluation?.risk === "high" ? "danger" : "gold", showArc: hovered && reachable, costPreview: options.debugCosts ? evaluation?.cost : undefined };
  }
  if (swingState.attached) signals.push({ type: "rope-tension", intensity: Math.min(1, Math.abs(number(swingState.horizontalMomentum)) / 2.4), anchorId: swingState.anchorId });
  if (number(climbState.stamina, 100) < number(climbState.staminaMax, 100) * 0.28) signals.push({ type: "low-stamina", intensity: 1 - number(climbState.stamina) / Math.max(1, number(climbState.staminaMax, 100)) });
  if (climbState.mode === "falling") signals.push({ type: "fall", intensity: 1 });
  if (cloudState.currentZoneId) signals.push({ type: "cloud-zone", zoneId: cloudState.currentZoneId, fog: number(cloudState.fog), wind: number(cloudState.wind), theme: cloudState.theme });
  return { signals, targetSignals, worldSignals: signals.filter((signal) => ["cloud-zone", "low-stamina", "fall"].includes(signal.type)), lastMessage: options.overlayUi ? climbState.message ?? null : null };
}

export function createDiegeticFeedbackKit(nexusRealtime = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusRealtime, options);
  const { resources } = definitions;
  const system = (world) => {
    const state = ensureResource(world, resources.FeedbackState, () => createInitialState(options));
    Object.assign(state, createDiegeticSignals({ climbState: world.getResource(resources.ClimbState) ?? {}, routeState: world.getResource(resources.RouteState) ?? {}, riskState: world.getResource(resources.RiskState) ?? {}, swingState: world.getResource(resources.SwingState) ?? {}, cloudState: world.getResource(resources.CloudState) ?? {}, inputState: world.getResource(resources.InputState) ?? {} }, { ...options, overlayUi: state.overlayUi }));
    world.setResource(resources.FeedbackState, state);
  };
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "diegetic-feedback-kit",
    resources: { FeedbackState: resources.FeedbackState, ClimbState: resources.ClimbState, RouteState: resources.RouteState, RiskState: resources.RiskState, SwingState: resources.SwingState, CloudState: resources.CloudState, InputState: resources.InputState },
    systems: [{ phase: "cleanup", name: "diegeticFeedbackSystem", system }],
    provides: ["diegetic-feedback"],
    bindings: { createDiegeticSignals },
    initWorld({ world }) { ensureResource(world, resources.FeedbackState, () => createInitialState(options)); },
    install({ engine, world }) {
      engine.diegeticFeedback = { definitions, setOverlayUi(enabled = false) { const state = ensureResource(world, resources.FeedbackState, () => createInitialState(options)); state.overlayUi = Boolean(enabled); world.setResource(resources.FeedbackState, state); return state; }, snapshot: () => clone(world.getResource(resources.FeedbackState)), targetSignal: (targetId) => world.getResource(resources.FeedbackState)?.targetSignals?.[targetId] ?? null };
    },
    metadata: { version: DIEGETIC_FEEDBACK_KIT_VERSION, purpose: "World-space/no-overlay climb feedback signals." }
  });
}
