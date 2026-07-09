import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJECT_GROUNDING_PROFILE_KIT_VERSION = "0.1.0";

export function createObjectGroundingProfileState(options = {}) {
  return { version: OBJECT_GROUNDING_PROFILE_KIT_VERSION, defaults: { rootSink: number(options.rootSink, 0.06), maxSlope: number(options.maxSlope, 0.62), normalAlign: number(options.normalAlign, 0.35), embedDepth: number(options.embedDepth, 0.04) }, byKind: { tree: { rootSink: 0.12, maxSlope: 0.58, normalAlign: 0.18 }, grass: { rootSink: 0.02, maxSlope: 0.9, normalAlign: 0.65 }, rock: { rootSink: 0.18, maxSlope: 0.82, normalAlign: 0.5 }, "fallen-log": { rootSink: 0.08, maxSlope: 0.72, normalAlign: 0.25 }, ...(options.byKind ?? {}) } };
}

export function describeObjectGroundingProfile(asset = {}, instance = {}, terrainSample = {}, state = createObjectGroundingProfileState()) {
  const kind = instance.kind ?? asset.kind ?? "object";
  const profile = { ...state.defaults, ...(state.byKind[kind] ?? {}), ...(asset.grounding ?? {}) };
  const normal = terrainSample.normal ?? instance.normal ?? { x: 0, y: 1, z: 0 };
  const slope = 1 - number(normal.y, 1);
  return { kind, rootSink: profile.rootSink, embedDepth: profile.embedDepth, normalAlign: profile.normalAlign, maxSlope: profile.maxSlope, slope, valid: slope <= profile.maxSlope, normal: clone(normal), rejectReason: slope > profile.maxSlope ? "slope" : null };
}

export function createObjectGroundingProfileKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "objectGroundingProfile.state");
  const Updated = event("objectGroundingProfile.updated");
  const initial = () => createObjectGroundingProfileState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "object-grounding-profile-kit",
    resources: { State },
    events: { Updated },
    provides: ["object:grounding-profile", "placement:grounding-descriptors"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const api = { getState: state, describe(asset = {}, instance = {}, terrainSample = {}) { return describeObjectGroundingProfile(asset, instance, terrainSample, state()); }, set(config = {}) { const next = { ...state(), ...config, defaults: { ...state().defaults, ...(config.defaults ?? {}) }, byKind: { ...state().byKind, ...(config.byKind ?? {}) } }; world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next); }, snapshot: () => clone(state()) };
      engine.objectGroundingProfile = api;
      engine.n ??= {};
      engine.n.objectGroundingProfile = api;
    },
    metadata: { version: OBJECT_GROUNDING_PROFILE_KIT_VERSION, purpose: "Renderer-agnostic root sink, slope, embed, and normal alignment descriptors for world objects." }
  });
}

export default createObjectGroundingProfileKit;
