import { clamp, clone, defineInjectedRuntimeKit, distance2D, ensureResource, number } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions } from "../vertical-climb-core/index.js";
import { canReachRouteNode } from "../ledge-route-kit/index.js";

export const CLIMB_RISK_KIT_VERSION = "0.0.1";

export function evaluateClimbRisk(payload = {}, options = {}) {
  const routeState = payload.routeState ?? {};
  const fromId = payload.fromId ?? payload.climbState?.currentLedgeId;
  const toId = payload.toId ?? payload.targetId;
  const target = payload.target ?? routeState.nodes?.[toId];
  const from = payload.from ?? routeState.nodes?.[fromId];
  if (!from || !target) return { targetId: toId, reachable: false, risk: "invalid", reason: "missing-node", cost: 0, score: 1 };
  const reach = canReachRouteNode(routeState, fromId, toId, payload);
  const distance = reach.distance ?? distance2D(from.position, target.position);
  const momentum = Math.abs(number(payload.momentum ?? payload.swingState?.horizontalMomentum ?? payload.swingState?.momentum));
  const cost = clamp(number(target.staminaCost, number(options.baseCost, 12)) + distance * number(options.distanceCostScale, 1.4) - momentum * number(options.momentumDiscount, 2.6), number(options.minCost, 4), number(options.maxCost, 38));
  const stamina = number(payload.stamina ?? payload.climbState?.stamina, 100);
  const score = clamp(number(target.risk) + clamp(cost / Math.max(1, stamina), 0, 1) * 0.55 + (reach.reachable ? 0 : reach.reason === "too-far" ? 0.8 : 0.55), 0, 1);
  const risk = !reach.reachable ? "blocked" : score > 0.72 ? "high" : score > 0.42 ? "medium" : "low";
  return { targetId: toId, fromId, reachable: reach.reachable && stamina >= cost, routeReachable: reach.reachable, reason: stamina < cost ? "stamina" : reach.reason, cost, stamina, risk, score, distance, momentum, feedback: !reach.reachable ? "dim" : risk === "high" ? "flicker" : risk === "medium" ? "pulse" : "glow", target };
}

function createInitialState(options = {}) {
  return { version: CLIMB_RISK_KIT_VERSION, evaluations: {}, lastEvaluation: null, options: { overlayUi: options.overlayUi ?? false } };
}

export function createClimbRiskKit(nexusRealtime = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusRealtime, options);
  const { resources } = definitions;
  const system = (world) => {
    const state = ensureResource(world, resources.RiskState, () => createInitialState(options));
    const routeState = world.getResource(resources.RouteState) ?? {};
    const climbState = world.getResource(resources.ClimbState) ?? {};
    const swingState = world.getResource(resources.SwingState) ?? {};
    const targets = routeState.availableTargetIds ?? Object.keys(routeState.nodes ?? {}).filter((id) => id !== climbState.currentLedgeId);
    state.evaluations = Object.fromEntries(targets.map((targetId) => [targetId, evaluateClimbRisk({ routeState, climbState, swingState, fromId: climbState.currentLedgeId, toId: targetId }, options)]));
    world.setResource(resources.RiskState, state);
  };
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "climb-risk-kit",
    resources: { RiskState: resources.RiskState, ClimbState: resources.ClimbState, RouteState: resources.RouteState, SwingState: resources.SwingState },
    systems: [{ phase: "resolve", name: "climbRiskSystem", system }],
    provides: ["climb-risk"],
    bindings: { evaluateClimbRisk },
    initWorld({ world }) { ensureResource(world, resources.RiskState, () => createInitialState(options)); },
    install({ engine, world }) {
      engine.climbRisk = { definitions, evaluate(payload = {}) { const result = evaluateClimbRisk({ ...payload, routeState: payload.routeState ?? world.getResource(resources.RouteState) ?? {}, climbState: payload.climbState ?? world.getResource(resources.ClimbState) ?? {}, swingState: payload.swingState ?? world.getResource(resources.SwingState) ?? {} }, options); const state = ensureResource(world, resources.RiskState, () => createInitialState(options)); state.evaluations[result.targetId] = result; state.lastEvaluation = result; world.setResource(resources.RiskState, state); return result; }, canSpend: (cost) => number(world.getResource(resources.ClimbState)?.stamina) >= number(cost), snapshot: () => clone(world.getResource(resources.RiskState)) };
    },
    metadata: { version: CLIMB_RISK_KIT_VERSION, purpose: "Reach, stamina cost, momentum, and risk evaluation." }
  });
}
