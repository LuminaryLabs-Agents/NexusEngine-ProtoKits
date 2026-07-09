export const MEADOW_AREA_KIT_VERSION = "0.1.0";

const TAU = Math.PI * 2;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function bool(value, fallback = false) {
  return value == null ? fallback : Boolean(value);
}

function round(value, places = 4) {
  const scale = 10 ** places;
  return Math.round(number(value) * scale) / scale;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function hashString(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function createRandom(seed = "meadow-area") {
  let state = hashString(seed) || 1;
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
  random.range = (min, max) => number(min) + (number(max) - number(min)) * random();
  random.pick = (items, fallback = null) => items[Math.floor(random() * items.length)] ?? fallback;
  return random;
}

function point(value = {}, fallback = {}) {
  return Object.freeze({
    x: round(value.x ?? fallback.x ?? 0),
    y: round(value.y ?? fallback.y ?? 0),
    z: round(value.z ?? value.y ?? fallback.z ?? fallback.y ?? 0)
  });
}

function normalizeArea(config = {}) {
  const source = config.area ?? {};
  return Object.freeze({
    id: String(source.id ?? config.id ?? "meadow-area"),
    anchor: point(source.anchor, { x: 0, y: 0, z: 0 }),
    width: Math.max(1, number(source.width, 90)),
    depth: Math.max(1, number(source.depth, 110)),
    coordinateSpace: source.coordinateSpace ?? "world"
  });
}

function normalizePath(feature = {}, area) {
  const defaultPoints = [
    { x: area.anchor.x, z: area.anchor.z - area.depth * 0.58 },
    { x: area.anchor.x - 1.8, z: area.anchor.z - area.depth * 0.42 },
    { x: area.anchor.x + 1.6, z: area.anchor.z - area.depth * 0.25 },
    { x: area.anchor.x - 3.4, z: area.anchor.z - area.depth * 0.08 },
    { x: area.anchor.x + 1.2, z: area.anchor.z + area.depth * 0.1 },
    { x: area.anchor.x, z: area.anchor.z + area.depth * 0.22 }
  ];
  const points = (Array.isArray(feature.points) && feature.points.length >= 2 ? feature.points : defaultPoints).map((entry) => point(entry));
  return Object.freeze({
    enabled: bool(feature.enabled, true),
    width: Math.max(0.6, number(feature.width, 3.9)),
    points: Object.freeze(points),
    pebbleCount: Math.max(0, Math.floor(number(feature.pebbleCount, 150))),
    rutCount: Math.max(0, Math.floor(number(feature.rutCount, 5))),
    edgeGrassCount: Math.max(0, Math.floor(number(feature.edgeGrassCount, 84)))
  });
}

function normalizeStyle(style = {}) {
  return Object.freeze({
    timeOfDay: style.timeOfDay ?? "golden-hour",
    renderStyle: style.renderStyle ?? "painterly-cel-3d",
    camera: Object.freeze({
      position: point(style.camera?.position, { x: 0, y: 5.4, z: -52 }),
      target: point(style.camera?.target, { x: 0, y: 5.2, z: 24 }),
      fov: number(style.camera?.fov, 46),
      near: number(style.camera?.near, 0.1),
      far: number(style.camera?.far, 170)
    }),
    light: Object.freeze({
      direction: point(style.light?.direction, { x: -0.48, y: 0.82, z: -0.3 }),
      rimColor: style.light?.rimColor ?? "#ffd37a",
      rimStrength: number(style.light?.rimStrength, 0.38),
      outlineColor: style.light?.outlineColor ?? "#10170d",
      outlineWidth: number(style.light?.outlineWidth, 0.18)
    }),
    materials: Object.freeze({
      grass: Object.freeze({ base: "#5e8038", shade: "#263b1e", highlight: "#d1b85f", ...(style.materials?.grass ?? {}) }),
      flower: Object.freeze({ base: "#d85d9a", shade: "#6b2856", highlight: "#f4d976", ...(style.materials?.flower ?? {}) }),
      rock: Object.freeze({ base: "#777568", shade: "#3c3e35", highlight: "#c3c799", ...(style.materials?.rock ?? {}) }),
      mushroom: Object.freeze({ base: "#b96d34", shade: "#4b2718", highlight: "#f0c085", ...(style.materials?.mushroom ?? {}) }),
      path: Object.freeze({ base: "#c8873f", shade: "#5b341d", highlight: "#f1bd67", ...(style.materials?.path ?? {}) }),
      bark: Object.freeze({ base: "#5b3719", shade: "#1f1209", highlight: "#9b672d", ...(style.materials?.bark ?? {}) }),
      leaf: Object.freeze({ base: "#3f612a", shade: "#1a2e16", highlight: "#d0993d", ...(style.materials?.leaf ?? {}) }),
      sky: Object.freeze({ base: "#7fb2dc", shade: "#496f88", highlight: "#ffd18a", ...(style.materials?.sky ?? {}) })
    })
  });
}

function interpolatePath(points, t) {
  const safe = points.length ? points : [point()];
  if (safe.length === 1) return safe[0];
  const scaled = clamp(t, 0, 1) * (safe.length - 1);
  const index = Math.min(safe.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const a = safe[index];
  const b = safe[index + 1];
  return point({ x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local, z: a.z + (b.z - a.z) * local });
}

function distanceToPath2D(p, points) {
  if (!points.length) return Infinity;
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;
    const t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / len2, 0, 1);
    const x = a.x + dx * t;
    const z = a.z + dz * t;
    best = Math.min(best, Math.hypot(p.x - x, p.z - z));
  }
  return best;
}

function scatterBesidePath({ kind, count, radius, zMin, zMax, path, random, extra = {} }) {
  return Object.freeze(Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0.5 : index / Math.max(1, count - 1);
    const base = interpolatePath(path.points, clamp(t + random.range(-0.08, 0.08), 0, 1));
    const side = random() > 0.5 ? 1 : -1;
    const offset = random.range(radius * 0.35, radius);
    const z = clamp(base.z + random.range(-4, 4), zMin, zMax);
    return Object.freeze({
      id: `${kind}-${index}`,
      type: kind,
      position: point({ x: base.x + side * offset, y: 0, z }),
      scale: round(random.range(0.65, 1.45)),
      rotation: round(random.range(0, TAU)),
      sway: round(random.range(0.18, 0.88)),
      ...extra
    });
  }));
}

function createGrass(area, path, feature = {}, random, style) {
  if (!bool(feature.enabled, true)) return [];
  const count = Math.max(0, Math.floor(number(feature.bladeCount ?? feature.count, 3600)));
  const blades = [];
  const halfW = area.width / 2;
  const halfD = area.depth / 2;
  const palette = feature.palette ?? [style.materials.grass.base, style.materials.grass.highlight, "#78954a", "#a6a751"];
  for (let i = 0; i < count; i += 1) {
    let candidate;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      candidate = point({ x: area.anchor.x + random.range(-halfW, halfW), y: area.anchor.y, z: area.anchor.z + random.range(-halfD, halfD) });
      if (!path.enabled || distanceToPath2D(candidate, path.points) > path.width * random.range(0.5, 1.5)) break;
    }
    blades.push(Object.freeze({
      id: `grass-${i}`,
      type: "grass-blade",
      position: candidate,
      height: round(random.range(feature.heightMin ?? 0.18, feature.heightMax ?? 1.85)),
      width: round(random.range(0.035, 0.11)),
      lean: round(random.range(-0.38, 0.38)),
      rotation: round(random.range(0, TAU)),
      color: random.pick(palette, style.materials.grass.base),
      sway: round(random.range(0.2, 1))
    }));
  }
  return Object.freeze(blades);
}

function createFocalTree(area, feature = {}) {
  if (!bool(feature.enabled, true)) return null;
  return Object.freeze({
    id: "focal-tree",
    type: "focal-tree",
    position: point(feature.position, { x: area.anchor.x, y: area.anchor.y, z: area.anchor.z + 4 }),
    trunkRadius: number(feature.trunkRadius, 1.36),
    trunkHeight: number(feature.trunkHeight, 12.2),
    branchCount: Math.max(5, Math.floor(number(feature.branchCount, 20))),
    rootCount: Math.max(4, Math.floor(number(feature.rootCount, 13))),
    canopyRadius: number(feature.canopyRadius, 13.2),
    canopyHeight: number(feature.canopyHeight, 9.6),
    canopyLobeCount: Math.max(9, Math.floor(number(feature.canopyLobeCount, 34))),
    leafClusterCount: Math.max(20, Math.floor(number(feature.leafClusterCount, 136))),
    shadowRadius: number(feature.shadowRadius, 7.2),
    sway: number(feature.sway, 0.36)
  });
}

function createAtmosphere(area, style, feature = {}) {
  return Object.freeze({
    id: "meadow-atmosphere",
    type: "atmosphere",
    enabled: bool(feature.enabled, true),
    sun: Object.freeze({ position: point(feature.sun?.position, { x: area.anchor.x + area.width * 0.47, y: 31, z: area.anchor.z + area.depth * 0.56 }), radius: number(feature.sun?.radius, 4.2), color: feature.sun?.color ?? style.materials.sky.highlight }),
    hills: Object.freeze(feature.hills ?? [
      { id: "hill-near", y: 0.43, color: "#7d8d62", alpha: 0.48 },
      { id: "hill-far", y: 0.35, color: "#506f6d", alpha: 0.32 }
    ]),
    clouds: Object.freeze(feature.clouds ?? [
      { id: "cloud-left-soft", x: 0.18, y: 0.18, scale: 1.1, alpha: 0.16 },
      { id: "cloud-mid-high", x: 0.46, y: 0.13, scale: 0.72, alpha: 0.12 },
      { id: "cloud-sun-wisp", x: 0.72, y: 0.2, scale: 0.9, alpha: 0.18 }
    ]),
    ground: Object.freeze({ near: "#6f8b52", mid: "#91aa5c", far: "#b4b978", shadow: "rgba(38,55,24,.22)", ...(feature.ground ?? {}) })
  });
}

function normalizeFeatures(config, area, random, style) {
  const features = config.features ?? {};
  const path = normalizePath(features.path ?? {}, area);
  const zMin = area.anchor.z - area.depth * 0.5;
  const zMax = area.anchor.z + area.depth * 0.5;
  const flowers = bool(features.flowers?.enabled, true) ? scatterBesidePath({ kind: "wildflower", count: Math.floor(number(features.flowers?.count, 420)), radius: area.width * 0.22, zMin, zMax, path, random, extra: { color: style.materials.flower.base, accent: style.materials.flower.highlight } }) : [];
  const rocks = bool(features.rocks?.enabled, true) ? scatterBesidePath({ kind: "rock", count: Math.floor(number(features.rocks?.count, 46)), radius: area.width * 0.18, zMin, zMax, path, random, extra: { color: style.materials.rock.base, accent: style.materials.rock.highlight } }) : [];
  const mushrooms = bool(features.mushrooms?.enabled, true) ? scatterBesidePath({ kind: "mushroom", count: Math.floor(number(features.mushrooms?.count, 34)), radius: area.width * 0.13, zMin, zMax: area.anchor.z + area.depth * 0.1, path, random, extra: { color: style.materials.mushroom.base, accent: style.materials.mushroom.highlight } }) : [];
  const treeLine = bool(features.treeLine?.enabled, true) ? scatterBesidePath({ kind: "tree-line-tree", count: Math.floor(number(features.treeLine?.count, 36)), radius: area.width * 0.62, zMin: area.anchor.z + area.depth * 0.22, zMax, path, random, extra: { color: style.materials.leaf.shade, accent: style.materials.leaf.base } }) : [];
  return Object.freeze({
    path,
    focalTree: createFocalTree(area, features.focalTree ?? {}),
    grass: createGrass(area, path, features.grass ?? {}, random, style),
    flowers,
    rocks,
    mushrooms,
    treeLine,
    wind: Object.freeze({ enabled: bool(features.wind?.enabled, true), strength: number(features.wind?.strength, 0.38), direction: point(features.wind?.direction, { x: 0.72, y: 0, z: 0.34 }), gust: number(features.wind?.gust, 0.18) }),
    atmosphere: createAtmosphere(area, style, features.atmosphere ?? {})
  });
}

function makeObjects(features, style) {
  const objects = [features.atmosphere];
  objects.push({ id: "meadow-ground", type: "ground", color: style.materials.grass.base });
  if (features.path.enabled) objects.push({ id: "meadow-path", type: "path", ...features.path });
  objects.push(...features.grass, ...features.flowers, ...features.rocks, ...features.mushrooms, ...features.treeLine);
  if (features.focalTree) objects.push(features.focalTree);
  return Object.freeze(objects);
}

function createValidation(plan) {
  const counts = plan.stats.counts;
  const failures = [];
  if (!plan.area?.id) failures.push("area.id missing");
  if (plan.area.width <= 0 || plan.area.depth <= 0) failures.push("area bounds must be positive");
  if (counts.grass <= 0) failures.push("grass disabled or empty");
  if (counts.path <= 0) failures.push("path disabled or empty");
  if (counts.focalTree <= 0) failures.push("focal tree disabled or empty");
  return Object.freeze({ passed: failures.length === 0, failures, score: failures.length === 0 ? 1 : 0 });
}

function countByType(objects) {
  return Object.freeze(objects.reduce((acc, object) => {
    acc[object.type] = (acc[object.type] ?? 0) + 1;
    if (object.type === "grass-blade") acc.grass = (acc.grass ?? 0) + 1;
    if (object.type === "focal-tree") acc.focalTree = (acc.focalTree ?? 0) + 1;
    if (object.type === "path") acc.path = (acc.path ?? 0) + 1;
    return acc;
  }, {}));
}

export function createMeadowArea(config = {}) {
  const seed = String(config.seed ?? "meadow-area");
  const area = normalizeArea(config);
  const style = normalizeStyle(config.style ?? {});
  const random = createRandom(`${seed}:${area.id}`);
  const features = normalizeFeatures(config, area, random, style);

  function getRenderPlan(options = {}) {
    const objects = makeObjects(features, style);
    const plan = Object.freeze({
      id: area.id,
      type: "meadow-area-render-plan",
      version: MEADOW_AREA_KIT_VERSION,
      seed,
      time: number(options.time, 0),
      area,
      style,
      wind: features.wind,
      objects,
      stats: Object.freeze({ objectCount: objects.length, counts: countByType(objects) })
    });
    return Object.freeze({ ...plan, validation: createValidation(plan) });
  }

  function getSnapshot() {
    const plan = getRenderPlan();
    return Object.freeze({ id: area.id, version: MEADOW_AREA_KIT_VERSION, seed, area: clone(area), features: clone(config.features ?? {}), style: clone(style), stats: clone(plan.stats), validation: clone(plan.validation) });
  }

  return Object.freeze({
    id: area.id,
    version: MEADOW_AREA_KIT_VERSION,
    area,
    getRenderPlan,
    getSnapshot,
    snapshot: getSnapshot,
    validate: () => getRenderPlan().validation,
    reset: () => getSnapshot()
  });
}

export function createMeadowAreaKit(runtimeOrConfig = {}, maybeConfig = {}) {
  const isRuntimeFirst = runtimeOrConfig && typeof runtimeOrConfig === "object" && (typeof runtimeOrConfig.defineRuntimeKit === "function" || typeof runtimeOrConfig.defineDomainServiceKit === "function");
  const NexusEngine = isRuntimeFirst ? runtimeOrConfig : null;
  const config = isRuntimeFirst ? maybeConfig : runtimeOrConfig;
  const api = createMeadowArea(config);

  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      const id = runtimeOptions.id ?? "meadow-area-kit";
      const provides = runtimeOptions.provides ?? ["environment:meadow-area", "render:meadow-area-plan", "service:meadow-area-query"];
      if (typeof NexusEngine?.defineRuntimeKit === "function") {
        return NexusEngine.defineRuntimeKit({
          id,
          provides,
          metadata: { version: MEADOW_AREA_KIT_VERSION, domain: "meadow-area", rendererIndependent: true, ...(runtimeOptions.metadata ?? {}) },
          install({ engine }) { engine.meadowArea = api; }
        });
      }
      return Object.freeze({ id, provides, metadata: { version: MEADOW_AREA_KIT_VERSION, domain: "meadow-area", rendererIndependent: true }, install({ engine }) { engine.meadowArea = api; } });
    }
  });
}

export default createMeadowAreaKit;
