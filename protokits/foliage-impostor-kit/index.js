import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FOLIAGE_IMPOSTOR_KIT_VERSION = "0.1.0";

export function createFoliageImpostorState(options = {}) {
  return { version: FOLIAGE_IMPOSTOR_KIT_VERSION, distance: number(options.distance, 180), clusterSize: number(options.clusterSize, 80), cards: [] };
}

export function buildFoliageImpostors(instances = [], viewer = {}, state = createFoliageImpostorState()) {
  const groups = new Map();
  for (const item of asList(instances)) {
    const p = item.position ?? item;
    const d = Math.hypot(number(p.x) - number(viewer.x ?? viewer.position?.x), number(p.z ?? p.y) - number(viewer.z ?? viewer.position?.z));
    if (d < state.distance) continue;
    const gx = Math.floor(number(p.x) / state.clusterSize);
    const gz = Math.floor(number(p.z ?? p.y) / state.clusterSize);
    const key = `${item.kind ?? "foliage"}:${gx},${gz}`;
    if (!groups.has(key)) groups.set(key, { id: key, type: "billboard-cluster", kind: item.kind ?? "foliage", center: { x: gx * state.clusterSize + state.clusterSize / 2, y: number(p.y, 0), z: gz * state.clusterSize + state.clusterSize / 2 }, radius: state.clusterSize, count: 0, assetIds: [] });
    const card = groups.get(key);
    card.count += 1;
    if (item.assetId && !card.assetIds.includes(item.assetId)) card.assetIds.push(item.assetId);
  }
  return Array.from(groups.values());
}

export function createFoliageImpostorKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "foliageImpostors.state");
  const Updated = event("foliageImpostors.updated");
  const initial = () => createFoliageImpostorState(options);
  return defineInjectedRuntimeKit(nexusEngine, { id: options.id ?? "foliage-impostor-kit", resources: { State }, events: { Updated }, requires: ["vegetation:placement"], provides: ["foliage:impostors", "render:foliage-impostor-descriptors"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const api = { getState: state, buildFromInstances(instances = engine.vegetationPlacement?.listInstances?.() ?? [], viewer = {}) { const next = { ...state(), cards: buildFoliageImpostors(instances, viewer, state()) }; world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next.cards); }, getCards() { return clone(state().cards); }, snapshot: () => clone(state()) }; engine.foliageImpostors = api; engine.n ??= {}; engine.n.foliageImpostors = api; }, metadata: { version: FOLIAGE_IMPOSTOR_KIT_VERSION, purpose: "Renderer-agnostic far foliage billboard cluster descriptors." } });
}

export default createFoliageImpostorKit;
