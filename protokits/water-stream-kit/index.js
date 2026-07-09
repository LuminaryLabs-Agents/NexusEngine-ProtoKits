import { cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_STREAM_KIT_VERSION = "0.1.0";

function tileId(x, z) {
  return `water-tile-${x}:${z}`;
}

function createTile(x, z, focus = {}, tileSize = 32) {
  const dx = x * tileSize - toFluidNumber(focus.x, 0);
  const dz = z * tileSize - toFluidNumber(focus.z, 0);
  const distance = Math.hypot(dx, dz);
  return { id: tileId(x, z), x, z, center: { x: x * tileSize, z: z * tileSize }, distance, lod: distance < tileSize * 1.5 ? "near" : distance < tileSize * 3 ? "mid" : "far" };
}

function computeTiles(focus = {}, config = {}) {
  const tileSize = Math.max(8, toFluidNumber(config.tileSize, 32));
  const radius = Math.max(1, Math.floor(toFluidNumber(config.radius, 2)));
  const cx = Math.round(toFluidNumber(focus.x, 0) / tileSize);
  const cz = Math.round(toFluidNumber(focus.z, 0) / tileSize);
  const tiles = [];
  for (let z = cz - radius; z <= cz + radius; z += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) tiles.push(createTile(x, z, focus, tileSize));
  }
  return tiles.sort((a, b) => a.distance - b.distance);
}

function createInitial(config = {}) {
  const focus = cloneFluidValue(config.focus ?? { x: 0, z: 0 });
  const activeTiles = computeTiles(focus, config);
  return { focus, activeTiles, loadedTileIds: activeTiles.map((tile) => tile.id), budget: { maxTiles: toFluidNumber(config.maxTiles, 25), tileSize: toFluidNumber(config.tileSize, 32), radius: toFluidNumber(config.radius, 2) } };
}

export function createWaterStreamKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: WATER_STREAM_KIT_VERSION,
    factoryName: "createWaterStreamKit",
    kitId: "water-stream-kit",
    engineKey: "waterStream",
    resourceName: "waterStream.state",
    eventStem: "waterStream",
    domain: "fluid.water",
    service: "stream",
    requires: ["water:data"],
    provides: ["water:stream", "water:tiles", "water:lod"],
    purpose: "Water chunk/texture/region streaming descriptors separated from mesh and shading policy.",
    createInitial,
    reduceAction(state, event) {
      if (event.type === "set-focus") {
        const focus = cloneFluidValue(event.focus ?? state.focus);
        const activeTiles = computeTiles(focus, { ...state.budget, ...state.config });
        return { ...state, focus, activeTiles, loadedTileIds: activeTiles.map((tile) => tile.id) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function setFocus(focus = {}) {
        const state = getState();
        const nextFocus = cloneFluidValue(focus);
        const activeTiles = computeTiles(nextFocus, state.budget);
        return patchState({ focus: nextFocus, activeTiles, loadedTileIds: activeTiles.map((tile) => tile.id) }, "set-focus");
      }
      function getActiveTiles() {
        return getState().activeTiles;
      }
      return { setFocus, getActiveTiles };
    }
  }, config);
}

export default createWaterStreamKit;
