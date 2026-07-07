import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number
} from "../protokit-core/index.js";

export const FENCED_CLEARING_DOMAIN_VERSION = "0.1.0";

const TWO_PI = Math.PI * 2;
const v3 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  y: number(value.y, number(fallback.y, 0)),
  z: number(value.z, number(fallback.z, 0))
});

function objectRecord({ id, type, parentId = null, children = [], transform = {}, state = {}, render = {}, collision = null, tags = [] }) {
  return {
    id,
    type,
    parentId,
    children: clone(children),
    transform: {
      position: v3(transform.position),
      rotation: v3(transform.rotation),
      scale: v3(transform.scale, { x: 1, y: 1, z: 1 })
    },
    state: clone(state),
    render: clone(render),
    collision: clone(collision),
    tags: clone(tags)
  };
}

export function createFencedClearingGraph(options = {}) {
  const id = options.id ?? "central-clearing:campfire";
  const parentId = options.parentId ?? "island:cozy-001";
  const center = v3(options.position, { x: 0, y: 0, z: 0 });
  const fenceRadius = number(options.fenceRadiusMeters, 12);
  const clearingRadius = number(options.clearingRadiusMeters, 9.5);
  const fenceHeight = number(options.fenceHeightMeters, 1.25);
  const gateAngle = number(options.gateAngle, Math.PI);
  const gateWidthMeters = number(options.gateWidthMeters, 2.8);
  const postCount = Math.max(8, Math.round(number(options.postCount, 24)));
  const postIds = [];
  const railIds = [];
  const objects = [];
  const gateArc = gateWidthMeters / fenceRadius;
  const angularDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

  for (let index = 0; index < postCount; index += 1) {
    const angle = index / postCount * TWO_PI;
    if (angularDistance(angle, gateAngle) < gateArc * 0.58) continue;
    const postId = `${id}:fence-post-${index}`;
    postIds.push(postId);
    objects.push(objectRecord({
      id: postId,
      type: "fence-post",
      parentId: `${id}:fence-ring`,
      transform: {
        position: { x: center.x + Math.cos(angle) * fenceRadius, y: center.y, z: center.z + Math.sin(angle) * fenceRadius },
        rotation: { y: angle }
      },
      state: { heightMeters: fenceHeight, angle },
      render: { meshType: "procedural-fence-post" },
      collision: { shape: "cylinder", radius: 0.18, height: fenceHeight },
      tags: ["fence", "collision"]
    }));
  }

  for (let index = 0; index < postCount; index += 1) {
    const a0 = index / postCount * TWO_PI;
    const a1 = (index + 1) / postCount * TWO_PI;
    const mid = (a0 + a1) * 0.5;
    if (angularDistance(mid, gateAngle) < gateArc * 0.7) continue;
    const railId = `${id}:fence-rail-${index}`;
    railIds.push(railId);
    const p0 = { x: center.x + Math.cos(a0) * fenceRadius, z: center.z + Math.sin(a0) * fenceRadius };
    const p1 = { x: center.x + Math.cos(a1) * fenceRadius, z: center.z + Math.sin(a1) * fenceRadius };
    objects.push(objectRecord({
      id: railId,
      type: "fence-rail",
      parentId: `${id}:fence-ring`,
      transform: {
        position: { x: (p0.x + p1.x) * 0.5, y: center.y + fenceHeight * 0.62, z: (p0.z + p1.z) * 0.5 },
        rotation: { y: mid + Math.PI / 2 },
        scale: { x: Math.hypot(p1.x - p0.x, p1.z - p0.z), y: 1, z: 1 }
      },
      state: { from: p0, to: p1, heightMeters: fenceHeight },
      render: { meshType: "procedural-fence-rail" },
      collision: { shape: "segment", from: p0, to: p1, radius: 0.22, blocksMovement: true },
      tags: ["fence", "collision"]
    }));
  }

  const ringId = `${id}:fence-ring`;
  const boundaryId = `${id}:collision-boundary`;
  const walkableId = `${id}:walkable-area`;
  const spawnId = `${id}:first-person-spawn-anchor`;
  const avatarId = `${id}:player-avatar-anchor`;
  const gateId = `${id}:gate`;
  const avatarZ = Math.min(6, fenceRadius * 0.5);
  const eyeHeightMeters = number(options.eyeHeightMeters, 1.7);
  const playerYaw = number(options.playerYaw, 0);

  const root = objectRecord({
    id,
    type: "fenced-clearing",
    parentId,
    children: [ringId, boundaryId, walkableId, spawnId, avatarId, gateId],
    transform: { position: center },
    state: { clearingRadiusMeters: clearingRadius, fenceRadiusMeters: fenceRadius, campfireExclusionRadiusMeters: number(options.campfireRadiusMeters, 2.25) },
    render: { meshType: "fenced-clearing" },
    tags: ["clearing", "first-person-area"]
  });

  const support = [
    objectRecord({ id: ringId, type: "fence-ring", parentId: id, children: [...postIds, ...railIds, gateId], transform: { position: center }, state: { fenceRadiusMeters: fenceRadius, postCount, gateAngle, gateWidthMeters }, render: { meshType: "fence-ring" }, tags: ["fence"] }),
    objectRecord({ id: boundaryId, type: "clearing-collision-boundary", parentId: id, transform: { position: center }, state: { center: { x: center.x, z: center.z }, radiusMeters: fenceRadius - 0.8, blocksExit: true, gate: { angle: gateAngle, widthMeters: gateWidthMeters } }, collision: { shape: "circle-boundary", radius: fenceRadius - 0.8, blocksExit: true }, tags: ["collision", "first-person-bounds"] }),
    objectRecord({ id: walkableId, type: "clearing-walkable-area", parentId: id, transform: { position: center }, state: { radiusMeters: fenceRadius - 1.4, innerCampfireBlockRadius: number(options.campfireRadiusMeters, 2.25) }, render: { meshType: "walkable-area-descriptor" }, tags: ["walkable"] }),
    objectRecord({ id: spawnId, type: "first-person-spawn-anchor", parentId: id, transform: { position: { x: center.x, y: center.y + eyeHeightMeters, z: center.z + avatarZ }, rotation: { y: playerYaw } }, state: { eyeHeightMeters, moveSpeed: 2.6, lookSensitivity: 0.0025 }, render: { meshType: "camera-anchor" }, tags: ["camera-anchor"] }),
    objectRecord({
      id: avatarId,
      type: "player-avatar-anchor",
      parentId: id,
      children: [],
      transform: { position: { x: center.x, y: center.y, z: center.z + avatarZ }, rotation: { y: playerYaw } },
      state: {
        eyeHeightMeters,
        bodyRadiusMeters: 0.32,
        movementBoundsId: boundaryId,
        cameraAttachPoint: { x: center.x, y: center.y + eyeHeightMeters, z: center.z + avatarZ },
        dataOnly: true,
        visible: false
      },
      render: { visible: false, dataOnly: true, meshType: "invisible-player-anchor" },
      tags: ["avatar", "camera-anchor", "data-only", "invisible"]
    }),
    objectRecord({ id: gateId, type: "fence-gate", parentId: ringId, transform: { position: { x: center.x + Math.cos(gateAngle) * fenceRadius, y: center.y, z: center.z + Math.sin(gateAngle) * fenceRadius }, rotation: { y: gateAngle + Math.PI / 2 } }, state: { widthMeters: gateWidthMeters, open: true }, render: { meshType: "procedural-fence-gate" }, tags: ["fence", "gate"] })
  ];

  const all = [root, ...support, ...objects];
  return {
    id,
    version: FENCED_CLEARING_DOMAIN_VERSION,
    rootId: id,
    objects: all,
    byId: Object.fromEntries(all.map((object) => [object.id, object])),
    clearanceZones: [
      { id: "campfire-no-grass", center: { x: center.x, z: center.z }, radius: number(options.campfireGrassExclusionRadiusMeters, 4.5) },
      { id: "fence-walk-space", center: { x: center.x, z: center.z }, radius: number(options.walkGrassExclusionRadiusMeters, 3.5) }
    ],
    objectExclusionZones: [
      { id: "fenced-clearing-no-trees", center: { x: center.x, z: center.z }, radius: fenceRadius - 0.8 }
    ]
  };
}

export function createFencedClearingState(options = {}) {
  return { id: options.id ?? "fenced-clearing-domain", version: FENCED_CLEARING_DOMAIN_VERSION, lastGraph: null };
}

export function createFencedClearingDomainKit(nexusRealtime = {}, options = {}) {
  const defs = createDefinitionFactory(nexusRealtime);
  const State = defs.resource(options.resourceName ?? "fencedClearing.state");
  const initial = () => createFencedClearingState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.kitId ?? "fenced-clearing-domain",
    resources: { State },
    provides: ["clearing:fenced-object-graph", "clearing:first-person-bounds", "clearing:camera-anchor", "clearing:player-avatar-anchor", "clearing:grass-exclusion-zones"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.fencedClearing = {
        getState,
        getSnapshot: () => clone(getState()),
        createGraph(options = {}) {
          const graph = createFencedClearingGraph(options);
          world.setResource(State, { ...getState(), lastGraph: clone(graph) });
          return graph;
        },
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.fencedClearing = engine.fencedClearing;
    },
    metadata: { version: FENCED_CLEARING_DOMAIN_VERSION, domain: "fenced-clearing", purpose: "Create a fenced campfire clearing object graph with data-only player anchors and first-person bounds." }
  });
}

export default createFencedClearingDomainKit;
