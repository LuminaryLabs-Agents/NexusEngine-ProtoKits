import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number,
  stableId
} from "../protokit-core/index.js";

export const GRASS_OBJECT_DOMAIN_VERSION = "0.1.0";

const TWO_PI = Math.PI * 2;

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
    return (state >>> 0) / 0xffffffff;
  };
}

function distanceToSegment(point, a, b) {
  const px = number(point.x) - number(a.x);
  const pz = number(point.z) - number(a.z);
  const vx = number(b.x) - number(a.x);
  const vz = number(b.z) - number(a.z);
  const len = vx * vx + vz * vz || 1;
  const t = Math.max(0, Math.min(1, (px * vx + pz * vz) / len));
  return Math.hypot(px - vx * t, pz - vz * t);
}

function distanceToPath(point, pathNetwork) {
  if (!pathNetwork?.segments?.length) return Infinity;
  return Math.min(...pathNetwork.segments.map((segment) => distanceToSegment(point, segment.from, segment.to)));
}

function distanceToObjects(point, objects = [], types = ["palm-tree", "broadleaf-tree", "young-tree", "rock", "boulder"]) {
  let best = Infinity;
  for (const object of objects) {
    if (!types.includes(object.type)) continue;
    const p = object.transform?.position;
    if (!p) continue;
    best = Math.min(best, Math.hypot(number(point.x) - number(p.x), number(point.z) - number(p.z)));
  }
  return best;
}

function insideExclusionZone(point, zones = []) {
  return zones.some((zone) => {
    const center = zone.center ?? zone.position ?? { x: 0, z: 0 };
    const radius = number(zone.radius ?? zone.radiusMeters, 0);
    return Math.hypot(number(point.x) - number(center.x), number(point.z) - number(center.z)) < radius;
  });
}

export function createGrassPatchObject(request = {}) {
  const id = request.id ?? stableId("grass-patch", request.seed, request.index, request.position?.x, request.position?.z);
  const template = request.template ?? (request.index % 3 === 0 ? "dense-a" : request.index % 3 === 1 ? "dense-b" : "dense-c");
  const triangleBudget = Math.round(number(request.triangleBudget, template === "dense-a" ? 900 : template === "dense-b" ? 720 : 560));
  const bladeCount = Math.max(80, Math.round(triangleBudget / 3));
  const scale = number(request.scale, 1);
  return {
    id,
    type: "grass-patch",
    parentId: request.parentId ?? "groundcover:cozy-001",
    transform: {
      position: {
        x: number(request.position?.x, 0),
        y: number(request.position?.y, 0),
        z: number(request.position?.z, 0)
      },
      rotation: { x: 0, y: number(request.rotation, 0), z: 0 },
      scale: { x: scale, y: 1, z: scale }
    },
    state: {
      bladeCount,
      triangleBudget,
      patchRadius: number(request.patchRadius, 1.8),
      bladeHeightMin: number(request.bladeHeightMin, 0.32),
      bladeHeightMax: number(request.bladeHeightMax, 0.92),
      bend: number(request.bend, 0.18),
      windZone: request.windZone ?? "central-grove-soft-wind",
      phase: number(request.phase, hashUnit(id) * TWO_PI)
    },
    render: {
      meshType: "procedural-grass-patch",
      batchKey: request.batchKey ?? `dense-cozy-grass-${template}`,
      materialKey: request.materialKey ?? "dense-cozy-grass-material",
      geometryTemplateKey: request.geometryTemplateKey ?? template,
      lod: request.lod ?? "near-groundcover"
    },
    affordances: [],
    collision: null,
    tags: ["grass", "groundcover", "batched"]
  };
}

export function createGrassPatchPlacementContract(options = {}) {
  const seed = String(options.seed ?? "dense-cozy-grass");
  const random = rng(seed);
  const count = Math.round(Math.max(0, Math.min(240, number(options.count, 140))));
  const radius = number(options.radiusMeters, 100);
  const sampleHeight = options.sampleHeight ?? (() => 0);
  const sampleMasks = options.sampleMasks ?? (() => ({ grass: 1, beach: 0, water: 0, rock: 0, cliff: 0, wetSand: 0 }));
  const pathNetwork = options.pathNetwork;
  const avoidObjects = options.avoidObjects ?? [];
  const exclusionZones = options.exclusionZones ?? [];
  const pathClearance = number(options.pathClearance, 3.6);
  const objectClearance = number(options.objectClearance, 1.1);
  const patches = [];
  let tries = 0;
  while (patches.length < count && tries < count * 70 + 400) {
    tries += 1;
    const angle = random() * TWO_PI;
    const r = (12 + (radius * 0.78 - 12) * Math.sqrt(random()));
    const point = { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
    const masks = sampleMasks(point) ?? {};
    if (masks.water || masks.beach || masks.wetSand || masks.rock || masks.cliff) continue;
    if (insideExclusionZone(point, exclusionZones)) continue;
    if (distanceToPath(point, pathNetwork) < pathClearance) continue;
    if (distanceToObjects(point, avoidObjects) < objectClearance) continue;
    const y = sampleHeight(point);
    const templateIndex = patches.length % 3;
    const template = templateIndex === 0 ? "dense-a" : templateIndex === 1 ? "dense-b" : "dense-c";
    patches.push(createGrassPatchObject({
      seed,
      index: patches.length,
      position: { x: point.x, y, z: point.z },
      rotation: angle + random() * 0.8,
      scale: 0.75 + random() * 0.85,
      patchRadius: 1.2 + random() * 1.6,
      triangleBudget: template === "dense-a" ? 900 : template === "dense-b" ? 720 : 560,
      template,
      phase: random() * TWO_PI,
      lod: r < 45 ? "near-groundcover" : r < 75 ? "mid-groundcover" : "far-groundcover"
    }));
  }
  return {
    id: `${seed}:grass-patch-placement`,
    type: "grass-patch-placement-contract",
    version: GRASS_OBJECT_DOMAIN_VERSION,
    seed,
    requestedCount: count,
    patchCount: patches.length,
    patches,
    exclusionZones: clone(exclusionZones),
    batchKeys: [...new Set(patches.map((patch) => patch.render.batchKey))]
  };
}

export function createGrassPatchBatchDescriptors(patches = []) {
  const groups = new Map();
  for (const patch of patches) {
    const key = patch.render.batchKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(patch.id);
  }
  return [...groups.entries()].map(([batchKey, patchIds]) => ({
    id: `${batchKey}:batch`,
    type: "grass-static-batch-descriptor",
    batchKey,
    patchIds,
    instanceCount: patchIds.length,
    geometryTemplateKey: batchKey.split("-").slice(-2).join("-"),
    materialKey: "dense-cozy-grass-material",
    rendererBoundary: { useInstancedMesh: true, mergeStaticIfNoWind: false }
  }));
}

export function createGrassObjectState(options = {}) {
  return { id: options.id ?? "grass-object-domain", version: GRASS_OBJECT_DOMAIN_VERSION, lastPlacement: null };
}

export function createGrassObjectDomainKit(nexusRealtime = {}, options = {}) {
  const defs = createDefinitionFactory(nexusRealtime);
  const State = defs.resource(options.resourceName ?? "grassObject.state");
  const initial = () => createGrassObjectState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.kitId ?? "grass-object-domain",
    resources: { State },
    provides: ["grass:patch-object", "grass:patch-placement", "render:grass-static-batch-descriptor"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.grassObject = {
        getState,
        getSnapshot: () => clone(getState()),
        createPatch: createGrassPatchObject,
        createPlacement(options = {}) {
          const placement = createGrassPatchPlacementContract(options);
          world.setResource(State, { ...getState(), lastPlacement: clone(placement) });
          return placement;
        },
        createBatchDescriptors: createGrassPatchBatchDescriptors,
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.grassObject = engine.grassObject;
    },
    metadata: { version: GRASS_OBJECT_DOMAIN_VERSION, domain: "grass-object", purpose: "Create procedural grass patch objects and batching descriptors for renderer adapters." }
  });
}

export default createGrassObjectDomainKit;
