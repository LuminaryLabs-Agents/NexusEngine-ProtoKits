export const GENERIC_MODE_PROJECTED_ROUTE_VERSION = "0.1.0";

const DEFAULT_SEED = "generic-projected-route";
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createGenericModeProjectedRoute requires NexusEngine.${key}.`);
    }
  }
}

function hashString(value = "") {
  let hash = 2166136261;
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed = DEFAULT_SEED) {
  let state = hashString(seed);
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function point(value = {}, fallback = {}) {
  return {
    x: toNumber(value.x, toNumber(fallback.x)),
    y: toNumber(value.y, toNumber(fallback.y)),
    z: toNumber(value.z, toNumber(fallback.z))
  };
}

function cubicBezier(path, t) {
  const start = point(path.start, { x: 0, y: 0, z: 0 });
  const controls = asArray(path.controls);
  const c1 = point(controls[0], start);
  const c2 = point(controls[1], path.end ?? start);
  const end = point(path.end, { x: 0, y: 100, z: 0 });
  const u = 1 - t;
  return {
    x: u ** 3 * start.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * end.x,
    y: u ** 3 * start.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * end.y,
    z: u ** 3 * start.z + 3 * u ** 2 * t * c1.z + 3 * u * t ** 2 * c2.z + t ** 3 * end.z
  };
}

function linearPath(path, t) {
  const start = point(path.start, { x: 0, y: 0, z: 0 });
  const end = point(path.end, { x: 0, y: 100, z: 0 });
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: start.z + (end.z - start.z) * t
  };
}

function sampleBasePath(path = {}, t) {
  if (path.type === "linear") return linearPath(path, t);
  return cubicBezier(path, t);
}

function projectPoint(candidate, projection = {}) {
  const method = projection.method ?? "plane";
  if (method === "none") {
    return { position: point(candidate), normal: point(projection.normal, { x: 0, y: 0, z: 1 }), projected: false, valid: true };
  }
  if (method === "heightfield") {
    const amp = toNumber(projection.amplitude, 0);
    const scale = Math.max(0.0001, toNumber(projection.scale, 120));
    const z = toNumber(projection.baseZ, 0) + Math.sin(candidate.x / scale) * amp + Math.cos(candidate.y / scale) * amp * 0.5;
    return { position: { ...candidate, z }, normal: point(projection.normal, { x: 0, y: 0, z: 1 }), projected: true, valid: true };
  }
  return { position: { ...candidate, z: toNumber(projection.z, candidate.z) }, normal: point(projection.normal, { x: 0, y: 0, z: 1 }), projected: true, valid: true };
}

function distance(a, b) {
  return Math.hypot(toNumber(a.x) - toNumber(b.x), toNumber(a.y) - toNumber(b.y), toNumber(a.z) - toNumber(b.z));
}

function hasMinimumSpacing(candidate, accepted, minSpacing) {
  return accepted.every((anchor) => distance(anchor.position, candidate.position) >= minSpacing);
}

function defaultTagsForIndex(index, count, config) {
  const tags = ["route-node"];
  if (index === 0) tags.push("start");
  if (index === count - 1) tags.push("end");
  const restEvery = Math.max(0, Math.floor(toNumber(config.restEvery, 0)));
  if (restEvery > 0 && index > 0 && index < count - 1 && index % restEvery === 0) tags.push("rest");
  return tags;
}

export function createProjectedRoute(config = {}) {
  const routeId = String(config.routeId ?? config.id ?? "projected-route");
  const path = config.path ?? {};
  const sampling = config.sampling ?? {};
  const validation = config.validation ?? {};
  const projection = config.projection ?? {};
  const seed = sampling.seed ?? config.seed ?? routeId;
  const random = createRng(seed);
  const count = Math.max(2, Math.floor(toNumber(sampling.count, 12)));
  const jitterX = toNumber(sampling.jitterX, 0);
  const jitterY = toNumber(sampling.jitterY, 0);
  const jitterZ = toNumber(sampling.jitterZ, 0);
  const minSpacing = Math.max(0, toNumber(validation.minSpacing, 0));
  const radius = Math.max(0, toNumber(config.anchorRadius ?? validation.anchorRadius, 6));
  const accepted = [];
  const rejected = [];

  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0 : index / (count - 1);
    const base = sampleBasePath(path, t);
    const endpoint = index === 0 || index === count - 1;
    const candidate = {
      x: base.x + (endpoint ? 0 : (random() - 0.5) * jitterX),
      y: base.y + (endpoint ? 0 : (random() - 0.5) * jitterY),
      z: base.z + (endpoint ? 0 : (random() - 0.5) * jitterZ)
    };
    const hit = projectPoint(candidate, projection);
    const candidateAnchor = {
      id: `${config.anchorPrefix ?? "anchor"}-${index}`,
      index,
      groupId: routeId,
      position: hit.position,
      normal: hit.normal,
      radius,
      tags: defaultTagsForIndex(index, count, config),
      metadata: { t, projected: hit.projected, source: "generic-mode-projected-route" }
    };

    if (!hit.valid) {
      rejected.push({ index, reason: "projection-invalid", candidate: candidateAnchor });
      continue;
    }
    if (minSpacing > 0 && !hasMinimumSpacing(candidateAnchor, accepted, minSpacing)) {
      rejected.push({ index, reason: "min-spacing", candidate: candidateAnchor });
      continue;
    }
    accepted.push(candidateAnchor);
  }

  const maxEdgeDistance = Math.max(0, toNumber(validation.maxEdgeDistance, Number.POSITIVE_INFINITY));
  const edges = [];
  for (let index = 1; index < accepted.length; index += 1) {
    const from = accepted[index - 1];
    const to = accepted[index];
    const cost = distance(from.position, to.position);
    if (cost <= maxEdgeDistance) edges.push({ from: from.id, to: to.id, cost });
  }

  return {
    version: GENERIC_MODE_PROJECTED_ROUTE_VERSION,
    id: routeId,
    seed,
    path: clone(path),
    anchors: accepted,
    edges,
    rejected,
    metadata: {
      generatedAt: "deterministic",
      anchorCount: accepted.length,
      edgeCount: edges.length,
      projection: projection.method ?? "plane"
    }
  };
}

function createState(config = {}) {
  return {
    version: GENERIC_MODE_PROJECTED_ROUTE_VERSION,
    id: config.stateId ?? config.routeId ?? config.id ?? "generic-mode-projected-route",
    status: "ready",
    route: createProjectedRoute(config),
    config: clone(config),
    lastReason: "initialized"
  };
}

export function createGenericModeProjectedRoute(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const ProjectedRouteState = defineResource(config.resourceName ?? "genericProjectedRoute.state");
  const RebuildRoute = defineEvent("genericProjectedRoute.rebuild");
  const ProjectedRouteUpdated = defineEvent("genericProjectedRoute.updated");

  function system(world) {
    let state = world.getResource(ProjectedRouteState) ?? createState(config);
    for (const event of world.readEvents(RebuildRoute)) {
      const nextConfig = { ...state.config, ...(event.config ?? {}) };
      state = { ...state, config: clone(nextConfig), route: createProjectedRoute(nextConfig), lastReason: event.reason ?? "rebuild" };
      world.emit(ProjectedRouteUpdated, { routeId: state.route.id, anchorCount: state.route.anchors.length, reason: state.lastReason });
    }
    world.setResource(ProjectedRouteState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-mode-projected-route",
    provides: ["mode:projected-route", "route:projected", "route:graph", "anchor:projected-source"],
    resources: { ProjectedRouteState },
    events: { RebuildRoute, ProjectedRouteUpdated },
    systems: [{ phase: config.phase ?? "simulate", name: "genericModeProjectedRouteSystem", system }],
    initWorld({ world }) {
      world.setResource(ProjectedRouteState, createState(config));
    },
    install({ engine, world }) {
      engine.projectedRoute = {
        resources: { ProjectedRouteState },
        events: { RebuildRoute, ProjectedRouteUpdated },
        rebuild(nextConfig = {}, payload = {}) {
          world.emit(RebuildRoute, { config: nextConfig, ...payload });
          return world.getResource(ProjectedRouteState);
        },
        getState() {
          return world.getResource(ProjectedRouteState);
        },
        getRoute() {
          return world.getResource(ProjectedRouteState)?.route ?? null;
        },
        getAnchors() {
          return world.getResource(ProjectedRouteState)?.route?.anchors ?? [];
        }
      };
    },
    bindings: { ProjectedRouteState },
    metadata: {
      version: GENERIC_MODE_PROJECTED_ROUTE_VERSION,
      status: "experimental",
      purpose: "Composes deterministic path sampling, surface projection, placement validation, generic anchors, and route graph data without game-specific semantics."
    }
  });
}

export default createGenericModeProjectedRoute;
