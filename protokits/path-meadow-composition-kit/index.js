import { clamp, createSeededRandom, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const PATH_MEADOW_COMPOSITION_KIT_VERSION = "0.1.0";

const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const round = (value) => Number(number(value).toFixed(4));
const point = (value = {}, fallback = {}) => Object.freeze({
  x: round(value.x ?? fallback.x ?? 0),
  y: round(value.y ?? fallback.y ?? 0),
  z: round(value.z ?? value.y ?? fallback.z ?? fallback.y ?? 0)
});

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function checksum(value) {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function isJsonSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function kit(NexusRealtime, api) {
  return Object.freeze({
    ...api,
    createRuntimeKit(options = {}) {
      return defineInjectedRuntimeKit(NexusRealtime, {
        id: options.id ?? api.id,
        requires: options.requires ?? api.requires ?? [],
        provides: options.provides ?? api.provides ?? [],
        bindings: { [api.apiName ?? api.id]: api },
        metadata: {
          version: PATH_MEADOW_COMPOSITION_KIT_VERSION,
          category: api.category,
          purpose: api.purpose,
          rendererIndependent: true,
          ...(options.metadata ?? {})
        }
      });
    }
  });
}

function samplePath(points, t) {
  const safe = points.length ? points : [point({ x: 0, z: 0 })];
  const scaled = clamp(t, 0, 1) * (safe.length - 1);
  const index = Math.min(safe.length - 2, Math.floor(scaled));
  const local = safe.length === 1 ? 0 : scaled - index;
  const a = safe[index] ?? safe[0];
  const b = safe[index + 1] ?? safe[index] ?? safe[0];
  return point({
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
    z: a.z + (b.z - a.z) * local
  });
}

export function createPathMeadowRouteKit(NexusRealtime = {}, config = {}) {
  const path = Object.freeze({
    id: config.id ?? "path-meadow.route.hero-tree",
    type: "winding-ground-path",
    owns: "walkable focal route and path composition",
    material: config.material ?? "warm-dirt-with-grass-edge",
    width: number(config.width, 3.9),
    texture: Object.freeze({
      pebbleCount: Math.max(24, Math.floor(number(config.pebbleCount, 150))),
      rutCount: Math.max(2, Math.floor(number(config.rutCount, 5))),
      edgeGrassCount: Math.max(12, Math.floor(number(config.edgeGrassCount, 84))),
      dustColor: config.dustColor ?? "rgba(242,178,86,.34)",
      edgeColor: config.edgeColor ?? "rgba(72,102,45,.72)"
    }),
    points: Object.freeze((arr(config.points).length ? arr(config.points) : [
      { x: 0, z: -44 },
      { x: -1.8, z: -31 },
      { x: 1.6, z: -18 },
      { x: -3.4, z: -6 },
      { x: 1.2, z: 7 },
      { x: 0, z: 20 }
    ]).map((entry) => point(entry)))
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-route-kit",
    apiName: "pathMeadowRoute",
    category: "domain-service",
    purpose: "Renderer-agnostic winding meadow path descriptors.",
    provides: ["route:visual-path", "route:path-sampler"],
    requires: ["world:meadow-field"],
    getPathDescriptor: () => path,
    sample: (t = 0) => samplePath(path.points, t)
  });
}

export function createHeroTreeDomainKit(NexusRealtime = {}, config = {}) {
  const tree = Object.freeze({
    id: config.id ?? "path-meadow.hero-tree",
    type: "hero-tree",
    owns: "central focal tree shape, anchors, and canopy descriptors",
    position: point(config.position, { x: 0, y: 0, z: 24 }),
    trunk: {
      radius: number(config.trunkRadius, 1.36),
      height: number(config.trunkHeight, 12.2),
      color: config.trunkColor ?? "#3b2416",
      branchCount: Math.max(5, Math.floor(number(config.branchCount, 20))),
      barkLineCount: Math.max(8, Math.floor(number(config.barkLineCount, 38))),
      rootCount: Math.max(4, Math.floor(number(config.rootCount, 13)))
    },
    shadow: {
      radius: number(config.shadowRadius, 7.2),
      color: config.shadowColor ?? "rgba(24,27,14,.28)",
      dappleCount: Math.max(12, Math.floor(number(config.dappleCount, 64)))
    },
    canopy: {
      radius: number(config.canopyRadius, 13.2),
      height: number(config.canopyHeight, 9.6),
      color: config.canopyColor ?? "#2f4f22",
      highlightColor: config.highlightColor ?? "#d69a3d",
      shadowColor: config.shadowColor ?? "#1e3118",
      leafPalette: Object.freeze(config.leafPalette ?? ["#223719", "#314d24", "#496c2f", "#70883f", "#d39b3d"]),
      lobeCount: Math.max(7, Math.floor(number(config.lobeCount, 26))),
      leafClusterCount: Math.max(20, Math.floor(number(config.leafClusterCount, 136))),
      layerCount: Math.max(3, Math.floor(number(config.canopyLayerCount, 5)))
    },
    interaction: { inspectable: true, label: "Ancient meadow tree", anchorId: "hero-tree-root" }
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "hero-tree-domain-kit",
    apiName: "heroTreeDomain",
    category: "domain-service",
    purpose: "Central hero-tree descriptor with trunk, canopy, roots, and interaction anchor.",
    provides: ["environment:hero-tree", "interaction:hero-anchor"],
    requires: ["world:meadow-field", "route:visual-path"],
    getTreeDescriptor: () => tree
  });
}

export function createPathMeadowPlayerScaleKit(NexusRealtime = {}, config = {}) {
  const descriptor = Object.freeze({
    id: config.id ?? "path-meadow.player-scale",
    type: "third-person-scale-actor",
    owns: "player scale silhouette, readable pose, and foreground composition anchor",
    position: point(config.position, { x: 0, y: 0, z: -33 }),
    height: number(config.height, 2.55),
    color: config.color ?? "#151712",
    highlightColor: config.highlightColor ?? "rgba(255,218,124,.24)",
    facing: config.facing ?? "hero-tree",
    gear: Object.freeze({
      cloak: Boolean(config.cloak ?? true),
      satchel: Boolean(config.satchel ?? true),
      walkingStick: Boolean(config.walkingStick ?? false)
    }),
    interaction: { inspectable: true, label: "Meadow path traveler", anchorId: "player-scale-root" }
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-player-scale-kit",
    apiName: "pathMeadowPlayerScale",
    category: "domain-service",
    purpose: "Reusable third-person player scale descriptor for meadow/world composition proofs.",
    provides: ["actor:scale-reference", "composition:foreground-anchor"],
    requires: ["route:visual-path"],
    getPlayerDescriptor: () => descriptor
  });
}

export function createPathMeadowScatterKit(NexusRealtime = {}, config = {}) {
  const seed = config.seed ?? "path-meadow-scatter";
  const rng = createSeededRandom(seed);
  const count = (key, fallback) => Math.max(0, Math.floor(number(config[key], fallback)));
  function scatter(kind, amount, radius, zMin, zMax, extra = {}) {
    return Object.freeze(Array.from({ length: amount }, (_, index) => {
      const side = rng() > 0.5 ? 1 : -1;
      const z = rng.range(zMin, zMax);
      const centerX = samplePath(createPathMeadowRouteKit(NexusRealtime, config.route ?? {}).getPathDescriptor().points, clamp((z - zMin) / Math.max(1, zMax - zMin), 0, 1)).x;
      return Object.freeze({
        id: `path-meadow.${kind}.${index}`,
        kind,
        x: round(centerX + side * rng.range(radius * 0.35, radius)),
        y: 0,
        z: round(z),
        scale: round(rng.range(0.65, 1.45)),
        color: extra.color,
        accent: extra.accent
      });
    }));
  }
  const descriptor = Object.freeze({
    id: config.id ?? "path-meadow.scatter",
    type: "meadow-scatter-descriptors",
    owns: "renderer-agnostic meadow object placement around the route",
    grass: { density: number(config.grassDensity, 1), bladeCount: count("grassBladeCount", 3600), heightRange: [0.18, 1.85], palettes: ["#2d5c2a", "#5d7f37", "#a9a24f", "#d6b65d"] },
    flowers: scatter("wildflower", count("flowerCount", 420), 18, -42, 28, { color: "#f1d46a", accent: "#c45b9c" }),
    rocks: scatter("moss-rock", count("rockCount", 46), 15, -40, 30, { color: "#68675c", accent: "#b5c18b" }),
    mushrooms: scatter("mushroom", count("mushroomCount", 34), 10, -38, 10, { color: "#b26a34", accent: "#f4c184" }),
    foregroundClusters: scatter("foreground-meadow-cluster", count("foregroundClusterCount", 26), 22, -45, -16, { color: "#e6cc67", accent: "#ef7fb2" }),
    treeLine: scatter("background-tree", count("treeLineCount", 36), 52, 34, 58, { color: "#294026" })
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-scatter-kit",
    apiName: "pathMeadowScatter",
    category: "domain-service",
    purpose: "Seeded rocks, flowers, mushrooms, grass budget, and distant tree-line descriptors.",
    provides: ["scatter:meadow-objects", "vegetation:meadow-descriptors", "environment:tree-line"],
    requires: ["route:visual-path"],
    getScatterDescriptor: () => descriptor
  });
}

export function createPathMeadowGrassKit(NexusRealtime = {}, config = {}) {
  const descriptor = createPathMeadowScatterKit(NexusRealtime, config).getScatterDescriptor().grass;
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-grass-kit",
    apiName: "pathMeadowGrass",
    category: "domain-service",
    purpose: "Procedural meadow grass budget and blade-style descriptors.",
    provides: ["vegetation:grass-descriptors"],
    requires: ["world:meadow-field"],
    getGrassDescriptor: () => Object.freeze({ id: config.id ?? "path-meadow.grass", type: "grass-field", ...descriptor })
  });
}

export function createPathMeadowWildflowerKit(NexusRealtime = {}, config = {}) {
  const descriptor = createPathMeadowScatterKit(NexusRealtime, config).getScatterDescriptor().flowers;
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-wildflower-kit",
    apiName: "pathMeadowWildflower",
    category: "domain-service",
    purpose: "Seeded wildflower placement descriptors around the meadow path.",
    provides: ["vegetation:wildflower-descriptors"],
    requires: ["route:visual-path"],
    getWildflowerDescriptors: () => descriptor
  });
}

export function createPathMeadowRockKit(NexusRealtime = {}, config = {}) {
  const descriptor = createPathMeadowScatterKit(NexusRealtime, config).getScatterDescriptor().rocks;
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-rock-kit",
    apiName: "pathMeadowRock",
    category: "domain-service",
    purpose: "Seeded path-edge rock and boulder descriptors.",
    provides: ["scatter:rock-descriptors"],
    requires: ["route:visual-path"],
    getRockDescriptors: () => descriptor
  });
}

export function createPathMeadowMushroomKit(NexusRealtime = {}, config = {}) {
  const descriptor = createPathMeadowScatterKit(NexusRealtime, config).getScatterDescriptor().mushrooms;
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-mushroom-kit",
    apiName: "pathMeadowMushroom",
    category: "domain-service",
    purpose: "Seeded small mushroom descriptors for close-ground meadow detail.",
    provides: ["scatter:mushroom-descriptors"],
    requires: ["route:visual-path"],
    getMushroomDescriptors: () => descriptor
  });
}

export function createPathMeadowTreeLineKit(NexusRealtime = {}, config = {}) {
  const descriptor = createPathMeadowScatterKit(NexusRealtime, config).getScatterDescriptor().treeLine;
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-tree-line-kit",
    apiName: "pathMeadowTreeLine",
    category: "domain-service",
    purpose: "Seeded distant tree-line descriptors for horizon depth.",
    provides: ["environment:tree-line-descriptors"],
    requires: ["atmosphere:golden-hour"],
    getTreeLineDescriptors: () => descriptor
  });
}

export function createPathMeadowForegroundClusterKit(NexusRealtime = {}, config = {}) {
  const descriptor = createPathMeadowScatterKit(NexusRealtime, config).getScatterDescriptor().foregroundClusters;
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-foreground-cluster-kit",
    apiName: "pathMeadowForegroundCluster",
    category: "domain-service",
    purpose: "Seeded foreground vegetation cluster descriptors for dense meadow framing.",
    provides: ["scatter:foreground-cluster-descriptors"],
    requires: ["route:visual-path"],
    getForegroundClusterDescriptors: () => descriptor
  });
}

export function createPathMeadowAtmosphereKit(NexusRealtime = {}, config = {}) {
  const descriptor = Object.freeze({
    id: config.id ?? "path-meadow.atmosphere.golden-hour",
    type: "golden-hour-atmosphere",
    owns: "sun, haze, sky gradient, distant hills, and exposure intent",
    sun: { x: number(config.sunX, 0.78), y: number(config.sunY, 0.22), radius: number(config.sunRadius, 0.075), color: "#ffd27a" },
    sky: { zenith: "#6fa5d8", horizon: "#ffd18a", haze: "#f5c679" },
    hills: Object.freeze([
      { id: "hill.near", y: 0.43, color: "#7d8d62", alpha: 0.48 },
      { id: "hill.far", y: 0.35, color: "#506f6d", alpha: 0.32 }
    ]),
    clouds: Object.freeze([
      { id: "cloud.left-soft", x: 0.18, y: 0.18, scale: 1.1, alpha: 0.16 },
      { id: "cloud.mid-high", x: 0.46, y: 0.13, scale: 0.72, alpha: 0.12 },
      { id: "cloud.sun-wisp", x: 0.72, y: 0.2, scale: 0.9, alpha: 0.18 }
    ]),
    hazeBands: Object.freeze([
      { id: "haze.horizon", y: 0.39, height: 0.11, color: "rgba(255,211,142,.18)" },
      { id: "haze.midfield", y: 0.52, height: 0.16, color: "rgba(244,204,126,.12)" }
    ]),
    rays: { count: Math.max(3, Math.floor(number(config.rayCount, 9))), color: "rgba(255,212,126,.18)", spread: number(config.raySpread, 0.42) },
    ground: { near: "#6f8b52", mid: "#91aa5c", far: "#b4b978", shadow: "rgba(38,55,24,.22)" },
    exposure: number(config.exposure, 1.08),
    mood: "warm-cinematic-meadow"
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-atmosphere-kit",
    apiName: "pathMeadowAtmosphere",
    category: "domain-service",
    purpose: "Renderer-agnostic golden-hour sky, haze, sun, and hill descriptors.",
    provides: ["atmosphere:golden-hour", "lighting:sun-descriptor", "environment:horizon-depth"],
    requires: [],
    getAtmosphereDescriptor: () => descriptor
  });
}

export function createPathMeadowCloudLayerKit(NexusRealtime = {}, config = {}) {
  const descriptor = createPathMeadowAtmosphereKit(NexusRealtime, config).getAtmosphereDescriptor();
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-cloud-layer-kit",
    apiName: "pathMeadowCloudLayer",
    category: "domain-service",
    purpose: "Renderer-agnostic cloud and haze band descriptors for painterly meadow depth.",
    provides: ["atmosphere:cloud-layer-descriptors", "atmosphere:haze-band-descriptors"],
    requires: ["atmosphere:golden-hour"],
    getCloudDescriptors: () => descriptor.clouds,
    getHazeBandDescriptors: () => descriptor.hazeBands
  });
}

export function createPathMeadowVisualPaletteKit(NexusRealtime = {}, config = {}) {
  const descriptor = Object.freeze({
    id: config.id ?? "path-meadow.visual-palette",
    type: "painterly-meadow-visual-palette",
    owns: "renderer-agnostic color, material, contrast, and painterly lighting intent",
    path: Object.freeze({
      shadow: config.pathShadow ?? "rgba(64,43,24,.34)",
      near: config.pathNear ?? "rgba(238,170,78,.94)",
      mid: config.pathMid ?? "rgba(192,126,54,.82)",
      far: config.pathFar ?? "rgba(116,79,39,.66)",
      edgeHighlight: config.pathEdgeHighlight ?? "rgba(255,234,151,.42)",
      rut: config.pathRut ?? "rgba(91,58,28,.28)"
    }),
    tree: Object.freeze({
      barkDark: config.barkDark ?? "#22140b",
      barkMid: config.barkMid ?? "#593819",
      barkLight: config.barkLight ?? "#9a672e",
      branch: config.branch ?? "rgba(50,30,12,.58)",
      canopyOutline: config.canopyOutline ?? "rgba(28,48,19,.42)",
      rim: config.canopyRim ?? "rgba(238,175,66,.38)"
    }),
    atmosphere: Object.freeze({
      warmth: config.warmth ?? "rgba(255,200,102,.14)",
      coolShadow: config.coolShadow ?? "rgba(43,78,80,.08)",
      foregroundContrast: number(config.foregroundContrast, 1.12),
      haze: config.haze ?? "rgba(255,221,151,.12)"
    }),
    post: Object.freeze({
      vignette: config.vignette ?? "rgba(16,21,10,.28)",
      bloom: config.bloom ?? "rgba(255,222,145,.18)",
      grainAlpha: number(config.grainAlpha, 0.045)
    })
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-visual-palette-kit",
    apiName: "pathMeadowVisualPalette",
    category: "domain-service",
    purpose: "Renderer-agnostic painterly lighting and material palette for meadow composition proofs.",
    provides: ["visual:painterly-palette", "lighting:painterly-grade"],
    requires: ["scene:path-meadow"],
    getVisualPaletteDescriptor: () => descriptor
  });
}

export function createPathMeadowDepthCueKit(NexusRealtime = {}, config = {}) {
  const descriptor = Object.freeze({
    id: config.id ?? "path-meadow.depth-cues",
    type: "meadow-depth-cue-descriptors",
    owns: "foreground framing, atmospheric perspective, cast shadow, and focal depth intent",
    foregroundFrame: Object.freeze({
      bladeCount: Math.max(12, Math.floor(number(config.foregroundBladeCount, 92))),
      leftDensity: number(config.leftDensity, 0.64),
      rightDensity: number(config.rightDensity, 0.72),
      colorDark: config.colorDark ?? "rgba(38,76,31,.78)",
      colorWarm: config.colorWarm ?? "rgba(211,184,78,.62)",
      flowerAccent: config.flowerAccent ?? "rgba(242,123,172,.7)"
    }),
    castShadow: Object.freeze({
      treeLength: number(config.treeShadowLength, 10.5),
      pathContact: config.pathContact ?? "rgba(61,49,23,.18)",
      treeContact: config.treeContact ?? "rgba(25,31,12,.32)"
    }),
    atmosphericPerspective: Object.freeze({
      horizonWash: config.horizonWash ?? "rgba(255,224,160,.18)",
      midgroundWash: config.midgroundWash ?? "rgba(238,205,128,.1)",
      distantSoftness: number(config.distantSoftness, 0.62)
    }),
    focalLight: Object.freeze({
      treeRimStrength: number(config.treeRimStrength, 0.52),
      pathGuideStrength: number(config.pathGuideStrength, 0.34),
      playerSeparation: number(config.playerSeparation, 0.28)
    })
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-depth-cue-kit",
    apiName: "pathMeadowDepthCue",
    category: "domain-service",
    purpose: "Renderer-agnostic 2.5D depth, foreground framing, and focal-light cues for meadow proofs.",
    provides: ["visual:depth-cues", "composition:foreground-frame"],
    requires: ["scene:path-meadow", "visual:painterly-palette"],
    getDepthCueDescriptor: () => descriptor
  });
}

export function createPathMeadowCel3DStyleKit(NexusRealtime = {}, config = {}) {
  const descriptor = Object.freeze({
    id: config.id ?? "path-meadow.cel-3d-style",
    type: "cel-shaded-3d-style",
    owns: "renderer-agnostic 3D camera, cel light bands, outlines, and material response",
    camera: Object.freeze({
      mode: "low-third-person-3d",
      position: point(config.cameraPosition, { x: 0, y: 5.4, z: -52 }),
      target: point(config.cameraTarget, { x: 0, y: 5.2, z: 24 }),
      fov: number(config.fov, 46),
      near: number(config.near, 0.1),
      far: number(config.far, 170)
    }),
    light: Object.freeze({
      direction: point(config.lightDirection, { x: -0.48, y: 0.82, z: -0.3 }),
      bands: Object.freeze(config.bands ?? [0.18, 0.42, 0.68, 0.9]),
      shadowBands: Object.freeze(config.shadowBands ?? ["#172015", "#2b401f", "#66843c", "#d69a3d"]),
      rimColor: config.rimColor ?? "#ffd37a",
      rimStrength: number(config.rimStrength, 0.38)
    }),
    outline: Object.freeze({
      enabled: Boolean(config.outlineEnabled ?? true),
      width: number(config.outlineWidth, 0.2),
      color: config.outlineColor ?? "#10170d",
      nearBoost: number(config.outlineNearBoost, 1.2),
      heroTreeBoost: number(config.heroTreeOutlineBoost, 0.95),
      foregroundBoost: number(config.foregroundOutlineBoost, 0.72)
    }),
    atmosphereGrade: Object.freeze({
      sunGlow: config.sunGlow ?? "rgba(255,205,94,.34)",
      horizonWarmth: config.horizonWarmth ?? "rgba(244,186,92,.26)",
      foregroundWarmth: config.foregroundWarmth ?? "rgba(255,223,132,.16)",
      vignette: config.vignette ?? "rgba(19,27,12,.28)"
    }),
    materials: Object.freeze({
      grass: Object.freeze({ base: "#5e8038", shade: "#263b1e", highlight: "#d1b85f" }),
      flower: Object.freeze({ base: "#d85d9a", shade: "#6b2856", highlight: "#f4d976" }),
      rock: Object.freeze({ base: "#777568", shade: "#3c3e35", highlight: "#c3c799" }),
      mushroom: Object.freeze({ base: "#b96d34", shade: "#4b2718", highlight: "#f0c085" }),
      path: Object.freeze({ base: "#c8873f", shade: "#5b341d", highlight: "#f1bd67" }),
      bark: Object.freeze({ base: "#5b3719", shade: "#1f1209", highlight: "#9b672d" }),
      leaf: Object.freeze({ base: "#3f612a", shade: "#1a2e16", highlight: "#d0993d" }),
      sky: Object.freeze({ base: "#7fb2dc", shade: "#496f88", highlight: "#ffd18a" })
    })
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-cel-3d-style-kit",
    apiName: "pathMeadowCel3DStyle",
    category: "presentation-service",
    purpose: "Renderer-agnostic cel-shaded 3D style policy for the path meadow proof.",
    provides: ["visual:cel-shaded-3d-style", "camera:3d-low-third-person", "lighting:cel-bands"],
    requires: ["scene:path-meadow", "visual:painterly-palette"],
    getCel3DStyleDescriptor: () => descriptor
  });
}

export function createPathMeadowEntityGenerationKit(NexusRealtime = {}, config = {}) {
  const descriptor = Object.freeze({
    id: config.id ?? "path-meadow.entity-generation",
    type: "entity-generation-ratios",
    owns: "per-entity generation budgets, spacing rules, LOD intent, and instancing ratios",
    seed: config.seed ?? "path-meadow",
    ratios: Object.freeze({
      grass: Object.freeze({ kit: "path-meadow-grass-kit", target: Math.max(600, Math.floor(number(config.grassTarget, 3600))), scaleMin: 0.18, scaleMax: 1.85, lod: "instanced-blades" }),
      wildflower: Object.freeze({ kit: "path-meadow-wildflower-kit", target: Math.max(24, Math.floor(number(config.flowerTarget, 420))), pathBias: 0.74, colorRatio: [0.48, 0.34, 0.18], lod: "petal-cross" }),
      rock: Object.freeze({ kit: "path-meadow-rock-kit", target: Math.max(4, Math.floor(number(config.rockTarget, 46))), pathBias: 0.62, sizeRatio: [0.64, 0.28, 0.08], lod: "low-poly-lump" }),
      mushroom: Object.freeze({ kit: "path-meadow-mushroom-kit", target: Math.max(2, Math.floor(number(config.mushroomTarget, 34))), clusterRatio: 0.42, sizeRatio: [0.7, 0.24, 0.06], lod: "cap-stem" }),
      foregroundCluster: Object.freeze({ kit: "path-meadow-foreground-cluster-kit", target: Math.max(4, Math.floor(number(config.foregroundClusterTarget, 26))), nearCameraBias: 0.82, densityRatio: [0.5, 0.32, 0.18], lod: "hero-foreground-card" }),
      treeLine: Object.freeze({ kit: "path-meadow-tree-line-kit", target: Math.max(6, Math.floor(number(config.treeLineTarget, 36))), horizonBias: 0.9, sizeRatio: [0.42, 0.38, 0.2], lod: "distant-billboard-tree" }),
      heroTree: Object.freeze({ kit: "hero-tree-domain-kit", target: 1, branchToCanopyRatio: number(config.branchToCanopyRatio, 0.76), rootToTrunkRatio: number(config.rootToTrunkRatio, 0.42), lod: "hero-low-poly-tree" }),
      path: Object.freeze({ kit: "path-meadow-route-kit", target: 1, segmentRatio: number(config.pathSegmentRatio, 1), textureRatio: number(config.pathTextureRatio, 1.3), lod: "ribbon-mesh" })
    }),
    streaming: Object.freeze({
      partitionBy: "entity-type",
      updateMode: "snapshot-delta-ready",
      idempotentSeed: config.seed ?? "path-meadow",
      reset: "deterministic-from-seed"
    })
  });
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-entity-generation-kit",
    apiName: "pathMeadowEntityGeneration",
    category: "domain-service",
    purpose: "Atomic per-entity generation ratios for reusable 3D meadow composition.",
    provides: ["generation:entity-ratios", "stream:entity-partitions"],
    requires: ["scene:path-meadow"],
    getEntityGenerationDescriptor: () => descriptor
  });
}

export function createPathMeadowCompositionKit(NexusRealtime = {}, config = {}) {
  const route = createPathMeadowRouteKit(NexusRealtime, config.route ?? config);
  const heroTree = createHeroTreeDomainKit(NexusRealtime, config.heroTree ?? config);
  const player = createPathMeadowPlayerScaleKit(NexusRealtime, config.player ?? config);
  const scatter = createPathMeadowScatterKit(NexusRealtime, { ...(config.scatter ?? {}), seed: config.seed ?? "path-meadow", route: config.route ?? config });
  const atmosphere = createPathMeadowAtmosphereKit(NexusRealtime, config.atmosphere ?? {});
  const visualPalette = createPathMeadowVisualPaletteKit(NexusRealtime, config.visualPalette ?? {});
  const depthCue = createPathMeadowDepthCueKit(NexusRealtime, config.depthCue ?? {});
  const cel3D = createPathMeadowCel3DStyleKit(NexusRealtime, config.cel3D ?? {});
  const entityGeneration = createPathMeadowEntityGenerationKit(NexusRealtime, { ...(config.entityGeneration ?? {}), seed: config.seed ?? "path-meadow" });
  function getComposition() {
    const composition = Object.freeze({
      id: config.id ?? "path-meadow.hero-tree-composition",
      type: "path-meadow-composition",
      targetPrompt: "Full 3D cel-shaded central hero tree meadow with a winding textured path, foreground player, rocks, mushrooms, wildflowers, dense grass, foreground frame, distant tree line, clouds, depth cues, entity generation ratios, and golden-hour lighting.",
      kits: Object.freeze(["path-meadow-route-kit", "hero-tree-domain-kit", "path-meadow-player-scale-kit", "path-meadow-scatter-kit", "path-meadow-foreground-cluster-kit", "path-meadow-atmosphere-kit", "path-meadow-cloud-layer-kit", "path-meadow-visual-palette-kit", "path-meadow-depth-cue-kit", "path-meadow-cel-3d-style-kit", "path-meadow-entity-generation-kit"]),
      camera: { mode: "low-third-person-3d", x: 0, y: 5.4, z: -52, targetX: 0, targetY: 5.2, targetZ: 24, fov: 46 },
      player: player.getPlayerDescriptor(),
      route: route.getPathDescriptor(),
      heroTree: heroTree.getTreeDescriptor(),
      scatter: scatter.getScatterDescriptor(),
      atmosphere: atmosphere.getAtmosphereDescriptor(),
      visualPalette: visualPalette.getVisualPaletteDescriptor(),
      depthCue: depthCue.getDepthCueDescriptor(),
      cel3D: cel3D.getCel3DStyleDescriptor(),
      entityGeneration: entityGeneration.getEntityGenerationDescriptor(),
      snapshot: { serializable: true, reset: "deterministic-from-seed", version: PATH_MEADOW_COMPOSITION_KIT_VERSION }
    });
    return composition;
  }
  function getElementBreakdown() {
    const c = getComposition();
    return Object.freeze([
      { id: "hero-tree", domain: "environment", kit: "hero-tree-domain-kit", role: "central focal object", count: 1, descriptor: c.heroTree.id },
      { id: "winding-path", domain: "route", kit: "path-meadow-route-kit", role: "readable traversal line", count: c.route.points.length, descriptor: c.route.id },
      { id: "path-texture", domain: "route", kit: "path-meadow-route-kit", role: "dirt ruts, pebbles, and grass edge readability", count: c.route.texture.pebbleCount + c.route.texture.edgeGrassCount, descriptor: c.route.id },
      { id: "player-silhouette", domain: "actor", kit: "path-meadow-player-scale-kit", role: "scale and third-person framing", count: 1, descriptor: c.player.id },
      { id: "wildflowers", domain: "vegetation", kit: "path-meadow-wildflower-kit", role: "foreground detail and color", count: c.scatter.flowers.length, descriptor: c.scatter.id },
      { id: "rocks", domain: "scatter", kit: "path-meadow-rock-kit", role: "path edge composition", count: c.scatter.rocks.length, descriptor: c.scatter.id },
      { id: "mushrooms", domain: "scatter", kit: "path-meadow-mushroom-kit", role: "near-ground detail", count: c.scatter.mushrooms.length, descriptor: c.scatter.id },
      { id: "foreground-clusters", domain: "scatter", kit: "path-meadow-foreground-cluster-kit", role: "near-camera meadow density", count: c.scatter.foregroundClusters.length, descriptor: c.scatter.id },
      { id: "grass", domain: "vegetation", kit: "path-meadow-grass-kit", role: "meadow volume", count: c.scatter.grass.bladeCount, descriptor: c.scatter.id },
      { id: "tree-line", domain: "environment", kit: "path-meadow-tree-line-kit", role: "horizon depth", count: c.scatter.treeLine.length, descriptor: c.scatter.id },
      { id: "sun-haze-hills", domain: "atmosphere", kit: "path-meadow-atmosphere-kit", role: "golden-hour fidelity", count: c.atmosphere.hills.length + 1, descriptor: c.atmosphere.id },
      { id: "cloud-haze-layers", domain: "atmosphere", kit: "path-meadow-cloud-layer-kit", role: "sky depth and painterly haze bands", count: c.atmosphere.clouds.length + c.atmosphere.hazeBands.length, descriptor: c.atmosphere.id },
      { id: "visual-palette", domain: "presentation", kit: "path-meadow-visual-palette-kit", role: "painterly material and lighting intent", count: 1, descriptor: c.visualPalette.id },
      { id: "depth-cues", domain: "presentation", kit: "path-meadow-depth-cue-kit", role: "foreground frame, cast shadows, and atmospheric depth", count: c.depthCue.foregroundFrame.bladeCount, descriptor: c.depthCue.id },
      { id: "cel-3d-style", domain: "presentation", kit: "path-meadow-cel-3d-style-kit", role: "3D cel bands, outlines, camera, and light policy", count: c.cel3D.light.bands.length, descriptor: c.cel3D.id },
      { id: "entity-generation-ratios", domain: "streaming", kit: "path-meadow-entity-generation-kit", role: "per-entity budgets, LOD intent, and generation ratios", count: Object.keys(c.entityGeneration.ratios).length, descriptor: c.entityGeneration.id }
    ]);
  }
  function validateComposition(composition = getComposition()) {
    const checks = {
      hasHeroTree: Boolean(composition.heroTree?.position),
      hasPath: (composition.route?.points?.length ?? 0) >= 4,
      hasPathTexture: (composition.route?.texture?.pebbleCount ?? 0) > 20,
      hasPlayer: Boolean(composition.player),
      hasFlowers: (composition.scatter?.flowers?.length ?? 0) > 20,
      hasRocks: (composition.scatter?.rocks?.length ?? 0) > 4,
      hasMushrooms: (composition.scatter?.mushrooms?.length ?? 0) > 2,
      hasForegroundClusters: (composition.scatter?.foregroundClusters?.length ?? 0) > 4,
      hasTreeLine: (composition.scatter?.treeLine?.length ?? 0) > 4,
      hasAtmosphere: Boolean(composition.atmosphere?.sun),
      hasClouds: (composition.atmosphere?.clouds?.length ?? 0) > 0,
      hasVisualPalette: Boolean(composition.visualPalette?.path?.near),
      hasDepthCues: Boolean(composition.depthCue?.foregroundFrame?.bladeCount),
      hasCel3DStyle: Boolean(composition.cel3D?.light?.bands?.length),
      hasEntityGenerationRatios: Boolean(composition.entityGeneration?.ratios?.grass?.target)
    };
    const score = Object.values(checks).filter(Boolean).length;
    return Object.freeze({ ...checks, score, passed: score === Object.keys(checks).length });
  }
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-composition-kit",
    apiName: "pathMeadowComposition",
    category: "mode",
    purpose: "Composes path, hero tree, player scale, scatter, atmosphere, 3D cel style, generation ratios, camera, and element breakdown descriptors for a central-tree meadow proof.",
    provides: ["scene:path-meadow", "composition:element-breakdown", "visual:fidelity-target", "visual:cel-shaded-3d-style", "generation:entity-ratios"],
    requires: ["route:visual-path", "environment:hero-tree", "scatter:meadow-objects", "atmosphere:golden-hour"],
    getComposition,
    getElementBreakdown,
    validateComposition
  });
}

function streamChecksumPayload(packet) {
  return {
    id: packet.id,
    type: packet.type,
    owner: packet.owner,
    sequence: packet.sequence,
    version: packet.version,
    atomic: packet.atomic,
    idempotent: packet.idempotent,
    mode: packet.mode,
    provides: packet.provides,
    requires: packet.requires,
    snapshot: packet.snapshot,
    delta: packet.delta,
    reset: packet.reset
  };
}

export function createPathMeadowDescriptorStreamPacket(options = {}) {
  const packet = {
    id: options.id ?? "path-meadow.descriptor-stream.snapshot",
    type: "path-meadow-descriptor-stream-packet",
    owner: options.owner ?? "path-meadow-data-stream-kit",
    sequence: Math.max(0, Math.floor(number(options.sequence, 0))),
    version: options.version ?? PATH_MEADOW_COMPOSITION_KIT_VERSION,
    atomic: true,
    idempotent: true,
    mode: "snapshot",
    provides: Object.freeze(arr(options.provides).length ? arr(options.provides) : ["stream:path-meadow-descriptors"]),
    requires: Object.freeze(arr(options.requires).length ? arr(options.requires) : ["scene:path-meadow"]),
    snapshot: options.snapshot ?? {},
    delta: Object.freeze(arr(options.delta)),
    reset: options.reset ?? "deterministic-from-seed",
    createdAt: 0
  };
  return Object.freeze({ ...packet, checksum: checksum(streamChecksumPayload(packet)) });
}

export function validatePathMeadowDescriptorStreamPacket(packet) {
  const expected = packet ? checksum(streamChecksumPayload(packet)) : "";
  const checks = Object.freeze({
    hasId: Boolean(packet?.id),
    hasOwner: Boolean(packet?.owner),
    hasVersion: packet?.version === PATH_MEADOW_COMPOSITION_KIT_VERSION,
    isAtomic: packet?.atomic === true,
    isIdempotent: packet?.idempotent === true,
    isSnapshotMode: packet?.mode === "snapshot",
    isSerializable: isJsonSerializable(packet?.snapshot),
    checksumMatches: packet?.checksum === expected,
    hasResetContract: packet?.reset === "deterministic-from-seed",
    hasEntityGeneration: Boolean(packet?.snapshot?.composition?.entityGeneration?.ratios)
  });
  const score = Object.values(checks).filter(Boolean).length;
  return Object.freeze({ ...checks, score, passed: score === Object.keys(checks).length });
}

export function createPathMeadowDataStreamKit(NexusRealtime = {}, config = {}) {
  const compositionKit = createPathMeadowCompositionKit(NexusRealtime, config);
  function getSnapshot() {
    const composition = compositionKit.getComposition();
    return Object.freeze({
      id: "path-meadow.snapshot",
      version: PATH_MEADOW_COMPOSITION_KIT_VERSION,
      generatedFrom: Object.freeze({
        seed: config.seed ?? "path-meadow",
        contract: "atomic-idempotent-descriptor-stream"
      }),
      composition,
      breakdown: compositionKit.getElementBreakdown(),
      validation: compositionKit.validateComposition(composition)
    });
  }
  function getStreamPacket() {
    return createPathMeadowDescriptorStreamPacket({
      sequence: config.sequence ?? 0,
      provides: ["stream:path-meadow-descriptors", "atomic:path-meadow-snapshot", "idempotent:path-meadow-reset", "visual:cel-shaded-3d-style", "generation:entity-ratios"],
      requires: ["scene:path-meadow", "visual:cel-shaded-3d-style", "generation:entity-ratios"],
      snapshot: getSnapshot()
    });
  }
  function prepare() {
    const packet = getStreamPacket();
    return Object.freeze({ accepted: validatePathMeadowDescriptorStreamPacket(packet).passed, packet });
  }
  function commit(packet = getStreamPacket()) {
    const validation = validatePathMeadowDescriptorStreamPacket(packet);
    return Object.freeze({ accepted: validation.passed, packet, validation });
  }
  function rollback() {
    const packet = getStreamPacket();
    return Object.freeze({ accepted: true, packet, validation: validatePathMeadowDescriptorStreamPacket(packet) });
  }
  return kit(NexusRealtime, {
    id: config.kitId ?? "path-meadow-data-stream-kit",
    apiName: "pathMeadowDataStream",
    category: "stream-service",
    purpose: "Atomic idempotent descriptor stream for 3D path meadow composition packets.",
    provides: ["stream:path-meadow-descriptors", "atomic:path-meadow-snapshot", "idempotent:path-meadow-reset"],
    requires: ["scene:path-meadow", "visual:cel-shaded-3d-style", "generation:entity-ratios"],
    getSnapshot,
    getStreamPacket,
    validateStreamPacket: validatePathMeadowDescriptorStreamPacket,
    prepare,
    commit,
    reset: getStreamPacket,
    rollback
  });
}

export function createPathMeadowCompositionKits(NexusRealtime = {}, config = {}) {
  return Object.freeze({
    version: PATH_MEADOW_COMPOSITION_KIT_VERSION,
    route: createPathMeadowRouteKit(NexusRealtime, config.route ?? config),
    heroTree: createHeroTreeDomainKit(NexusRealtime, config.heroTree ?? config),
    player: createPathMeadowPlayerScaleKit(NexusRealtime, config.player ?? config),
    grass: createPathMeadowGrassKit(NexusRealtime, config.grass ?? config),
    wildflowers: createPathMeadowWildflowerKit(NexusRealtime, config.wildflowers ?? config),
    rocks: createPathMeadowRockKit(NexusRealtime, config.rocks ?? config),
    mushrooms: createPathMeadowMushroomKit(NexusRealtime, config.mushrooms ?? config),
    foregroundClusters: createPathMeadowForegroundClusterKit(NexusRealtime, config.foregroundClusters ?? config),
    treeLine: createPathMeadowTreeLineKit(NexusRealtime, config.treeLine ?? config),
    scatter: createPathMeadowScatterKit(NexusRealtime, config.scatter ?? config),
    atmosphere: createPathMeadowAtmosphereKit(NexusRealtime, config.atmosphere ?? config),
    cloudLayer: createPathMeadowCloudLayerKit(NexusRealtime, config.cloudLayer ?? config),
    visualPalette: createPathMeadowVisualPaletteKit(NexusRealtime, config.visualPalette ?? config),
    depthCue: createPathMeadowDepthCueKit(NexusRealtime, config.depthCue ?? config),
    cel3D: createPathMeadowCel3DStyleKit(NexusRealtime, config.cel3D ?? config),
    entityGeneration: createPathMeadowEntityGenerationKit(NexusRealtime, config.entityGeneration ?? config),
    dataStream: createPathMeadowDataStreamKit(NexusRealtime, config),
    composition: createPathMeadowCompositionKit(NexusRealtime, config)
  });
}

export default createPathMeadowCompositionKit;
