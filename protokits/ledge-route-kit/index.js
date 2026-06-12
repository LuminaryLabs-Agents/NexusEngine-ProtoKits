import { asList, byId, clone, defineInjectedRuntimeKit, distance2D, ensureResource, number, stableId } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions } from "../vertical-climb-core/index.js";

export const LEDGE_ROUTE_KIT_VERSION = "0.0.1";

export function normalizeRouteNode(input = {}, index = 0, defaults = {}) {
  const transform = input.transform ?? input.position ?? input;
  const kind = input.kind ?? input.type ?? input.archetype ?? input.metadata?.type ?? "ledge";
  return {
    id: input.id ?? stableId("ledge", defaults.seed, index, transform.x, transform.y),
    index: number(input.index, index),
    kind,
    type: kind,
    chunkId: input.chunkId ?? defaults.chunkId ?? "static",
    position: { x: number(transform.x), y: number(transform.y), z: number(transform.z) },
    size: { w: number(transform.w ?? input.size?.w, 1.4), h: number(transform.h ?? input.size?.h, 0.4), d: number(transform.d ?? input.size?.d, 1.2) },
    reachableFrom: asList(input.reachableFrom ?? input.from),
    maxReach: number(input.maxReach ?? input.metadata?.maxReach, defaults.maxReach ?? 5.8),
    swingReach: number(input.swingReach ?? input.metadata?.swingReach, defaults.swingReach ?? 7.5),
    minMomentum: number(input.minMomentum ?? input.metadata?.minMomentum, 0),
    staminaCost: number(input.staminaCost ?? input.cost ?? input.metadata?.staminaCost ?? input.metadata?.cost, defaults.staminaCost ?? 12),
    staminaRestore: number(input.staminaRestore ?? input.metadata?.staminaRestore, 0),
    risk: number(input.risk ?? input.metadata?.risk, 0),
    safe: input.safe ?? input.metadata?.safe ?? kind !== "risky",
    anchor: input.anchor ?? input.metadata?.anchor ?? null,
    ropeLength: number(input.ropeLength ?? input.metadata?.ropeLength, 3.5),
    metadata: { ...(input.metadata ?? {}) }
  };
}

export function normalizeRouteNodes(source = {}, options = {}) {
  const explicit = asList(source.nodes ?? source.ledges ?? options.nodes ?? options.ledges);
  const sceneObjects = asList(source.sceneRecipe?.objects ?? options.sceneRecipe?.objects)
    .filter((object) => object.kit === "interaction-target" || object.interaction || ["ledge", "rope", "rest", "finish", "risky"].includes(object.archetype ?? object.kind ?? object.metadata?.type));
  return (explicit.length ? explicit : sceneObjects).map((node, index) => normalizeRouteNode(node, index, options));
}

export function connectRouteNodes(nodes = [], options = {}) {
  const ordered = nodes.slice().sort((a, b) => number(a.index) - number(b.index) || number(a.position.y) - number(b.position.y));
  const window = Math.max(1, Math.floor(number(options.connectionWindow, 2)));
  return ordered.map((node, index) => node.reachableFrom?.length ? node : { ...node, reachableFrom: ordered.slice(Math.max(0, index - window), index).map((entry) => entry.id) });
}

function createInitialState(options = {}) {
  const nodes = connectRouteNodes(normalizeRouteNodes(options.level ?? options, options), options);
  return { version: LEDGE_ROUTE_KIT_VERSION, seed: options.seed ?? "ledge-route", nodes: byId(nodes), nodeOrder: nodes.map((node) => node.id), startId: options.startId ?? options.startingLedgeId ?? nodes[0]?.id ?? null, finishIds: nodes.filter((node) => node.kind === "finish").map((node) => node.id), availableTargetIds: [], lastCheck: null, stats: { registeredChunks: 0, pruned: 0 } };
}

export function canReachRouteNode(routeState = {}, fromId, toId, context = {}) {
  const from = routeState.nodes?.[fromId];
  const to = routeState.nodes?.[toId];
  if (!from || !to || fromId === toId) return { reachable: false, reason: !from ? "missing-from" : !to ? "missing-target" : "same-target", fromId, toId };
  const connected = context.ignoreGraph === true || asList(to.reachableFrom).length === 0 || asList(to.reachableFrom).includes(fromId);
  if (!connected) return { reachable: false, reason: "not-connected", fromId, toId, target: to };
  const distance = distance2D(from.position, to.position);
  const mode = context.mode ?? context.climbState?.mode ?? "ready";
  const momentum = Math.abs(number(context.momentum ?? context.swingState?.horizontalMomentum ?? context.swingState?.momentum));
  const reach = (mode === "swinging" ? number(to.swingReach, to.maxReach) : number(to.maxReach)) + momentum * number(context.momentumReachScale, 1.25);
  if (momentum < number(to.minMomentum)) return { reachable: false, reason: "needs-momentum", fromId, toId, distance, reach, momentum, target: to };
  if (distance > reach) return { reachable: false, reason: "too-far", fromId, toId, distance, reach, momentum, target: to };
  return { reachable: true, reason: "reachable", fromId, toId, distance, reach, momentum, target: to };
}

function available(routeState, climbState = {}, swingState = {}, options = {}) {
  const fromId = climbState.currentLedgeId ?? routeState.startId;
  return Object.keys(routeState.nodes ?? {}).filter((id) => canReachRouteNode(routeState, fromId, id, { climbState, swingState, mode: climbState.mode, momentum: swingState.horizontalMomentum, momentumReachScale: options.momentumReachScale }).reachable);
}

export function createLedgeRouteKit(nexusRealtime = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusRealtime, options);
  const { resources } = definitions;
  const system = (world) => {
    const routeState = ensureResource(world, resources.RouteState, () => createInitialState(options));
    routeState.availableTargetIds = available(routeState, world.getResource(resources.ClimbState) ?? {}, world.getResource(resources.SwingState) ?? {}, options);
    world.setResource(resources.RouteState, routeState);
  };
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "ledge-route-kit",
    resources: { RouteState: resources.RouteState, ClimbState: resources.ClimbState, SwingState: resources.SwingState },
    systems: [{ phase: "resolve", name: "ledgeRouteAvailabilitySystem", system }],
    provides: ["ledge-route"],
    initWorld({ world }) { ensureResource(world, resources.RouteState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, resources.RouteState, () => createInitialState(options));
      engine.ledgeRoute = {
        definitions,
        getState: state,
        getNode: (id) => state().nodes?.[id] ?? null,
        canReach(fromId, toId, context = {}) { const routeState = state(); const check = canReachRouteNode(routeState, fromId, toId, { ...context, climbState: context.climbState ?? world.getResource(resources.ClimbState) ?? {}, swingState: context.swingState ?? world.getResource(resources.SwingState) ?? {} }); routeState.lastCheck = check; world.setResource(resources.RouteState, routeState); return check; },
        nextReachable(fromId, context = {}) { return available(state(), { ...(world.getResource(resources.ClimbState) ?? {}), currentLedgeId: fromId }, world.getResource(resources.SwingState) ?? {}, context); },
        registerNode(node) { const next = state(); const normalized = normalizeRouteNode(node, next.nodeOrder.length, options); next.nodes[normalized.id] = normalized; if (!next.nodeOrder.includes(normalized.id)) next.nodeOrder.push(normalized.id); if (!next.startId) next.startId = normalized.id; world.setResource(resources.RouteState, next); return normalized; },
        registerChunk(chunk = {}) { const next = state(); const nodes = connectRouteNodes(normalizeRouteNodes(chunk, { ...options, chunkId: chunk.id ?? chunk.chunkId }), options); for (const node of nodes) { next.nodes[node.id] = node; if (!next.nodeOrder.includes(node.id)) next.nodeOrder.push(node.id); } next.stats.registeredChunks += 1; world.setResource(resources.RouteState, next); return nodes; },
        pruneBelow(y) { const next = state(); const current = world.getResource(resources.ClimbState)?.currentLedgeId; const removed = []; for (const node of Object.values(next.nodes)) if (node.id !== current && number(node.position.y) < number(y)) { delete next.nodes[node.id]; removed.push(node.id); } next.nodeOrder = next.nodeOrder.filter((id) => next.nodes[id]); next.stats.pruned += removed.length; world.setResource(resources.RouteState, next); return removed; },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: LEDGE_ROUTE_KIT_VERSION, purpose: "Route graph, reachability, and pruning for ledge traversal." }
  });
}
