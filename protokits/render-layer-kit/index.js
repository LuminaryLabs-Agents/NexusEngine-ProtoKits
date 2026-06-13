import {
  asList,
  byId,
  clamp,
  clone,
  defineInjectedRuntimeKit,
  getClockElapsed,
  number
} from "../protokit-core/index.js";

export const RENDER_LAYER_KIT_VERSION = "0.1.0";

export const DEFAULT_RENDER_LAYER_ORDER = Object.freeze([
  "sky",
  "far-fog",
  "terrain",
  "ground-decal",
  "far-static",
  "instanced-scatter",
  "mid-static",
  "near-static",
  "interactive",
  "character",
  "emissive",
  "volumetric-light",
  "transparent-fog",
  "particle",
  "world-ui",
  "overlay-ui"
]);

const DEFAULT_PASS_ORDER = Object.freeze({
  sky: 0,
  opaque: 10,
  decal: 20,
  alpha: 30,
  emissive: 40,
  volumetric: 50,
  particle: 60,
  worldUi: 70,
  overlay: 80
});

export const foglineVisualPreset = Object.freeze({
  id: "fogline-forest",
  quality: "adaptive",
  layerOrder: DEFAULT_RENDER_LAYER_ORDER,
  atmosphere: {
    fogColor: "#102333",
    horizon: "#172b37",
    zenith: "#07111a",
    haze: 0.052,
    groundMist: 0.34,
    vignette: 0.18
  },
  lighting: {
    exposure: 0.96,
    toneMapping: "aces",
    moon: { elevation: 29, azimuth: -36, intensity: 1.3, color: "#b9dcff" },
    hemisphere: { sky: "#274b67", ground: "#142116", intensity: 0.72 }
  },
  defaultMaterials: [
    { id: "fogline-ground", role: "terrain", albedo: "#182018", roughness: 0.92, ao: 0.86, fogReceive: 1 },
    { id: "fogline-bark", role: "static", albedo: "#182015", roughness: 0.88, ao: 0.78, normalStrength: 0.55, fogReceive: 1 },
    { id: "fogline-leaf", role: "static", albedo: "#1e3a23", roughness: 0.82, ao: 0.72, translucency: 0.18, fogReceive: 1 },
    { id: "fogline-stone", role: "static", albedo: "#2b3332", roughness: 0.74, ao: 0.82, normalStrength: 0.35, fogReceive: 1 },
    { id: "relay-emissive", role: "emissive", albedo: "#20373c", emissive: "#77f3ff", bloom: 0.78, roughness: 0.36, fogReceive: 0.55 },
    { id: "gate-emissive", role: "emissive", albedo: "#293032", emissive: "#bafcff", bloom: 0.55, roughness: 0.48, fogReceive: 0.65 },
    { id: "wraith-smoke", role: "transparent", albedo: "#40151c", emissive: "#ff5068", alpha: 0.62, bloom: 0.34, fogReceive: 0.3 },
    { id: "mist-volume", role: "fog", albedo: "#9ec8d7", alpha: 0.16, noiseScale: 0.72, fogReceive: 0 },
    { id: "scan-ring", role: "world-ui", albedo: "#7ee8ff", emissive: "#7ee8ff", alpha: 0.74, bloom: 0.62, fogReceive: 0 }
  ],
  fogVolumes: [
    { id: "forest-ground-mist", type: "ground", layer: "transparent-fog", color: "#9ec8d7", density: 0.18, height: 1.8, noiseScale: 0.85, speed: 0.025 },
    { id: "distance-haze", type: "depth", layer: "far-fog", color: "#102333", density: 0.055, height: 12, noiseScale: 0.35, speed: 0.008 }
  ]
});

function definitionFactory(nexusRealtime = {}) {
  return {
    resource: nexusRealtime.defineResource ?? ((name) => Object.freeze({ kind: "resource", name })),
    event: nexusRealtime.defineEvent ?? ((name) => Object.freeze({ kind: "event", name }))
  };
}

export function createRenderLayerDefinitions(nexusRealtime = {}, options = {}) {
  const { resource, event } = definitionFactory(nexusRealtime);
  const prefix = options.namespace ?? "visual";
  return {
    resources: {
      VisualPipelineState: resource(`${prefix}.pipeline.state`),
      RenderLayerState: resource(`${prefix}.renderLayers.state`),
      MaterialLibraryState: resource(`${prefix}.materialLibrary.state`),
      FogVolumeState: resource(`${prefix}.fogVolumes.state`),
      VolumetricLightState: resource(`${prefix}.volumetricLighting.state`),
      VisualSignalState: resource(`${prefix}.signals.state`),
      VisualValidationState: resource(`${prefix}.validation.state`)
    },
    events: {
      VisualPipelineRebuild: event(`${prefix}.pipeline.rebuild`),
      VisualSignalUpdated: event(`${prefix}.signals.updated`)
    }
  };
}

const materialDefaultsByRole = Object.freeze({
  terrain: { role: "terrain", albedo: "#223025", roughness: 0.9, ao: 0.85, fogReceive: 1 },
  static: { role: "static", albedo: "#2b332c", roughness: 0.84, ao: 0.78, fogReceive: 1 },
  interactive: { role: "interactive", albedo: "#334245", roughness: 0.62, ao: 0.7, fogReceive: 0.8 },
  emissive: { role: "emissive", albedo: "#203840", emissive: "#7ee8ff", bloom: 0.5, roughness: 0.42, fogReceive: 0.55 },
  transparent: { role: "transparent", albedo: "#b8d8e8", alpha: 0.45, roughness: 1, fogReceive: 0.1 },
  fog: { role: "fog", albedo: "#9ec8d7", alpha: 0.18, density: 0.2, fogReceive: 0 },
  particle: { role: "particle", albedo: "#7ee8ff", emissive: "#7ee8ff", alpha: 0.7, fogReceive: 0 },
  worldUi: { role: "world-ui", albedo: "#f8ffff", emissive: "#f8ffff", alpha: 0.8, fogReceive: 0 }
});

function mergePlain(base = {}, override = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override ?? {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && out[key] && typeof out[key] === "object" && !Array.isArray(out[key])) {
      out[key] = mergePlain(out[key], value);
    } else {
      out[key] = clone(value);
    }
  }
  return out;
}

function normalizeMaterial(input = {}, index = 0) {
  const id = input.id ?? input.name ?? `material-${index + 1}`;
  const role = input.role ?? input.type ?? "static";
  const defaults = materialDefaultsByRole[role] ?? materialDefaultsByRole.static;
  return {
    id,
    rendererType: input.rendererType ?? "all",
    ...mergePlain(defaults, input),
    role
  };
}

function createMaterialLibrary({ preset, renderSnapshot, options }) {
  const visualMaterials = [
    ...asList(preset.defaultMaterials),
    ...asList(renderSnapshot?.visual?.materials),
    ...asList(renderSnapshot?.materials),
    ...asList(options.materials)
  ];
  const materials = visualMaterials.map(normalizeMaterial);
  const map = byId(materials);
  return {
    version: RENDER_LAYER_KIT_VERSION,
    materials,
    byId: map,
    roles: materials.reduce((roles, material) => {
      const role = material.role ?? "static";
      if (!roles[role]) roles[role] = [];
      roles[role].push(material.id);
      return roles;
    }, {})
  };
}

function getVisual(object = {}) {
  return object.visual ?? {};
}

function inferLayer(object = {}, visual = {}) {
  if (visual.layer) return visual.layer;
  const archetype = object.archetype ?? object.kind ?? visual.kind;
  if (visual.pass === "overlay") return "overlay-ui";
  if (visual.pass === "worldUi" || archetype === "world-ui" || archetype === "scan-ring") return "world-ui";
  if (visual.pass === "particle" || archetype === "particle") return "particle";
  if (visual.pass === "volumetric" || archetype === "volumetric-light") return "volumetric-light";
  if (visual.pass === "alpha" || visual.transparent || archetype === "fog-volume" || archetype === "mist") return "transparent-fog";
  if (visual.emissive || visual.material === "relay-emissive" || visual.material === "gate-emissive") return "emissive";
  if (object.kit === "interaction-target" || archetype === "relay" || archetype === "gate") return "interactive";
  if (archetype === "terrain" || archetype === "ground") return "terrain";
  if (archetype === "tree" || archetype === "trunk" || archetype === "fern" || archetype === "glow-plant") return "instanced-scatter";
  return "mid-static";
}

function inferPass(layer, visual = {}, material = {}) {
  if (visual.pass) return visual.pass;
  if (layer === "sky") return "sky";
  if (layer === "ground-decal") return "decal";
  if (layer === "transparent-fog" || visual.transparent || number(material.alpha, 1) < 1) return "alpha";
  if (layer === "emissive" || material.emissive || visual.emissive) return "emissive";
  if (layer === "volumetric-light") return "volumetric";
  if (layer === "particle") return "particle";
  if (layer === "world-ui") return "worldUi";
  if (layer === "overlay-ui") return "overlay";
  return "opaque";
}

function materialFor(object = {}, visual = {}, materialLibrary = {}) {
  const requested = visual.material ?? object.material ?? object.metadata?.material;
  if (requested && materialLibrary.byId?.[requested]) return materialLibrary.byId[requested];
  const layer = inferLayer(object, visual);
  if (layer === "terrain") return materialLibrary.byId?.["fogline-ground"] ?? normalizeMaterial({ id: "default-terrain", role: "terrain" });
  if (layer === "emissive") return materialLibrary.byId?.["relay-emissive"] ?? normalizeMaterial({ id: "default-emissive", role: "emissive" });
  if (layer === "transparent-fog") return materialLibrary.byId?.["mist-volume"] ?? normalizeMaterial({ id: "default-fog", role: "fog" });
  if (layer === "world-ui") return materialLibrary.byId?.["scan-ring"] ?? normalizeMaterial({ id: "default-world-ui", role: "worldUi" });
  return materialLibrary.byId?.["fogline-bark"] ?? normalizeMaterial({ id: "default-static", role: "static" });
}

function objectPosition(object = {}) {
  const transform = object.transform ?? object.position ?? {};
  return {
    x: number(transform.x),
    y: number(transform.y),
    z: number(transform.z ?? transform.y)
  };
}

function distanceSq(a = {}, b = {}) {
  const dx = number(a.x) - number(b.x);
  const dy = number(a.y) - number(b.y);
  const dz = number(a.z) - number(b.z);
  return dx * dx + dy * dy + dz * dz;
}

function normalizeObject(object = {}, index, context) {
  const visual = getVisual(object);
  const material = materialFor(object, visual, context.materialLibrary);
  const layer = inferLayer(object, visual);
  const pass = inferPass(layer, visual, material);
  const position = objectPosition(object);
  const layerIndex = context.layerOrder.indexOf(layer);
  const passIndex = DEFAULT_PASS_ORDER[pass] ?? 999;
  const viewerDistanceSq = distanceSq(position, context.viewer);
  const transparent = pass === "alpha" || pass === "volumetric" || pass === "particle";
  const sortBias = number(visual.sortBias ?? object.sortBias, 0);
  return {
    id: object.id ?? `render-object-${index + 1}`,
    source: object.source ?? "scene",
    archetype: object.archetype ?? object.kind ?? "object",
    kit: object.kit ?? null,
    layer,
    layerIndex: layerIndex === -1 ? context.layerOrder.length : layerIndex,
    pass,
    passIndex,
    materialId: material.id,
    mesh: visual.mesh ?? object.mesh ?? object.archetype ?? "billboard",
    position,
    transform: object.transform ?? {},
    visual: { ...visual, material: material.id, layer, pass },
    metadata: object.metadata ?? {},
    transparent,
    emissive: Boolean(material.emissive || visual.emissive),
    alpha: number(visual.alpha, number(material.alpha, 1)),
    sortKey: [
      layerIndex === -1 ? context.layerOrder.length : layerIndex,
      passIndex,
      transparent ? -viewerDistanceSq : viewerDistanceSq,
      sortBias,
      object.id ?? `render-object-${index + 1}`
    ],
    viewerDistanceSq
  };
}

function flattenExtraObjects(world, resources = []) {
  const output = [];
  for (const resource of asList(resources)) {
    const value = world.getResource(resource);
    if (!value) continue;
    const descriptors = value.descriptors ?? value.objects ?? value.items ?? [];
    for (const descriptor of asList(descriptors)) {
      output.push({
        id: descriptor.id,
        source: resource.name,
        archetype: descriptor.kind ?? descriptor.archetype ?? "scatter",
        transform: descriptor.transform ?? { x: descriptor.position?.x, y: descriptor.position?.y, z: descriptor.position?.z, scale: descriptor.scale },
        visual: {
          layer: descriptor.layer ?? "instanced-scatter",
          material: descriptor.material ?? (descriptor.kind === "glow-plant" ? "relay-emissive" : descriptor.kind === "trunk" ? "fogline-bark" : "fogline-leaf"),
          mesh: descriptor.mesh ?? descriptor.kind ?? "scatter-card",
          sortBias: descriptor.sortBias ?? 0
        },
        metadata: descriptor
      });
    }
  }
  return output;
}

function buildBuckets(objects, layerOrder) {
  const buckets = Object.fromEntries(layerOrder.map((layer) => [layer, []]));
  for (const object of objects) {
    if (!buckets[object.layer]) buckets[object.layer] = [];
    buckets[object.layer].push(object);
  }
  for (const bucket of Object.values(buckets)) {
    bucket.sort(compareSortKey);
  }
  return buckets;
}

function compareSortKey(a, b) {
  const ak = a.sortKey ?? [];
  const bk = b.sortKey ?? [];
  const length = Math.max(ak.length, bk.length);
  for (let i = 0; i < length; i += 1) {
    if (ak[i] < bk[i]) return -1;
    if (ak[i] > bk[i]) return 1;
  }
  return 0;
}

function normalizeFogVolume(volume = {}, index, realism = {}) {
  const atmosphere = realism.atmosphere ?? {};
  return {
    id: volume.id ?? `fog-volume-${index + 1}`,
    type: volume.type ?? "local",
    layer: volume.layer ?? "transparent-fog",
    color: volume.color ?? atmosphere.fogColor ?? "#9ec8d7",
    density: clamp(number(volume.density, number(atmosphere.haze, 0.04)), 0, 1),
    height: number(volume.height, 3),
    radius: number(volume.radius, 16),
    noiseScale: number(volume.noiseScale, 0.6),
    speed: number(volume.speed, 0.02),
    position: volume.position ?? objectPosition(volume),
    sourceId: volume.sourceId ?? null,
    active: volume.active !== false
  };
}

function objectToFogVolume(object = {}, index, realism = {}) {
  const visual = object.visual ?? {};
  if (object.archetype !== "fog-volume" && visual.layer !== "transparent-fog" && visual.material !== "mist-volume") return null;
  return normalizeFogVolume({
    id: `${object.id ?? `object-${index}`}:fog`,
    type: visual.fogType ?? object.metadata?.fogType ?? "local",
    color: visual.color ?? object.metadata?.color,
    density: visual.density ?? object.metadata?.density,
    height: visual.height ?? object.metadata?.height,
    radius: visual.radius ?? object.metadata?.radius,
    noiseScale: visual.noiseScale ?? object.metadata?.noiseScale,
    speed: visual.speed ?? object.metadata?.speed,
    position: objectPosition(object),
    sourceId: object.id
  }, index, realism);
}

function buildFogVolumes({ preset, renderObjects, options, realism }) {
  const fromObjects = renderObjects.map((object, index) => objectToFogVolume(object, index, realism)).filter(Boolean);
  return [
    ...asList(preset.fogVolumes).map((volume, index) => normalizeFogVolume(volume, index, realism)),
    ...fromObjects,
    ...asList(options.fogVolumes).map((volume, index) => normalizeFogVolume(volume, index + fromObjects.length, realism))
  ];
}

function signalForSource(signals = {}, sourceId) {
  if (!sourceId) return null;
  const bySource = signals.bySource ?? signals.sources ?? {};
  return bySource[sourceId] ?? signals[sourceId] ?? null;
}

function objectToVolumetricLight(object = {}, index, context = {}) {
  const visual = object.visual ?? {};
  const material = context.materialLibrary.byId?.[visual.material];
  const explicit = object.metadata?.light ?? visual.light ?? null;
  const emissiveColor = explicit?.color ?? visual.emissive ?? material?.emissive;
  if (!emissiveColor && visual.layer !== "volumetric-light") return null;
  const signal = signalForSource(context.signals, object.id);
  const intensity = clamp(number(signal?.intensity, number(explicit?.intensity, number(visual.intensity, number(material?.bloom, 0.45)))), 0, 4);
  if (intensity <= 0.001) return null;
  return {
    id: explicit?.id ?? `${object.id ?? `source-${index}`}:volumetric`,
    sourceId: object.id ?? null,
    type: explicit?.type ?? visual.volumetricType ?? "cone",
    implementation: context.quality === "ultra" ? "short-raymarch" : context.quality === "high" ? "screen-space-shaft" : context.quality === "medium" ? "layered-fog-cards" : "alpha-cone",
    layer: "volumetric-light",
    color: signal?.color ?? emissiveColor ?? "#7ee8ff",
    intensity,
    density: clamp(number(signal?.density, number(explicit?.density, 0.32)), 0, 1),
    length: number(explicit?.length, 18),
    radius: number(explicit?.radius, 4.5),
    noiseScale: number(explicit?.noiseScale, 0.65),
    position: objectPosition(object),
    active: signal?.active ?? explicit?.active ?? true,
    quality: context.quality
  };
}

function normalizeVolumetricLight(light = {}, index, context = {}) {
  return {
    id: light.id ?? `volumetric-light-${index + 1}`,
    sourceId: light.sourceId ?? null,
    type: light.type ?? "cone",
    implementation: light.implementation ?? (context.quality === "high" ? "screen-space-shaft" : "layered-fog-cards"),
    layer: light.layer ?? "volumetric-light",
    color: light.color ?? "#7ee8ff",
    intensity: clamp(number(light.intensity, 0.6), 0, 4),
    density: clamp(number(light.density, 0.3), 0, 1),
    length: number(light.length, 18),
    radius: number(light.radius, 4),
    noiseScale: number(light.noiseScale, 0.7),
    position: light.position ?? objectPosition(light),
    active: light.active !== false,
    quality: light.quality ?? context.quality
  };
}

function buildVolumetricLights({ renderObjects, options, context }) {
  const generated = renderObjects.map((object, index) => objectToVolumetricLight(object, index, context)).filter(Boolean);
  return [
    ...generated,
    ...asList(options.volumetricLights).map((light, index) => normalizeVolumetricLight(light, index + generated.length, context))
  ].filter((light) => light.active !== false);
}

function validateVisuals(renderObjects, materialLibrary, layerOrder) {
  const warnings = [];
  for (const object of renderObjects) {
    if (!object.materialId || !materialLibrary.byId?.[object.materialId]) {
      warnings.push({ type: "missing-material", objectId: object.id, materialId: object.materialId });
    }
    if (!layerOrder.includes(object.layer)) {
      warnings.push({ type: "unknown-layer", objectId: object.id, layer: object.layer });
    }
    if (!object.mesh) {
      warnings.push({ type: "missing-mesh", objectId: object.id });
    }
  }
  return {
    ok: warnings.length === 0,
    warningCount: warnings.length,
    warnings
  };
}

function createInitialState(options = {}) {
  return {
    version: RENDER_LAYER_KIT_VERSION,
    frame: 0,
    status: "ready",
    viewer: options.viewer ?? { x: 0, y: 0, z: 0 },
    signals: {},
    layerOrder: asList(options.layerOrder ?? foglineVisualPreset.layerOrder),
    objectCount: 0,
    bucketCount: 0
  };
}

function qualityFrom(realism = {}, options = {}) {
  return options.quality ?? realism.quality?.id ?? realism.renderer?.quality ?? "medium";
}

function snapshotRenderDescriptor(world, options = {}) {
  if (options.renderDescriptorResource) {
    const value = world.getResource(options.renderDescriptorResource);
    if (value) return value;
  }
  return options.renderDescriptor ?? {
    id: options.id ?? "visual-pipeline",
    objects: options.objects ?? [],
    visual: options.visualDataset ?? {}
  };
}

function snapshotRealism(world, options = {}) {
  if (options.realismSnapshotResource) {
    const value = world.getResource(options.realismSnapshotResource);
    if (value) return value;
  }
  return world.__nexusRealismSnapshot ?? options.realism ?? {};
}

export function createRenderLayerKit(nexusRealtime = {}, options = {}) {
  const definitions = createRenderLayerDefinitions(nexusRealtime, options);
  const { resources, events } = definitions;
  const preset = mergePlain(foglineVisualPreset, options.preset ?? {});
  const layerOrder = asList(options.layerOrder ?? preset.layerOrder ?? DEFAULT_RENDER_LAYER_ORDER);

  function visualPipelineSystem(world) {
    const previous = world.getResource(resources.VisualPipelineState) ?? createInitialState({ ...options, layerOrder });
    const renderSnapshot = snapshotRenderDescriptor(world, options);
    const realism = snapshotRealism(world, options);
    const quality = qualityFrom(realism, options);
    const signals = world.getResource(resources.VisualSignalState) ?? previous.signals ?? {};
    const viewer = previous.viewer ?? options.viewer ?? { x: 0, y: 0, z: 0 };
    const materialLibrary = createMaterialLibrary({ preset, renderSnapshot, options });
    const sceneObjects = [
      ...asList(renderSnapshot.objects ?? renderSnapshot.scene?.objects),
      ...asList(options.objects),
      ...flattenExtraObjects(world, options.extraObjectResources)
    ];
    const context = { layerOrder, materialLibrary, viewer, quality, signals };
    const renderObjects = sceneObjects.map((object, index) => normalizeObject(object, index, context));
    renderObjects.sort(compareSortKey);
    const buckets = buildBuckets(renderObjects, layerOrder);
    const fogVolumes = buildFogVolumes({ preset, renderObjects: sceneObjects, options, realism });
    const volumetricLights = buildVolumetricLights({ renderObjects: sceneObjects, options, context });
    const validation = validateVisuals(renderObjects, materialLibrary, layerOrder);
    const time = getClockElapsed(world, 0);
    const next = {
      ...previous,
      version: RENDER_LAYER_KIT_VERSION,
      frame: number(world.__nexusClock?.frame, previous.frame + 1),
      elapsed: time,
      status: validation.ok ? "ready" : "warning",
      presetId: preset.id,
      quality,
      layerOrder,
      viewer,
      objectCount: renderObjects.length,
      bucketCount: Object.keys(buckets).length,
      materialCount: materialLibrary.materials.length,
      fogVolumeCount: fogVolumes.length,
      volumetricLightCount: volumetricLights.length,
      signals
    };

    world.setResource(resources.MaterialLibraryState, materialLibrary);
    world.setResource(resources.RenderLayerState, {
      version: RENDER_LAYER_KIT_VERSION,
      layerOrder,
      objects: renderObjects,
      buckets,
      drawOrder: layerOrder.flatMap((layer) => buckets[layer] ?? []),
      passes: Object.keys(DEFAULT_PASS_ORDER),
      stats: {
        objectCount: renderObjects.length,
        transparentCount: renderObjects.filter((object) => object.transparent).length,
        emissiveCount: renderObjects.filter((object) => object.emissive).length
      }
    });
    world.setResource(resources.FogVolumeState, {
      version: RENDER_LAYER_KIT_VERSION,
      atmosphere: mergePlain(preset.atmosphere, realism.atmosphere ?? {}),
      fogVolumes
    });
    world.setResource(resources.VolumetricLightState, {
      version: RENDER_LAYER_KIT_VERSION,
      quality,
      implementation: quality === "ultra" ? "short-raymarch" : quality === "high" ? "screen-space-shaft" : quality === "medium" ? "layered-fog-cards" : "alpha-cone",
      lights: volumetricLights
    });
    world.setResource(resources.VisualValidationState, validation);
    world.setResource(resources.VisualPipelineState, next);
  }

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "render-layer-kit",
    resources,
    events,
    systems: [
      { phase: options.phase ?? "resolve", name: "visualPipelineSystem", system: visualPipelineSystem }
    ],
    provides: [
      "visual-pipeline",
      "render-layer",
      "material-library",
      "fog-volume",
      "volumetric-lighting"
    ],
    initWorld({ world }) {
      world.setResource(resources.VisualPipelineState, createInitialState({ ...options, layerOrder }));
      world.setResource(resources.VisualSignalState, {});
    },
    install({ engine, world }) {
      engine.visualPipeline = {
        definitions,
        getState() {
          return world.getResource(resources.VisualPipelineState);
        },
        snapshot() {
          return {
            pipeline: world.getResource(resources.VisualPipelineState),
            layers: world.getResource(resources.RenderLayerState),
            materials: world.getResource(resources.MaterialLibraryState),
            fog: world.getResource(resources.FogVolumeState),
            volumetric: world.getResource(resources.VolumetricLightState),
            validation: world.getResource(resources.VisualValidationState)
          };
        },
        setViewer(viewer = {}) {
          const state = world.getResource(resources.VisualPipelineState) ?? createInitialState({ ...options, layerOrder });
          state.viewer = { ...state.viewer, ...viewer };
          world.setResource(resources.VisualPipelineState, state);
          return state;
        },
        setSignals(signals = {}) {
          world.setResource(resources.VisualSignalState, clone(signals));
          world.emit(events.VisualSignalUpdated, { signals });
          return world.getResource(resources.VisualSignalState);
        },
        rebuild(payload = {}) {
          world.emit(events.VisualPipelineRebuild, payload);
          engine.tick?.(0);
          return this.snapshot();
        },
        bucket(layer) {
          return world.getResource(resources.RenderLayerState)?.buckets?.[layer] ?? [];
        },
        material(id) {
          return world.getResource(resources.MaterialLibraryState)?.byId?.[id] ?? null;
        },
        validate() {
          return world.getResource(resources.VisualValidationState);
        }
      };
    },
    metadata: {
      version: RENDER_LAYER_KIT_VERSION,
      purpose: "Renderer-agnostic visual composition, layer sorting, material library, fog volumes, and cheap volumetric light descriptors."
    }
  });
}

export const createVisualPipelineKit = createRenderLayerKit;

export function createFoglineVisualPreset(overrides = {}) {
  return mergePlain(foglineVisualPreset, overrides);
}

export function createMaterialLibrarySnapshot(input = {}) {
  return createMaterialLibrary({
    preset: input.preset ?? foglineVisualPreset,
    renderSnapshot: input.renderSnapshot ?? {},
    options: input.options ?? input
  });
}

export function createRenderLayerSnapshot(input = {}) {
  const preset = mergePlain(foglineVisualPreset, input.preset ?? {});
  const layerOrder = asList(input.layerOrder ?? preset.layerOrder ?? DEFAULT_RENDER_LAYER_ORDER);
  const materialLibrary = createMaterialLibrary({
    preset,
    renderSnapshot: input.renderSnapshot ?? {},
    options: input
  });
  const context = {
    layerOrder,
    materialLibrary,
    viewer: input.viewer ?? { x: 0, y: 0, z: 0 },
    quality: input.quality ?? "medium",
    signals: input.signals ?? {}
  };
  const renderObjects = asList(input.objects ?? input.renderSnapshot?.objects ?? input.renderSnapshot?.scene?.objects)
    .map((object, index) => normalizeObject(object, index, context))
    .sort(compareSortKey);
  const buckets = buildBuckets(renderObjects, layerOrder);
  return {
    version: RENDER_LAYER_KIT_VERSION,
    layerOrder,
    objects: renderObjects,
    buckets,
    drawOrder: layerOrder.flatMap((layer) => buckets[layer] ?? [])
  };
}
