import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number,
  stableId
} from "../protokit-core/index.js";

export const ISLAND_OBJECT_LIBRARY_DOMAIN_VERSION = "0.1.0";

const vec3 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  y: number(value.y, number(fallback.y, 0)),
  z: number(value.z, number(fallback.z, 0))
});

function objectRecord({ id, type, parentId = null, transform = {}, state = {}, children = [], render = {}, affordances = [], collision = null, tags = [] }) {
  return {
    id,
    type,
    parentId,
    children,
    transform: {
      position: vec3(transform.position),
      rotation: vec3(transform.rotation),
      scale: vec3(transform.scale, { x: 1, y: 1, z: 1 })
    },
    state: clone(state),
    render: clone(render),
    affordances: clone(affordances),
    collision: clone(collision),
    tags: clone(tags)
  };
}

function childId(parentId, suffix) {
  return `${parentId}:${suffix}`;
}

export function createCoconutObject({ id, parentId, index = 0, position = {}, rotation = {}, scale = 1, ripe = false } = {}) {
  return objectRecord({
    id,
    type: "coconut",
    parentId,
    transform: { position, rotation, scale: { x: scale, y: scale, z: scale } },
    state: { attached: true, ripe, fallen: false, collected: false, index },
    render: { meshType: "procedural-coconut", lod: "near-fruit", color: "#8a5b32" },
    affordances: ["inspect", "harvest-when-ripe", "pickup-when-fallen"],
    collision: { shape: "sphere", radius: 0.16 * scale },
    tags: ["fruit", "harvestable"]
  });
}

export function createPalmTreeObject(request = {}, context = {}) {
  const id = request.id ?? stableId("palm-tree", context.seed, request.index, request.position?.x, request.position?.z);
  const height = number(request.heightMeters, number(request.scale, 1) * 7.5);
  const lean = number(request.lean, Math.sin(number(request.rotation, 0)) * 0.18);
  const trunkId = childId(id, "trunk");
  const frondsId = childId(id, "fronds");
  const clusterId = childId(id, "coconut-cluster");
  const coconutCount = Math.max(0, Math.round(number(request.coconutCount, 3)));
  const coconutIds = Array.from({ length: coconutCount }, (_, index) => childId(clusterId, `coconut-${index + 1}`));
  const root = objectRecord({
    id,
    type: "palm-tree",
    parentId: request.parentId,
    children: [trunkId, frondsId, clusterId],
    transform: { position: request.position, rotation: { y: request.rotation }, scale: { x: request.scale, y: request.scale, z: request.scale } },
    state: { heightMeters: height, lean, shoreDistance: number(request.shoreDistance, 0), health: 1 },
    render: { meshType: "procedural-palm", lod: request.lod ?? "near-tree" },
    affordances: ["inspect"],
    collision: { shape: "capsule", radius: 0.35, height },
    tags: ["tree", "palm", "foliage"]
  });
  const trunk = objectRecord({ id: trunkId, type: "palm-trunk", parentId: id, render: { meshType: "palm-trunk", heightMeters: height, lean }, tags: ["tree-part"] });
  const fronds = objectRecord({ id: frondsId, type: "palm-fronds", parentId: id, render: { meshType: "palm-fronds", radiusMeters: height * 0.34 }, tags: ["tree-part", "wind-reactive"] });
  const cluster = objectRecord({ id: clusterId, type: "coconut-cluster", parentId: id, children: coconutIds, state: { count: coconutCount }, render: { meshType: "coconut-cluster" }, tags: ["fruit-cluster"] });
  const coconuts = coconutIds.map((coconutId, index) => createCoconutObject({
    id: coconutId,
    parentId: clusterId,
    index,
    position: { x: Math.cos(index * 2.1) * 0.32, y: height * 0.92 - index * 0.08, z: Math.sin(index * 2.1) * 0.32 },
    scale: number(request.scale, 1) * 0.86,
    ripe: index % 2 === 0
  }));
  return [root, trunk, fronds, cluster, ...coconuts];
}

export function createBroadleafTreeObject(request = {}, context = {}) {
  const id = request.id ?? stableId("broadleaf-tree", context.seed, request.index, request.position?.x, request.position?.z);
  const height = number(request.heightMeters, number(request.scale, 1) * 10.5);
  const canopy = number(request.canopyRadiusMeters, height * 0.38);
  const trunkId = childId(id, "trunk");
  const canopyId = childId(id, "canopy");
  const branchId = childId(id, "branch-cluster");
  const rootFlareId = childId(id, "root-flare");
  return [
    objectRecord({
      id,
      type: "broadleaf-tree",
      parentId: request.parentId,
      children: [trunkId, branchId, canopyId, rootFlareId],
      transform: { position: request.position, rotation: { y: request.rotation }, scale: { x: request.scale, y: request.scale, z: request.scale } },
      state: { age: request.age ?? "mature", heightMeters: height, canopyRadiusMeters: canopy, health: 1 },
      render: { meshType: "procedural-broadleaf", lod: request.lod ?? "near-tree" },
      affordances: ["inspect"],
      collision: { shape: "capsule", radius: 0.42, height },
      tags: ["tree", "broadleaf", "foliage"]
    }),
    objectRecord({ id: trunkId, type: "tree-trunk", parentId: id, render: { meshType: "broadleaf-trunk", heightMeters: height }, tags: ["tree-part"] }),
    objectRecord({ id: branchId, type: "branch-cluster", parentId: id, render: { meshType: "branch-cluster", radiusMeters: canopy * 0.65 }, tags: ["tree-part"] }),
    objectRecord({ id: canopyId, type: "tree-canopy", parentId: id, render: { meshType: "broadleaf-canopy", radiusMeters: canopy }, tags: ["tree-part", "canopy", "wind-reactive"] }),
    objectRecord({ id: rootFlareId, type: "tree-root-flare", parentId: id, render: { meshType: "root-flare" }, collision: { shape: "cylinder", radius: canopy * 0.18, height: 0.35 }, tags: ["tree-part"] })
  ];
}

export function createSimpleIslandObject(request = {}, context = {}) {
  const id = request.id ?? stableId(request.objectType ?? "island-object", context.seed, request.index, request.position?.x, request.position?.z);
  const type = request.objectType ?? "island-object";
  const meshTypeByType = {
    bush: "procedural-bush",
    fern: "procedural-fern",
    "grass-clump": "procedural-grass-clump",
    "flower-patch": "procedural-flower-patch",
    "fallen-log": "procedural-fallen-log",
    rock: "procedural-rock",
    boulder: "procedural-boulder",
    driftwood: "procedural-driftwood",
    reef: "procedural-reef",
    coral: "procedural-coral"
  };
  const tagsByType = {
    bush: ["understory", "foliage"],
    fern: ["understory", "foliage"],
    "grass-clump": ["groundcover", "foliage"],
    "flower-patch": ["groundcover", "foliage"],
    "fallen-log": ["deadwood"],
    rock: ["rock"],
    boulder: ["rock"],
    driftwood: ["shore", "deadwood"],
    reef: ["ocean-edge"],
    coral: ["ocean-edge"]
  };
  return [objectRecord({
    id,
    type,
    parentId: request.parentId,
    transform: { position: request.position, rotation: { y: request.rotation }, scale: { x: request.scale, y: request.scale, z: request.scale } },
    state: { health: 1, reason: request.reason ?? "procedural" },
    render: { meshType: meshTypeByType[type] ?? `procedural-${type}`, lod: request.lod ?? "instanced-or-simple" },
    affordances: type === "driftwood" ? ["inspect", "pickup"] : ["inspect"],
    collision: ["rock", "boulder"].includes(type) ? { shape: "sphere", radius: 0.45 * number(request.scale, 1) } : null,
    tags: tagsByType[type] ?? ["island-object"]
  })];
}

export function resolveIslandObjectSpawnRequest(request = {}, context = {}) {
  switch (request.objectType) {
    case "palm-tree": return createPalmTreeObject(request, context);
    case "broadleaf-tree":
    case "young-tree": return createBroadleafTreeObject({ ...request, age: request.objectType === "young-tree" ? "young" : request.age, heightMeters: request.objectType === "young-tree" ? number(request.heightMeters, 5.2) : request.heightMeters }, context);
    default: return createSimpleIslandObject(request, context);
  }
}

export function resolveIslandObjectGraph(spawnRequests = [], context = {}) {
  const objects = [];
  for (let index = 0; index < spawnRequests.length; index += 1) {
    objects.push(...resolveIslandObjectSpawnRequest({ ...spawnRequests[index], index }, context));
  }
  const byId = Object.fromEntries(objects.map((object) => [object.id, object]));
  return { objects, byId };
}

export function createIslandObjectLibraryState(options = {}) {
  return {
    id: options.id ?? "island-object-library",
    version: ISLAND_OBJECT_LIBRARY_DOMAIN_VERSION,
    supportedTypes: ["palm-tree", "broadleaf-tree", "young-tree", "coconut", "bush", "fern", "grass-clump", "flower-patch", "fallen-log", "rock", "boulder", "driftwood", "reef", "coral"],
    lastGraph: null
  };
}

export function createIslandObjectLibraryDomainKit(nexusRealtime = {}, options = {}) {
  const defs = createDefinitionFactory(nexusRealtime);
  const State = defs.resource(options.resourceName ?? "islandObjectLibrary.state");
  const initial = () => createIslandObjectLibraryState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.kitId ?? "island-object-library-domain",
    resources: { State },
    provides: ["island:object-library", "island:nested-object-graph", "render:island-object-descriptors"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.islandObjectLibrary = {
        getState,
        getSnapshot: () => clone(getState()),
        resolveSpawnRequest: (request = {}, context = {}) => resolveIslandObjectSpawnRequest(request, context),
        resolveGraph(spawnRequests = [], context = {}) {
          const graph = resolveIslandObjectGraph(spawnRequests, context);
          world.setResource(State, { ...getState(), lastGraph: clone(graph) });
          return graph;
        },
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.islandObjectLibrary = engine.islandObjectLibrary;
    },
    metadata: { version: ISLAND_OBJECT_LIBRARY_DOMAIN_VERSION, domain: "island-object-library", purpose: "Resolve procedural island spawn requests into nested object graphs such as palm trees with coconut children." }
  });
}

export default createIslandObjectLibraryDomainKit;
