import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_DATA_KIT_VERSION = "0.1.0";

function normalizeBody(body = {}, index = 0) {
  return {
    id: String(body.id ?? `water-body-${index + 1}`),
    kind: String(body.kind ?? "pond"),
    bounds: cloneFluidValue(body.bounds ?? { x: 0, z: 0, width: 80, depth: 48 }),
    depth: toFluidNumber(body.depth, 2.5),
    flow: cloneFluidValue(body.flow ?? { x: 0.12, z: 0.04 }),
    profile: String(body.profile ?? body.kind ?? "clear-water"),
    tags: asFluidArray(body.tags ?? [body.kind ?? "water"]).map(String),
    meshPolicy: String(body.meshPolicy ?? (body.kind === "river" ? "river-strip" : body.kind === "ocean" ? "projected-grid" : "tile-grid")),
    metadata: cloneFluidValue(body.metadata ?? {})
  };
}

function normalizeProfile(profile = {}, index = 0) {
  return {
    id: String(profile.id ?? `water-profile-${index + 1}`),
    color: String(profile.color ?? "#4fc3f7"),
    shallowColor: String(profile.shallowColor ?? "#9ff5ff"),
    deepColor: String(profile.deepColor ?? "#0a2b4f"),
    foamColor: String(profile.foamColor ?? "#eafcff"),
    clarity: toFluidNumber(profile.clarity, 0.7),
    waveScale: toFluidNumber(profile.waveScale, 1),
    roughness: toFluidNumber(profile.roughness, 0.22),
    metadata: cloneFluidValue(profile.metadata ?? {})
  };
}

function createInitial(config = {}) {
  const bodies = asFluidArray(config.bodies ?? [{ id: "demo-pond", kind: "pond", bounds: { x: -40, z: -24, width: 80, depth: 48 }, depth: 3 }]).map(normalizeBody);
  const profiles = asFluidArray(config.profiles ?? [{ id: "clear-water" }, { id: "river", color: "#5bd3e6", roughness: 0.35 }]).map(normalizeProfile);
  return {
    bodies,
    bodiesById: Object.fromEntries(bodies.map((body) => [body.id, body])),
    profiles,
    profilesById: Object.fromEntries(profiles.map((profile) => [profile.id, profile]))
  };
}

export function createWaterDataKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: WATER_DATA_KIT_VERSION,
    factoryName: "createWaterDataKit",
    kitId: "water-data-kit",
    engineKey: "waterData",
    resourceName: "waterData.state",
    eventStem: "waterData",
    domain: "fluid.water",
    service: "data",
    provides: ["water:data", "water:bodies", "water:profiles"],
    purpose: "Declarative water body and profile data for ponds, rivers, oceans, floods, and pools.",
    createInitial,
    reduceAction(state, event) {
      if (event.type === "set-bodies") {
        const bodies = asFluidArray(event.bodies).map(normalizeBody);
        return { ...state, bodies, bodiesById: Object.fromEntries(bodies.map((body) => [body.id, body])) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function setBodies(bodies) {
        const normalized = asFluidArray(bodies).map(normalizeBody);
        return patchState({ bodies: normalized, bodiesById: Object.fromEntries(normalized.map((body) => [body.id, body])) }, "set-bodies");
      }
      function getBody(id) {
        return cloneFluidValue(getState().bodiesById[id] ?? null);
      }
      function getProfile(id = "clear-water") {
        const state = getState();
        return cloneFluidValue(state.profilesById[id] ?? state.profiles[0] ?? null);
      }
      return { setBodies, getBody, getProfile };
    }
  }, config);
}

export default createWaterDataKit;
