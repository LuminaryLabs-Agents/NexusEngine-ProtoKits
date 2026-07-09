import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number,
  stableId
} from "../protokit-core/index.js";

export const CAMPFIRE_OBJECT_DOMAIN_VERSION = "0.1.0";

const v3 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  y: number(value.y, number(fallback.y, 0)),
  z: number(value.z, number(fallback.z, 0))
});

function objectRecord({ id, type, parentId = null, children = [], transform = {}, state = {}, render = {}, affordances = [], collision = null, tags = [] }) {
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
    affordances: clone(affordances),
    collision: clone(collision),
    tags: clone(tags)
  };
}

const childId = (id, suffix) => `${id}:${suffix}`;

export function createCampfireObjectGraph(options = {}) {
  const id = options.id ?? "campfire:central-001";
  const parentId = options.parentId ?? "island:cozy-001";
  const position = v3(options.position, { x: 0, y: 0, z: 0 });
  const radiusMeters = number(options.radiusMeters, 1.45);
  const intensity = number(options.intensity, 0.82);
  const lit = options.lit !== false;
  const firewoodId = childId(id, "firewood-ring");
  const emberId = childId(id, "ember-bed");
  const flameId = childId(id, "flame-emitter");
  const smokeId = childId(id, "smoke-emitter");
  const lightId = childId(id, "warm-light");
  const interactionId = childId(id, "interaction");
  const root = objectRecord({
    id,
    type: "campfire",
    parentId,
    children: [firewoodId, emberId, flameId, smokeId, lightId, interactionId],
    transform: { position, scale: { x: 1, y: 1, z: 1 } },
    state: { lit, fuel: number(options.fuel, 1), heat: intensity, radiusMeters },
    render: { meshType: "procedural-campfire", lod: "near-interactable" },
    affordances: ["inspect", "warm-hands"],
    collision: { shape: "circle", radius: radiusMeters + 0.65, blocksMovement: true },
    tags: ["campfire", "clearing-object", "light-source"]
  });
  const children = [
    objectRecord({ id: firewoodId, type: "firewood-ring", parentId: id, transform: { position }, state: { logCount: 7, radiusMeters }, render: { meshType: "campfire-firewood-ring" }, tags: ["campfire-part"] }),
    objectRecord({ id: emberId, type: "ember-bed", parentId: id, transform: { position: { x: position.x, y: position.y + 0.08, z: position.z } }, state: { heat: intensity }, render: { meshType: "campfire-ember-bed", emissive: true }, tags: ["campfire-part", "emissive"] }),
    objectRecord({ id: flameId, type: "flame-emitter", parentId: id, transform: { position: { x: position.x, y: position.y + 0.32, z: position.z } }, state: { intensity, flameCount: 5 }, render: { meshType: "campfire-flame-emitter", emissive: true }, tags: ["campfire-part", "fire"] }),
    objectRecord({ id: smokeId, type: "smoke-emitter-anchor", parentId: id, transform: { position: { x: position.x, y: position.y + 1.15, z: position.z } }, state: { enabled: options.smoke !== false }, render: { meshType: "smoke-emitter-anchor" }, tags: ["campfire-part", "smoke"] }),
    objectRecord({ id: lightId, type: "warm-light", parentId: id, transform: { position: { x: position.x, y: position.y + 1.0, z: position.z } }, state: { color: "#ff9d43", intensity, rangeMeters: number(options.rangeMeters, 18) }, render: { meshType: "point-light-descriptor" }, tags: ["campfire-part", "light"] }),
    objectRecord({ id: interactionId, type: "campfire-interaction", parentId: id, transform: { position }, state: { usable: true }, affordances: ["inspect", "sit-near", "warm-hands"], tags: ["interaction"] })
  ];
  return { id, version: CAMPFIRE_OBJECT_DOMAIN_VERSION, rootId: id, objects: [root, ...children], byId: Object.fromEntries([root, ...children].map((object) => [object.id, object])) };
}

export function createCampfireObject(options = {}) {
  return createCampfireObjectGraph(options).objects[0];
}

export function createCampfireState(options = {}) {
  return { id: options.id ?? "campfire-object-domain", version: CAMPFIRE_OBJECT_DOMAIN_VERSION, lastGraph: null };
}

export function createCampfireObjectDomainKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const State = defs.resource(options.resourceName ?? "campfireObject.state");
  const initial = () => createCampfireState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.kitId ?? "campfire-object-domain",
    resources: { State },
    provides: ["campfire:object-graph", "campfire:render-descriptor", "campfire:collision-descriptor"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.campfireObject = {
        getState,
        getSnapshot: () => clone(getState()),
        createObject: createCampfireObject,
        createGraph(options = {}) {
          const graph = createCampfireObjectGraph(options);
          world.setResource(State, { ...getState(), lastGraph: clone(graph) });
          return graph;
        },
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.campfireObject = engine.campfireObject;
    },
    metadata: { version: CAMPFIRE_OBJECT_DOMAIN_VERSION, domain: "campfire-object", purpose: "Create reusable campfire object graphs with firewood, embers, flame, smoke anchor, light, and interaction descriptors." }
  });
}

export default createCampfireObjectDomainKit;
