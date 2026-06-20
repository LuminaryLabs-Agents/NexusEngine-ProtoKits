import { asList, byId, clamp, clone, defineInjectedRuntimeKit, getClockElapsed, number } from "../protokit-core/index.js";

export const PARALLAX_KIT_VERSION = "0.1.0";

export const defaultParallaxProfile = Object.freeze({
  id: "default-parallax",
  camera: { x: 0, y: 0, zoom: 1, trauma: 0 },
  viewport: { width: 1280, height: 720 },
  depthPlanes: [
    { id: "sky", depth: 0.05, factorX: 0.03, factorY: 0.015, fogReceive: 0.9 },
    { id: "far", depth: 0.18, factorX: 0.12, factorY: 0.06, fogReceive: 0.72 },
    { id: "mid", depth: 0.45, factorX: 0.38, factorY: 0.22, fogReceive: 0.42 },
    { id: "gameplay", depth: 1, factorX: 1, factorY: 1, fogReceive: 0.12 },
    { id: "foreground", depth: 1.32, factorX: 1.18, factorY: 1.08, fogReceive: 0.04 }
  ],
  layers: [
    { id: "sky", depthPlane: "sky", renderLayer: "sky" },
    { id: "far-clouds", depthPlane: "far", renderLayer: "far-static", scrollX: -0.006, repeat: { x: true, tileWidth: 900 } },
    { id: "mid-world", depthPlane: "mid", renderLayer: "mid-static" },
    { id: "gameplay", depthPlane: "gameplay", renderLayer: "interactive" },
    { id: "foreground", depthPlane: "foreground", renderLayer: "near-static", repeat: { x: true, tileWidth: 640 }, occlusion: { fadeNearActor: true, revealRadius: 96 } }
  ],
  fog: { color: "#9ec8d7", density: 0.08 },
  budget: { maxTilesPerLayer: 9, maxDescriptors: 500 }
});

const resource = (N, name) => N.defineResource?.(name) ?? Object.freeze({ kind: "resource", name });
const event = (N, name) => N.defineEvent?.(name) ?? Object.freeze({ kind: "event", name });
const objectMap = (value = {}) => Array.isArray(value) ? byId(value) : { ...value };

export function createParallaxDefinitions(NexusRealtime = {}, options = {}) {
  const prefix = options.namespace ?? "parallax";
  return {
    resources: {
      ParallaxState: resource(NexusRealtime, `${prefix}.state`),
      ParallaxDescriptorState: resource(NexusRealtime, `${prefix}.descriptors`),
      ParallaxValidationState: resource(NexusRealtime, `${prefix}.validation`),
      ParallaxDebugState: resource(NexusRealtime, `${prefix}.debug`)
    },
    events: {
      ParallaxConfigured: event(NexusRealtime, `${prefix}.configured`),
      ParallaxProfileChanged: event(NexusRealtime, `${prefix}.profileChanged`),
      ParallaxBindingChanged: event(NexusRealtime, `${prefix}.bindingChanged`),
      ParallaxValidationWarning: event(NexusRealtime, `${prefix}.validationWarning`)
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

function list(value, fallback = []) {
  if (Array.isArray(value)) return value.map((entry) => ({ ...entry }));
  if (value && typeof value === "object") return Object.entries(value).map(([id, entry]) => ({ id, ...(entry ?? {}) }));
  return fallback.map((entry) => ({ ...entry }));
}

function activeProfile(input = {}) {
  const profiles = objectMap([defaultParallaxProfile, ...asList(input.profiles)]);
  return merge(defaultParallaxProfile, profiles[input.activeProfileId ?? input.profileId ?? defaultParallaxProfile.id] ?? {});
}

function normalizePlane(plane = {}) {
  return {
    id: plane.id ?? "gameplay",
    depth: number(plane.depth, 1),
    factorX: number(plane.factorX ?? plane.parallaxX, 1),
    factorY: number(plane.factorY ?? plane.parallaxY, 1),
    fogReceive: clamp(number(plane.fogReceive, 0), 0, 1),
    shakeInfluence: clamp(number(plane.shakeInfluence, Math.max(0, number(plane.depth, 1) - 0.05)), 0, 2)
  };
}

function normalizeLayer(layer = {}, planes = {}) {
  const plane = planes[layer.depthPlane] ?? planes.gameplay ?? normalizePlane();
  return {
    id: layer.id ?? "gameplay",
    depthPlane: layer.depthPlane ?? plane.id,
    renderLayer: layer.renderLayer ?? layer.layer ?? "mid-static",
    styleId: layer.styleId ?? layer.renderStyle ?? null,
    factorX: number(layer.factorX ?? layer.parallaxX, plane.factorX),
    factorY: number(layer.factorY ?? layer.parallaxY, plane.factorY),
    scrollX: number(layer.scrollX, 0),
    scrollY: number(layer.scrollY, 0),
    alpha: clamp(number(layer.alpha, 1), 0, 1),
    fogReceive: clamp(number(layer.fogReceive, plane.fogReceive), 0, 1),
    shakeInfluence: clamp(number(layer.shakeInfluence, plane.shakeInfluence), 0, 2),
    repeat: layer.repeat === true ? { x: true } : { ...(layer.repeat ?? {}) },
    occlusion: clone(layer.occlusion ?? {}),
    descriptors: asList(layer.descriptors)
  };
}

function camera(input = {}) {
  return {
    x: number(input.x, 0),
    y: number(input.y, 0),
    zoom: number(input.zoom, 1),
    trauma: clamp(number(input.trauma, 0), 0, 1),
    mode: input.mode ?? "default"
  };
}

function descriptorLayer(object = {}, bindings = {}) {
  const binding = bindings[object.id] ?? object.parallax ?? object.metadata?.parallax ?? object.visual?.parallax ?? {};
  return binding.layerId ?? binding.parallaxLayerId ?? object.parallaxLayerId ?? object.visual?.parallaxLayerId ?? "gameplay";
}

function normalizeDescriptor(object = {}, layer = {}) {
  const transform = object.transform ?? object.position ?? {};
  return {
    id: object.id ?? `${layer.id}-descriptor`,
    layerId: descriptorLayer(object, {}),
    renderLayer: object.renderLayer ?? object.visual?.layer ?? layer.renderLayer,
    depthPlane: object.depthPlane ?? layer.depthPlane,
    styleId: object.styleId ?? object.renderStyle ?? object.visual?.styleId ?? layer.styleId,
    kind: object.kind ?? object.archetype ?? "parallax-card",
    material: object.material ?? object.visual?.material ?? null,
    mesh: object.mesh ?? object.visual?.mesh ?? "card",
    transform: { x: number(transform.x), y: number(transform.y), z: number(transform.z, number(transform.y)), scale: number(transform.scale, 1) },
    visual: clone(object.visual ?? {}),
    metadata: clone(object.metadata ?? {})
  };
}

function tiles(layer, offset, viewport, budget) {
  if (!layer.repeat?.x && !layer.repeat?.y) return [];
  const max = Math.max(1, Math.floor(number(budget.maxTilesPerLayer, 9)));
  const w = Math.max(1, number(layer.repeat.tileWidth, viewport.width));
  const h = Math.max(1, number(layer.repeat.tileHeight, viewport.height));
  const count = Math.min(max, layer.repeat.x ? 5 : 1);
  const base = Math.floor(-offset.x / w);
  return Array.from({ length: count }, (_, i) => {
    const tx = base + i - Math.floor(count / 2);
    return { id: `${layer.id}:tile:${tx}:0`, layerId: layer.id, x: tx * w + offset.x, y: offset.y, width: w, height: h, tx, ty: 0 };
  });
}

function validate(planes, layers, descriptors) {
  const warnings = [];
  const planeIds = new Set(planes.map((plane) => plane.id));
  const layerIds = new Set(layers.map((layer) => layer.id));
  for (const layer of layers) if (!planeIds.has(layer.depthPlane)) warnings.push({ type: "unknown-depth-plane", layerId: layer.id, depthPlane: layer.depthPlane });
  for (const descriptor of descriptors) if (!layerIds.has(descriptor.layerId)) warnings.push({ type: "unknown-parallax-layer", descriptorId: descriptor.id, layerId: descriptor.layerId });
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings };
}

export function createParallaxSnapshot(input = {}) {
  const profile = activeProfile(input);
  const cam = camera(input.camera ?? profile.camera);
  const viewport = merge(profile.viewport, input.viewport ?? {});
  const budget = merge(profile.budget, input.budget ?? {});
  const planes = list(input.depthPlanes ?? profile.depthPlanes, defaultParallaxProfile.depthPlanes).map(normalizePlane);
  const planeById = byId(planes);
  const layers = list(input.layers ?? profile.layers, defaultParallaxProfile.layers).map((layer) => normalizeLayer(layer, planeById));
  const layerById = byId(layers);
  const bindingList = asList(input.bindings);
  const bindings = byId(bindingList.map((binding) => ({ id: binding.objectId ?? binding.id, ...binding })));
  const sourceObjects = [
    ...asList(input.objects),
    ...asList(input.descriptors),
    ...asList(input.renderSnapshot?.objects),
    ...asList(input.renderSnapshot?.scene?.objects)
  ];
  const objectDescriptors = sourceObjects.map((object) => {
    const layerId = descriptorLayer(object, bindings);
    return { ...normalizeDescriptor(object, layerById[layerId] ?? layerById.gameplay ?? layers[0]), layerId };
  });
  const layerDescriptors = layers.map((layer) => {
    const offset = {
      x: -cam.x * layer.factorX + layer.scrollX * number(input.elapsed, 0) * 60 + cam.trauma * layer.shakeInfluence * 6,
      y: -cam.y * layer.factorY + layer.scrollY * number(input.elapsed, 0) * 60 - cam.trauma * layer.shakeInfluence * 3
    };
    const descriptors = [...asList(layer.descriptors), ...objectDescriptors.filter((descriptor) => descriptor.layerId === layer.id)].slice(0, number(budget.maxDescriptors, 500));
    return {
      ...layer,
      offset,
      tiles: tiles(layer, offset, viewport, budget),
      fog: { color: profile.fog?.color ?? "#9ec8d7", density: clamp(number(profile.fog?.density, 0.08) * layer.fogReceive, 0, 1), receive: layer.fogReceive },
      descriptors: descriptors.map((descriptor) => ({ ...descriptor, offset, parallaxLayerId: layer.id }))
    };
  });
  const allDescriptors = layerDescriptors.flatMap((layer) => layer.descriptors.map((descriptor) => ({ ...descriptor, layer: layer.renderLayer, parallax: { factorX: layer.factorX, factorY: layer.factorY }, offset: layer.offset })));
  const validation = validate(planes, layers, allDescriptors);
  return {
    version: PARALLAX_KIT_VERSION,
    profileId: profile.id,
    camera: cam,
    viewport,
    depthPlanes: planes,
    layers: layerDescriptors,
    drawOrder: allDescriptors,
    bindings: bindingList,
    validation,
    debug: { layerCount: layers.length, descriptorCount: allDescriptors.length, tileCount: layerDescriptors.reduce((sum, layer) => sum + layer.tiles.length, 0), warnings: validation.warnings }
  };
}

function initialState(options = {}) {
  return { version: PARALLAX_KIT_VERSION, status: "ready", activeProfileId: options.activeProfileId ?? options.profileId ?? defaultParallaxProfile.id, profiles: asList(options.profiles), camera: camera(options.camera), viewport: merge(defaultParallaxProfile.viewport, options.viewport ?? {}), depthPlanes: clone(options.depthPlanes ?? defaultParallaxProfile.depthPlanes), layers: clone(options.layers ?? defaultParallaxProfile.layers), bindings: asList(options.bindings), objects: asList(options.objects), budget: merge(defaultParallaxProfile.budget, options.budget ?? {}), lastReason: "initialized" };
}

export function createParallaxKit(NexusRealtime = {}, options = {}) {
  const definitions = createParallaxDefinitions(NexusRealtime, options);
  const { resources, events } = definitions;
  function parallaxSystem(world) {
    const state = world.getResource(resources.ParallaxState) ?? initialState(options);
    const snapshot = createParallaxSnapshot({ ...state, elapsed: getClockElapsed(world, 0) });
    world.setResource(resources.ParallaxDescriptorState, snapshot);
    world.setResource(resources.ParallaxValidationState, snapshot.validation);
    world.setResource(resources.ParallaxDebugState, snapshot.debug);
    world.setResource(resources.ParallaxState, { ...state, status: snapshot.validation.ok ? "ready" : "warning", frame: number(world.__nexusClock?.frame, number(state.frame, 0) + 1), elapsed: getClockElapsed(world, 0) });
    for (const warning of snapshot.validation.warnings) world.emit(events.ParallaxValidationWarning, warning);
  }
  return defineInjectedRuntimeKit(NexusRealtime, {
    id: options.id ?? "parallax-kit",
    resources,
    events,
    systems: [{ phase: options.phase ?? "resolve", name: "parallaxSystem", system: parallaxSystem }],
    provides: ["parallax", "visual:depth-motion", "render:parallax-descriptors"],
    initWorld({ world }) {
      const state = initialState(options);
      world.setResource(resources.ParallaxState, state);
      world.setResource(resources.ParallaxDescriptorState, createParallaxSnapshot(state));
      world.setResource(resources.ParallaxValidationState, { ok: true, warningCount: 0, warnings: [] });
      world.setResource(resources.ParallaxDebugState, { layerCount: 0, descriptorCount: 0, tileCount: 0, warnings: [] });
    },
    install({ engine, world }) {
      engine.parallax = {
        definitions,
        configure(patch = {}, reason = "configure") { const next = merge(world.getResource(resources.ParallaxState) ?? initialState(options), patch); next.lastReason = reason; world.setResource(resources.ParallaxState, next); world.emit(events.ParallaxConfigured, { reason, patch }); return next; },
        setCamera(nextCamera = {}) { return this.configure({ camera: camera(nextCamera) }, "set-camera"); },
        setProfile(activeProfileId = defaultParallaxProfile.id) { const next = this.configure({ activeProfileId }, "set-profile"); world.emit(events.ParallaxProfileChanged, { activeProfileId }); return next; },
        bindObject(objectId, binding = {}) { const state = world.getResource(resources.ParallaxState) ?? initialState(options); const bindings = asList(state.bindings).filter((entry) => (entry.objectId ?? entry.id) !== objectId); const nextBinding = { objectId, ...binding }; world.setResource(resources.ParallaxState, { ...state, bindings: [...bindings, nextBinding], lastReason: "bind-object" }); world.emit(events.ParallaxBindingChanged, nextBinding); return nextBinding; },
        getState() { return world.getResource(resources.ParallaxState); },
        getDescriptors() { return world.getResource(resources.ParallaxDescriptorState); },
        getSnapshot() { return this.getDescriptors(); },
        getDebugReport() { return world.getResource(resources.ParallaxDebugState); },
        reset() { const state = initialState(options); world.setResource(resources.ParallaxState, state); return state; }
      };
    },
    metadata: { version: PARALLAX_KIT_VERSION, domain: "parallax", purpose: "2D/2.5D visual-depth motion, layer offsets, wrapping, depth fog, culling, and renderer descriptors." }
  });
}

export const createNParallaxKit = createParallaxKit;
export default createParallaxKit;
