import { asList, byId, clone, defineInjectedRuntimeKit, getClockElapsed, number } from "../protokit-core/index.js";

export const CONFIGURABLE_RENDER_LAYER_KIT_VERSION = "0.1.0";

export const defaultRenderStyleProfile = Object.freeze({
  id: "default-render-style",
  layers: {
    sky: { alpha: 1, palette: "default-sky" },
    "far-static": { alpha: 1, fog: 0.6, parallaxStyle: "distant" },
    "mid-static": { alpha: 1, fog: 0.3, parallaxStyle: "mid" },
    "near-static": { alpha: 1, fog: 0.12, parallaxStyle: "near" },
    interactive: { readable: true, glow: 1 },
    character: { readable: true, contrast: 1 },
    "world-ui": { readable: true, alpha: 0.9 }
  },
  material: {},
  fog: {},
  light: {},
  motion: {},
  readability: {}
});

const resource = (N, name) => N.defineResource?.(name) ?? Object.freeze({ kind: "resource", name });
const event = (N, name) => N.defineEvent?.(name) ?? Object.freeze({ kind: "event", name });

export function createConfigurableRenderLayerDefinitions(NexusEngine = {}, options = {}) {
  const prefix = options.namespace ?? "configurableRenderLayers";
  return {
    resources: {
      ConfigurableRenderLayerState: resource(NexusEngine, `${prefix}.state`),
      RenderStyleProfileState: resource(NexusEngine, `${prefix}.profiles`),
      RenderStyleDesignationState: resource(NexusEngine, `${prefix}.designations`),
      ResolvedRenderStyleState: resource(NexusEngine, `${prefix}.resolved`),
      RenderStyleValidationState: resource(NexusEngine, `${prefix}.validation`),
      RenderStyleDebugState: resource(NexusEngine, `${prefix}.debug`)
    },
    events: {
      RenderStyleProfileRegistered: event(NexusEngine, `${prefix}.profileRegistered`),
      RenderStyleDesignationChanged: event(NexusEngine, `${prefix}.designationChanged`),
      RenderStyleResolved: event(NexusEngine, `${prefix}.resolved`),
      RenderStyleValidationWarning: event(NexusEngine, `${prefix}.validationWarning`)
    }
  };
}

function merge(base = {}, patch = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(patch ?? {})) {
    out[key] = value && typeof value === "object" && !Array.isArray(value) && out[key] && typeof out[key] === "object" && !Array.isArray(out[key])
      ? merge(out[key], value)
      : clone(value);
  }
  return out;
}

function normalizeProfile(profile = {}, index = 0) {
  return merge(defaultRenderStyleProfile, {
    ...profile,
    id: profile.id ?? profile.name ?? `render-style-${index + 1}`,
    extends: profile.extends ?? null,
    layers: profile.layers ?? {},
    material: profile.material ?? profile.materials ?? {},
    fog: profile.fog ?? {},
    light: profile.light ?? profile.lighting ?? {},
    motion: profile.motion ?? {},
    readability: profile.readability ?? {}
  });
}

function normalizeDesignation(designation = {}, index = 0) {
  const when = designation.when ?? {};
  return {
    id: designation.id ?? `designation-${index + 1}`,
    style: designation.style ?? designation.styleId ?? designation.designation ?? defaultRenderStyleProfile.id,
    priority: number(designation.priority, 0),
    when: {
      objectId: designation.objectId ?? when.objectId,
      layer: designation.layer ?? designation.layerId ?? when.layer ?? when.layerId,
      parallaxLayer: designation.parallaxLayer ?? designation.parallaxLayerId ?? when.parallaxLayer ?? when.parallaxLayerId,
      depthPlane: designation.depthPlane ?? when.depthPlane,
      region: designation.region ?? designation.regionId ?? when.region ?? when.regionId,
      mode: designation.mode ?? when.mode,
      scene: designation.scene ?? designation.sceneId ?? when.scene ?? when.sceneId,
      tag: designation.tag ?? when.tag
    }
  };
}

function profilesById(input = {}) {
  const profiles = [defaultRenderStyleProfile, ...asList(input.profiles).map(normalizeProfile)];
  return byId(profiles);
}

function resolveInheritance(profile, all, stack = []) {
  if (!profile?.extends) return profile ?? defaultRenderStyleProfile;
  if (stack.includes(profile.id)) return { ...profile, inheritanceCycle: true };
  return merge(resolveInheritance(all[profile.extends], all, [...stack, profile.id]), profile);
}

function targetLayer(target = {}) {
  return target.renderLayer ?? target.layer ?? target.visual?.layer ?? target.metadata?.layer ?? null;
}

function matches(designation = {}, target = {}, context = {}) {
  const when = designation.when ?? {};
  if (when.objectId && when.objectId !== target.id && when.objectId !== target.objectId) return false;
  if (when.layer && when.layer !== targetLayer(target)) return false;
  if (when.parallaxLayer && when.parallaxLayer !== target.parallaxLayerId && when.parallaxLayer !== target.layerId) return false;
  if (when.depthPlane && when.depthPlane !== target.depthPlane) return false;
  if (when.region && when.region !== context.region && when.region !== target.region && when.region !== target.regionId) return false;
  if (when.mode && when.mode !== context.mode && when.mode !== target.mode) return false;
  if (when.scene && when.scene !== context.scene && when.scene !== target.scene && when.scene !== target.sceneId) return false;
  if (when.tag && !asList(target.tags ?? target.metadata?.tags ?? target.visual?.tags).includes(when.tag)) return false;
  return true;
}

function explicitDesignations(target = {}) {
  return [target.styleId, target.renderStyle, target.visual?.styleId, target.visual?.renderStyle, target.metadata?.styleId, target.metadata?.renderStyle]
    .filter(Boolean)
    .map((style, index) => ({ id: `explicit-${index}`, style, priority: 1000 + index, when: {} }));
}

export function resolveRenderStyleForTarget(target = {}, input = {}) {
  const all = profilesById(input);
  const defaultStyle = input.defaultStyle ?? input.defaultStyleId ?? defaultRenderStyleProfile.id;
  const context = input.context ?? input;
  const designations = [...asList(input.designations).map(normalizeDesignation), ...explicitDesignations(target)];
  const applied = designations.filter((entry) => matches(entry, target, context)).sort((a, b) => number(a.priority) - number(b.priority));
  let resolved = resolveInheritance(all[defaultStyle], all);
  const appliedIds = [resolved.id];
  for (const designation of applied) {
    resolved = merge(resolved, resolveInheritance(all[designation.style], all));
    appliedIds.push(designation.style);
  }
  const layer = targetLayer(target);
  const layerStyle = layer ? resolved.layers?.[layer] ?? {} : {};
  return {
    id: appliedIds[appliedIds.length - 1] ?? defaultStyle,
    applied: appliedIds,
    targetId: target.id ?? target.objectId ?? null,
    renderLayer: layer,
    profile: resolved,
    values: merge(layerStyle, {
      material: merge(resolved.material ?? {}, layerStyle.material ?? {}),
      fog: merge(resolved.fog ?? {}, typeof layerStyle.fog === "object" ? layerStyle.fog : {}),
      light: merge(resolved.light ?? {}, layerStyle.light ?? {}),
      motion: merge(resolved.motion ?? {}, layerStyle.motion ?? {}),
      readability: merge(resolved.readability ?? {}, layerStyle.readability ?? {})
    })
  };
}

function targets(input = {}) {
  const explicit = asList(input.targets ?? input.objects ?? input.descriptors);
  const renderObjects = asList(input.renderSnapshot?.objects ?? input.renderSnapshot?.scene?.objects);
  const parallaxLayers = asList(input.parallaxSnapshot?.layers).map((layer) => ({ id: layer.id, layer: layer.renderLayer, parallaxLayerId: layer.id, depthPlane: layer.depthPlane, styleId: layer.styleId, kind: "parallax-layer" }));
  const parallaxObjects = asList(input.parallaxSnapshot?.drawOrder);
  return [...explicit, ...renderObjects, ...parallaxLayers, ...parallaxObjects];
}

function validate(profiles, designations, resolved) {
  const warnings = [];
  const ids = new Set(profiles.map((profile) => profile.id));
  for (const profile of profiles) if (profile.extends && !ids.has(profile.extends)) warnings.push({ type: "missing-parent-style", styleId: profile.id, parentId: profile.extends });
  for (const designation of designations) if (!ids.has(designation.style)) warnings.push({ type: "unknown-style-designation", designationId: designation.id, styleId: designation.style });
  for (const target of resolved) if (!target.style?.id) warnings.push({ type: "unresolved-style", targetId: target.id });
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings };
}

export function createConfigurableRenderLayerSnapshot(input = {}) {
  const profileList = [defaultRenderStyleProfile, ...asList(input.profiles).map(normalizeProfile)];
  const designations = asList(input.designations).map(normalizeDesignation);
  const resolvedTargets = targets(input).map((target, index) => {
    const id = target.id ?? target.objectId ?? `render-target-${index + 1}`;
    const style = resolveRenderStyleForTarget(target, { ...input, profiles: profileList, designations });
    return { id, kind: target.kind ?? target.archetype ?? "object", renderLayer: targetLayer(target) ?? style.renderLayer, parallaxLayerId: target.parallaxLayerId ?? target.layerId ?? null, depthPlane: target.depthPlane ?? null, style, resolvedVisual: merge(target.visual ?? {}, { styleId: style.id, ...style.values }), metadata: clone(target.metadata ?? {}) };
  });
  const validation = validate(profileList, designations, resolvedTargets);
  const byLayer = resolvedTargets.reduce((acc, target) => { const key = target.renderLayer ?? "unlayered"; (acc[key] ??= []).push(target); return acc; }, {});
  return {
    version: CONFIGURABLE_RENDER_LAYER_KIT_VERSION,
    defaultStyle: input.defaultStyle ?? input.defaultStyleId ?? defaultRenderStyleProfile.id,
    context: { scene: input.scene ?? input.sceneId ?? null, region: input.region ?? input.regionId ?? null, mode: input.mode ?? null },
    profiles: profileList,
    designations,
    targets: resolvedTargets,
    byLayer,
    validation,
    debug: { profileCount: profileList.length, designationCount: designations.length, targetCount: resolvedTargets.length, warnings: validation.warnings }
  };
}

function initialState(options = {}) {
  return { version: CONFIGURABLE_RENDER_LAYER_KIT_VERSION, status: "ready", defaultStyle: options.defaultStyle ?? options.defaultStyleId ?? defaultRenderStyleProfile.id, profiles: asList(options.profiles), designations: asList(options.designations), scene: options.scene ?? options.sceneId ?? null, region: options.region ?? options.regionId ?? null, mode: options.mode ?? null, targets: asList(options.targets ?? options.objects ?? options.descriptors), lastReason: "initialized" };
}

export function createConfigurableRenderLayerKit(NexusEngine = {}, options = {}) {
  const definitions = createConfigurableRenderLayerDefinitions(NexusEngine, options);
  const { resources, events } = definitions;
  function renderStyleSystem(world) {
    const state = world.getResource(resources.ConfigurableRenderLayerState) ?? initialState(options);
    const snapshot = createConfigurableRenderLayerSnapshot({ ...state, elapsed: getClockElapsed(world, 0) });
    world.setResource(resources.RenderStyleProfileState, snapshot.profiles);
    world.setResource(resources.RenderStyleDesignationState, snapshot.designations);
    world.setResource(resources.ResolvedRenderStyleState, snapshot);
    world.setResource(resources.RenderStyleValidationState, snapshot.validation);
    world.setResource(resources.RenderStyleDebugState, snapshot.debug);
    world.setResource(resources.ConfigurableRenderLayerState, { ...state, status: snapshot.validation.ok ? "ready" : "warning", frame: number(world.__nexusClock?.frame, number(state.frame, 0) + 1), elapsed: getClockElapsed(world, 0) });
    world.emit(events.RenderStyleResolved, { targetCount: snapshot.debug.targetCount });
    for (const warning of snapshot.validation.warnings) world.emit(events.RenderStyleValidationWarning, warning);
  }
  return defineInjectedRuntimeKit(NexusEngine, {
    id: options.id ?? "configurable-render-layer-kit",
    resources,
    events,
    systems: [{ phase: options.phase ?? "resolve", name: "renderStyleSystem", system: renderStyleSystem }],
    provides: ["render:configurable-layers", "render:style-designation", "render:style-resolution"],
    initWorld({ world }) {
      const state = initialState(options);
      const snapshot = createConfigurableRenderLayerSnapshot(state);
      world.setResource(resources.ConfigurableRenderLayerState, state);
      world.setResource(resources.RenderStyleProfileState, snapshot.profiles);
      world.setResource(resources.RenderStyleDesignationState, snapshot.designations);
      world.setResource(resources.ResolvedRenderStyleState, snapshot);
      world.setResource(resources.RenderStyleValidationState, snapshot.validation);
      world.setResource(resources.RenderStyleDebugState, snapshot.debug);
    },
    install({ engine, world }) {
      engine.configurableRenderLayers = {
        definitions,
        configure(patch = {}, reason = "configure") { const next = merge(world.getResource(resources.ConfigurableRenderLayerState) ?? initialState(options), patch); next.lastReason = reason; world.setResource(resources.ConfigurableRenderLayerState, next); return next; },
        registerProfile(profile = {}) { const state = world.getResource(resources.ConfigurableRenderLayerState) ?? initialState(options); const normalized = normalizeProfile(profile, asList(state.profiles).length); world.setResource(resources.ConfigurableRenderLayerState, { ...state, profiles: [...asList(state.profiles).filter((entry) => entry.id !== normalized.id), normalized], lastReason: "register-profile" }); world.emit(events.RenderStyleProfileRegistered, { profileId: normalized.id }); return normalized; },
        designate(designation = {}) { const state = world.getResource(resources.ConfigurableRenderLayerState) ?? initialState(options); const normalized = normalizeDesignation(designation, asList(state.designations).length); world.setResource(resources.ConfigurableRenderLayerState, { ...state, designations: [...asList(state.designations), normalized], lastReason: "designate" }); world.emit(events.RenderStyleDesignationChanged, normalized); return normalized; },
        setActiveRegion(region) { return this.configure({ region }, "set-active-region"); },
        setActiveMode(mode) { return this.configure({ mode }, "set-active-mode"); },
        resolve(target = {}) { return resolveRenderStyleForTarget(target, world.getResource(resources.ConfigurableRenderLayerState) ?? initialState(options)); },
        getState() { return world.getResource(resources.ConfigurableRenderLayerState); },
        getResolvedLayers() { return world.getResource(resources.ResolvedRenderStyleState); },
        getSnapshot() { return this.getResolvedLayers(); },
        getDebugReport() { return world.getResource(resources.RenderStyleDebugState); },
        validate() { return world.getResource(resources.RenderStyleValidationState); },
        reset() { const state = initialState(options); world.setResource(resources.ConfigurableRenderLayerState, state); return state; }
      };
    },
    metadata: { version: CONFIGURABLE_RENDER_LAYER_KIT_VERSION, domain: "configurable-render-layer", purpose: "Render-layer style profiles, designations, inheritance, resolution, validation, and renderer-ready visual style descriptors." }
  });
}

export const createNConfigurableRenderLayerKit = createConfigurableRenderLayerKit;
export default createConfigurableRenderLayerKit;
