import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number,
  stableId
} from "../protokit-core/index.js";
import { resolveIslandObjectGraph } from "../island-object-library-domain/index.js";

export const ISLAND_FOLIAGE_DOMAIN_VERSION = "0.1.0";
export const DENSE_COZY_200M_ISLAND_PRESET = Object.freeze({
  id: "dense-cozy-200m-island",
  diameterMeters: 200,
  radiusMeters: 100,
  seaLevel: 0,
  landform: { maxHeight: 18, beachWidth: 10, shelfWidth: 36, underwaterFormationDepth: -96 },
  pathing: { mainPath: "beach-to-central-grove", pathWidth: 2.4, pathClearance: 1.2, loopInGrove: true },
  foliage: { profile: "foliage-heavy", centralGroveRadius: 38, canopyCoverage: 0.78, understoryCoverage: 0.64, groundCoverCoverage: 0.82, pathClearsTrees: true },
  objects: { palms: 18, broadleafTrees: 45, youngTrees: 24, bushes: 80, ferns: 120, grassClumps: 240, fallenLogs: 9, rocks: 28, driftwood: 8, reefs: 10 }
});

const TWO_PI = Math.PI * 2;
const v3 = (value = {}, fallback = {}) => ({ x: number(value.x, number(fallback.x, 0)), y: number(value.y, number(fallback.y, 0)), z: number(value.z, number(fallback.z, 0)) });

function hashUnit(seed = "seed", ...parts) {
  let hash = 2166136261;
  for (const char of [seed, ...parts].join(":").toString()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function rng(seed) {
  let state = Math.floor(hashUnit(seed) * 0xffffffff) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 0xffffffff);
  };
}

function pointFromPolar(radius, angle) {
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}

function dist2(a, b) {
  return Math.hypot(number(a.x) - number(b.x), number(a.z) - number(b.z));
}

function distanceToSegment(point, a, b) {
  const px = point.x - a.x;
  const pz = point.z - a.z;
  const vx = b.x - a.x;
  const vz = b.z - a.z;
  const len = vx * vx + vz * vz || 1;
  const t = Math.max(0, Math.min(1, (px * vx + pz * vz) / len));
  return Math.hypot(px - vx * t, pz - vz * t);
}

export function createIslandPathNetwork(options = {}) {
  const preset = { ...DENSE_COZY_200M_ISLAND_PRESET, ...(options.preset ?? {}) };
  const radius = number(options.radiusMeters, preset.radiusMeters);
  const pathWidth = number(options.pathWidth, preset.pathing.pathWidth);
  const clearance = number(options.pathClearance, preset.pathing.pathClearance);
  const entry = { x: 0, z: radius * 0.92 };
  const bend = { x: -radius * 0.22, z: radius * 0.32 };
  const center = { x: 0, z: 0 };
  const loop = Array.from({ length: 18 }, (_, i) => pointFromPolar(radius * 0.25, i / 18 * TWO_PI));
  const segments = [
    { id: "beach-to-bend", from: entry, to: bend, width: pathWidth, clearance },
    { id: "bend-to-grove", from: bend, to: center, width: pathWidth, clearance },
    ...loop.map((point, index) => ({ id: `grove-loop-${index}`, from: point, to: loop[(index + 1) % loop.length], width: pathWidth, clearance }))
  ];
  return { id: "path-network:cozy-island", type: "island-path-network", pathWidth, clearance, entry, center, loop, segments };
}

export function distanceToIslandPath(point = {}, pathNetwork = createIslandPathNetwork()) {
  return Math.min(...pathNetwork.segments.map((segment) => distanceToSegment(point, segment.from, segment.to)));
}

function makeRequest(objectType, parentId, index, position, extra = {}) {
  return {
    id: stableId(objectType, parentId, index, Math.round(position.x * 100), Math.round(position.z * 100)),
    objectType,
    parentId,
    index,
    position,
    rotation: number(extra.rotation, index * 2.399963229728653),
    scale: number(extra.scale, 1),
    heightMeters: extra.heightMeters,
    canopyRadiusMeters: extra.canopyRadiusMeters,
    coconutCount: extra.coconutCount,
    shoreDistance: extra.shoreDistance,
    lod: extra.lod,
    reason: extra.reason
  };
}

export function createDenseIslandSpawnRequests(options = {}) {
  const seed = String(options.seed ?? "dense-cozy-200m-island");
  const preset = { ...DENSE_COZY_200M_ISLAND_PRESET, ...(options.preset ?? {}) };
  const rand = rng(`${seed}:foliage`);
  const radius = number(options.radiusMeters, preset.radiusMeters);
  const pathNetwork = options.pathNetwork ?? createIslandPathNetwork({ radiusMeters: radius, preset });
  const sampleHeight = options.sampleHeight ?? (() => 0);
  const requests = [];
  const centralParent = "grove:central-001";
  const coastalParent = "coastal-band:cozy-001";
  const understoryParent = "understory:central-001";
  const groundParent = "groundcover:cozy-001";

  function accepted(point, minPathDistance = 0, maxRadius = radius * 0.98) {
    if (Math.hypot(point.x, point.z) > maxRadius) return false;
    return distanceToIslandPath(point, pathNetwork) >= minPathDistance;
  }

  function addRadialSet(type, count, parentId, minR, maxR, pathClearance, extraFactory = () => ({})) {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 45 + 120) {
      attempts += 1;
      const angle = rand() * TWO_PI;
      const r = minR + (maxR - minR) * Math.sqrt(rand());
      const point = pointFromPolar(r, angle);
      if (!accepted(point, pathClearance, radius * 1.12)) continue;
      const y = sampleHeight(point);
      requests.push(makeRequest(type, parentId, placed, { x: point.x, y, z: point.z }, extraFactory(placed, point, y, angle, r)));
      placed += 1;
    }
  }

  addRadialSet("broadleaf-tree", preset.objects.broadleafTrees, centralParent, 8, preset.foliage.centralGroveRadius, 3.8, (i, p, y, angle, r) => ({ scale: 0.72 + rand() * 0.55, heightMeters: 7.5 + rand() * 7.5, canopyRadiusMeters: 3.2 + rand() * 2.8, rotation: angle, reason: "central-grove-canopy", lod: r < 24 ? "near-tree" : "mid-tree" }));
  addRadialSet("young-tree", preset.objects.youngTrees, centralParent, 20, radius * 0.62, 3.1, (i, p, y, angle) => ({ scale: 0.48 + rand() * 0.35, heightMeters: 4 + rand() * 3.5, canopyRadiusMeters: 1.6 + rand() * 1.2, rotation: angle, reason: "grove-edge-young-tree", lod: "mid-tree" }));
  addRadialSet("palm-tree", preset.objects.palms, coastalParent, radius * 0.58, radius * 0.9, 2.8, (i, p, y, angle, r) => ({ scale: 0.72 + rand() * 0.48, heightMeters: 5.5 + rand() * 4.5, coconutCount: 2 + Math.round(rand() * 3), shoreDistance: radius - r, rotation: angle + Math.PI, reason: "beach-palm-band", lod: "near-tree" }));
  addRadialSet("bush", preset.objects.bushes, understoryParent, 10, radius * 0.7, 1.8, () => ({ scale: 0.35 + rand() * 0.55, reason: "understory" }));
  addRadialSet("fern", preset.objects.ferns, understoryParent, 7, radius * 0.66, 1.3, () => ({ scale: 0.28 + rand() * 0.42, reason: "understory-fern" }));
  addRadialSet("grass-clump", preset.objects.grassClumps, groundParent, 6, radius * 0.88, 0.55, () => ({ scale: 0.18 + rand() * 0.22, reason: "groundcover" }));
  addRadialSet("fallen-log", preset.objects.fallenLogs, centralParent, 16, radius * 0.54, 2.4, () => ({ scale: 0.8 + rand() * 0.7, reason: "fallen-log" }));
  addRadialSet("rock", preset.objects.rocks, coastalParent, radius * 0.2, radius * 0.94, 1.0, () => ({ scale: 0.3 + rand() * 0.9, reason: "surface-rock" }));
  addRadialSet("driftwood", preset.objects.driftwood, coastalParent, radius * 0.78, radius * 0.98, 0.3, () => ({ scale: 0.5 + rand() * 0.75, reason: "shore-driftwood" }));
  addRadialSet("reef", preset.objects.reefs, "water-interface:cozy-001", radius * 1.03, radius * 1.32, 0, () => ({ scale: 0.65 + rand() * 1.2, reason: "reef-ring" }));

  return requests;
}

function makeObject(id, type, parentId = null, children = [], state = {}, render = {}) {
  return { id, type, parentId, children, state: clone(state), render: clone(render) };
}

function objectRenderDescriptors(objects = []) {
  return objects
    .filter((object) => object.render?.meshType)
    .map((object) => ({ id: object.id, type: object.type, parentId: object.parentId, transform: object.transform, render: object.render, state: object.state, affordances: object.affordances, collision: object.collision, children: object.children }));
}

export function createDenseCozyIslandObjectGraph(options = {}) {
  const seed = String(options.seed ?? "cozy-island-001");
  const preset = { ...DENSE_COZY_200M_ISLAND_PRESET, ...(options.preset ?? {}) };
  const radius = number(options.radiusMeters, preset.radiusMeters);
  const pathNetwork = options.pathNetwork ?? createIslandPathNetwork({ radiusMeters: radius, preset });
  const spawnRequests = options.spawnRequests ?? createDenseIslandSpawnRequests({ ...options, seed, preset, radiusMeters: radius, pathNetwork });
  const resolved = resolveIslandObjectGraph(spawnRequests, { seed });
  const rootChildren = ["landform:cozy-001", "shoreline:cozy-001", "path-network:cozy-island", "grove:central-001", "coastal-band:cozy-001", "understory:central-001", "groundcover:cozy-001", "water-interface:cozy-001"];
  const root = makeObject("island:cozy-001", "ocean-island-landform", null, rootChildren, { seed, diameterMeters: preset.diameterMeters, radiusMeters: radius, biome: "dense-tropical-grove" }, { meshType: "island-root" });
  const groups = [
    makeObject("landform:cozy-001", "island-landform", root.id, [], { radiusMeters: radius, seaLevel: preset.seaLevel }, { meshType: "terrain-heightfield" }),
    makeObject("shoreline:cozy-001", "island-shoreline", root.id, [], { beachWidth: preset.landform.beachWidth }, { meshType: "shoreline-foam-band" }),
    makeObject(pathNetwork.id, "island-path-network", root.id, pathNetwork.segments.map((segment) => `path-segment:${segment.id}`), { pathWidth: pathNetwork.pathWidth, clearance: pathNetwork.clearance }, { meshType: "path-clearance-mask" }),
    makeObject("grove:central-001", "central-grove", root.id, resolved.objects.filter((object) => object.parentId === "grove:central-001").map((object) => object.id), { radiusMeters: preset.foliage.centralGroveRadius }, { meshType: "grove-density-field" }),
    makeObject("coastal-band:cozy-001", "coastal-band", root.id, resolved.objects.filter((object) => object.parentId === "coastal-band:cozy-001").map((object) => object.id), {}, { meshType: "coastal-object-band" }),
    makeObject("understory:central-001", "understory-layer", root.id, resolved.objects.filter((object) => object.parentId === "understory:central-001").map((object) => object.id), {}, { meshType: "understory-density-field" }),
    makeObject("groundcover:cozy-001", "groundcover-layer", root.id, resolved.objects.filter((object) => object.parentId === "groundcover:cozy-001").map((object) => object.id), {}, { meshType: "groundcover-density-field" }),
    makeObject("water-interface:cozy-001", "island-water-interface", root.id, resolved.objects.filter((object) => object.parentId === "water-interface:cozy-001").map((object) => object.id), { underwaterFormationDepth: preset.landform.underwaterFormationDepth }, { meshType: "water-interface" })
  ];
  const pathSegments = pathNetwork.segments.map((segment) => makeObject(`path-segment:${segment.id}`, "path-segment", pathNetwork.id, [], { from: segment.from, to: segment.to, width: segment.width, clearance: segment.clearance }, { meshType: "walkable-path-segment" }));
  const objects = [root, ...groups, ...pathSegments, ...resolved.objects];
  return { id: root.id, version: ISLAND_FOLIAGE_DOMAIN_VERSION, preset: preset.id, pathNetwork, spawnRequests, objects, rootId: root.id, byId: Object.fromEntries(objects.map((object) => [object.id, object])) };
}

export function createDenseCozyIslandRenderContract(options = {}) {
  const graph = options.graph ?? createDenseCozyIslandObjectGraph(options);
  return {
    id: `${graph.id}:render-contract`,
    type: "dense-cozy-island-render-contract",
    version: ISLAND_FOLIAGE_DOMAIN_VERSION,
    rootId: graph.rootId,
    pathNetwork: graph.pathNetwork,
    terrain: options.landformContract?.heightfield ? { heightfield: options.landformContract.heightfield, shoreline: options.landformContract.shoreline } : null,
    waterInterface: { seaFloorY: number(options.seaFloorY, -96), shoreline: options.landformContract?.shoreline ?? [], underwaterFormation: true },
    objects: objectRenderDescriptors(graph.objects),
    instancing: {
      grassClumps: graph.objects.filter((object) => object.type === "grass-clump").map((object) => object.id),
      ferns: graph.objects.filter((object) => object.type === "fern").map((object) => object.id),
      bushes: graph.objects.filter((object) => object.type === "bush").map((object) => object.id)
    },
    lod: { nearMeters: 25, midMeters: 70, farMeters: 120 }
  };
}

export function createIslandFoliageState(options = {}) {
  return { id: options.id ?? "island-foliage-domain", version: ISLAND_FOLIAGE_DOMAIN_VERSION, preset: clone(DENSE_COZY_200M_ISLAND_PRESET), lastGraph: null };
}

export function createIslandFoliageDomainKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const State = defs.resource(options.resourceName ?? "islandFoliage.state");
  const initial = () => createIslandFoliageState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.kitId ?? "island-foliage-domain",
    resources: { State },
    provides: ["island:foliage-density", "island:central-grove", "island:path-clearance", "island:foliage-object-placement"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.islandFoliage = {
        getState,
        getSnapshot: () => clone(getState()),
        createPathNetwork: createIslandPathNetwork,
        createSpawnRequests: createDenseIslandSpawnRequests,
        createObjectGraph(options = {}) {
          const graph = createDenseCozyIslandObjectGraph(options);
          world.setResource(State, { ...getState(), lastGraph: clone(graph) });
          return graph;
        },
        createRenderContract: createDenseCozyIslandRenderContract,
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.islandFoliage = engine.islandFoliage;
    },
    metadata: { version: ISLAND_FOLIAGE_DOMAIN_VERSION, domain: "island-foliage", purpose: "Generate a foliage-heavy 200m island object graph with central grove, path clearance, trees, palms, coconuts, understory, and render descriptors." }
  });
}

export default createIslandFoliageDomainKit;
