import { clamp, createSeededRandom, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const RENDERING_STACK_KITS_VERSION = "0.1.0";

const SPECS = [
  ["createRenderDescriptorKit", "render-descriptor-kit", "core render data", ["render:descriptors", "render:snapshot-builder"], [], "Collects renderer-neutral object, camera, material, lighting, and effect descriptors."],
  ["createRenderObjectRegistryKit", "render-object-registry-kit", "core render data", ["render:object-registry"], [], "Registers stable render object descriptors."],
  ["createTransformHierarchyKit", "transform-hierarchy-kit", "core render data", ["render:transform-hierarchy"], [], "Builds parent-child transform descriptors."],
  ["createDirtyRenderSetKit", "dirty-render-set-kit", "core render data", ["render:dirty-set"], [], "Tracks changed render descriptors for incremental sync."],
  ["createRenderBudgetKit", "render-budget-kit", "core render data", ["render:budget"], [], "Defines frame, draw-call, triangle, texture, and instance budgets."],
  ["createProceduralMeshKit", "procedural-mesh-kit", "procedural geometry", ["mesh:procedural", "mesh:descriptor-builder"], [], "Creates wound procedural mesh descriptors."],
  ["createTriangleWindingKit", "triangle-winding-kit", "procedural geometry", ["mesh:triangle-winding"], [], "Owns triangle index winding policy."],
  ["createNormalTangentKit", "normal-tangent-kit", "procedural geometry", ["mesh:normals", "mesh:tangents"], [], "Computes normals and tangent descriptors."],
  ["createUvUnwrapKit", "uv-unwrap-kit", "procedural geometry", ["mesh:uv-unwrap"], [], "Generates planar and triplanar UV descriptor data."],
  ["createMeshLodKit", "mesh-lod-kit", "procedural geometry", ["mesh:lod"], [], "Selects and packages mesh LOD descriptors."],
  ["createMeshInstancingKit", "mesh-instancing-kit", "procedural geometry", ["mesh:instancing"], [], "Batches repeated mesh descriptors into instance sets."],
  ["createMeshCacheKit", "mesh-cache-kit", "procedural geometry", ["mesh:cache"], [], "Stores reusable procedural mesh descriptors."],
  ["createTerrainFieldKit", "terrain-field-kit", "world generation visuals", ["terrain:height-field", "terrain:normal-field"], [], "Provides deterministic terrain height and normal sampling."],
  ["createTerrainMeshKit", "terrain-mesh-kit", "world generation visuals", ["terrain:mesh"], ["terrain:height-field", "mesh:procedural"], "Converts terrain fields into wound mesh descriptors."],
  ["createBiomeFieldKit", "biome-field-kit", "world generation visuals", ["domain:biome-field", "service:biome-query"], [], "Maps world positions to biome visual policy."],
  ["createGroundContactKit", "ground-contact-kit", "world generation visuals", ["placement:ground-contact"], ["terrain:height-field"], "Seats props and instances onto terrain."],
  ["createVegetationArchetypeKit", "vegetation-archetype-kit", "world generation visuals", ["vegetation:archetypes"], [], "Defines vegetation species, scale, canopy, and placement metadata."],
  ["createVegetationLodKit", "vegetation-lod-kit", "world generation visuals", ["vegetation:lod"], [], "Chooses vegetation near/mid/far/cull LOD descriptors."],
  ["createGrassFieldKit", "grass-field-kit", "world generation visuals", ["vegetation:grass-field"], ["terrain:height-field"], "Generates grass tuft and blade instance descriptors."],
  ["createRockFormationKit", "rock-formation-kit", "world generation visuals", ["prop:rock-formations"], ["mesh:procedural"], "Generates procedural rock cluster descriptors."],
  ["createStructurePlacementKit", "structure-placement-kit", "world generation visuals", ["placement:structures"], [], "Places reusable structure descriptors."],
  ["createMaterialPaletteKit", "material-palette-kit", "materials and shading", ["material:palette"], [], "Registers semantic material palettes."],
  ["createPbrMaterialKit", "pbr-material-kit", "materials and shading", ["material:pbr"], [], "Builds physically based material descriptors."],
  ["createProceduralTextureKit", "procedural-texture-kit", "materials and shading", ["texture:procedural"], [], "Defines deterministic procedural texture descriptors."],
  ["createTriplanarMaterialKit", "triplanar-material-kit", "materials and shading", ["material:triplanar"], [], "Defines triplanar material projection policy."],
  ["createVertexColorKit", "vertex-color-kit", "materials and shading", ["material:vertex-color"], [], "Generates vertex color descriptor channels."],
  ["createShaderVariantKit", "shader-variant-kit", "materials and shading", ["shader:variants"], [], "Selects shader variants from features and platform capabilities."],
  ["createCelShadedRenderKit", "cel-shaded-render-kit", "materials and shading", ["shader:cel-shading"], [], "Defines cel-shading ramp and outline policy."],
  ["createLightingPolicyKit", "lighting-policy-kit", "lighting and atmosphere", ["lighting:policy"], [], "Defines key/fill/rim/ambient lighting policy."],
  ["createSkyAtmosphereKit", "sky-atmosphere-kit", "lighting and atmosphere", ["atmosphere:sky"], [], "Defines sky gradients and atmosphere descriptors."],
  ["createFogVolumeKit", "fog-volume-kit", "lighting and atmosphere", ["atmosphere:fog"], [], "Defines distance, height, and local fog descriptors."],
  ["createShadowPolicyKit", "shadow-policy-kit", "lighting and atmosphere", ["lighting:shadow-policy"], [], "Defines shadow map, cascade, and contact shadow policy."],
  ["createReflectionProbeKit", "reflection-probe-kit", "lighting and atmosphere", ["lighting:reflection-probes"], [], "Defines reflection probe volumes and update policy."],
  ["createTimeOfDayKit", "time-of-day-kit", "lighting and atmosphere", ["lighting:time-of-day"], [], "Maps day time to sun, sky, fog, and light descriptors."],
  ["createWeatherVisualKit", "weather-visual-kit", "lighting and atmosphere", ["weather:visual-policy"], [], "Maps weather state into clouds, precipitation, wetness, fog, and light descriptors."],
  ["createWindFieldKit", "wind-field-kit", "animation and living detail", ["animation:wind-field"], [], "Samples deterministic wind vectors."],
  ["createSkeletalRenderDescriptorKit", "skeletal-render-descriptor-kit", "animation and living detail", ["animation:skeletal-descriptors"], [], "Defines skeleton, joint, pose, and skinning descriptors."],
  ["createVertexAnimationKit", "vertex-animation-kit", "animation and living detail", ["animation:vertex"], [], "Defines morph, sway, bend, and vertex animation descriptors."],
  ["createFurShellRenderDescriptorKit", "fur-shell-render-descriptor-kit", "animation and living detail", ["animation:fur-shells"], [], "Defines shell-layer fur, wool, hair, and grass-card descriptors."],
  ["createClothRenderDescriptorKit", "cloth-render-descriptor-kit", "animation and living detail", ["animation:cloth-descriptors"], [], "Defines cloth surface, pin, and wind response descriptor policy."],
  ["createParticleFieldKit", "particle-field-kit", "animation and living detail", ["vfx:particle-field"], [], "Defines persistent and burst particle field descriptors."],
  ["createVfxEventKit", "vfx-event-kit", "animation and living detail", ["vfx:event-descriptors"], [], "Converts events into renderer-neutral VFX descriptors."],
  ["createCameraRigKit", "camera-rig-kit", "camera and composition", ["camera:rig"], [], "Defines camera rigs, offsets, damping, and targets."],
  ["createCameraCollisionKit", "camera-collision-kit", "camera and composition", ["camera:collision-policy"], [], "Defines camera obstruction and collision policy."],
  ["createCinematicFramingKit", "cinematic-framing-kit", "camera and composition", ["camera:cinematic-framing"], [], "Defines shot framing, lead-room, and target group descriptors."],
  ["createPostprocessPolicyKit", "postprocess-policy-kit", "camera and composition", ["render:postprocess-policy"], [], "Defines bloom, tonemap, grade, depth of field, and vignette policy."],
  ["createDiegeticUiRenderKit", "diegetic-ui-render-kit", "camera and composition", ["render:diegetic-ui"], [], "Defines world-space UI, prompts, markers, and meters."],
  ["createWebglRenderAdapterKit", "webgl-render-adapter-kit", "renderer adapters", ["adapter:webgl-renderer"], ["render:descriptors"], "Declares WebGL adapter capabilities."],
  ["createThreeRenderAdapterKit", "three-render-adapter-kit", "renderer adapters", ["adapter:three-renderer"], ["render:descriptors"], "Declares Three.js adapter capabilities."],
  ["createWebgpuRenderAdapterKit", "webgpu-render-adapter-kit", "renderer adapters", ["adapter:webgpu-renderer"], ["render:descriptors"], "Declares WebGPU adapter capabilities."],
  ["createAssetLoaderAdapterKit", "asset-loader-adapter-kit", "renderer adapters", ["adapter:asset-loader"], [], "Normalizes asset manifests, fallbacks, and loading policy."],
  ["createBrowserSmokeTestKit", "browser-smoke-test-kit", "renderer adapters", ["qa:browser-smoke-test"], [], "Defines browser smoke test expectations for render hosts."],
  ["createPerformanceBudgetKit", "performance-budget-kit", "renderer adapters", ["qa:performance-budget"], [], "Defines measurable frame, memory, triangle, draw-call, and instance budgets."]
];

const SPEC_BY_FACTORY = Object.freeze(Object.fromEntries(SPECS.map(([factoryName, id, category, provides, requires, purpose]) => [factoryName, { factoryName, id, category, provides, requires, purpose }])));
const SPEC_BY_ID = Object.freeze(Object.fromEntries(Object.values(SPEC_BY_FACTORY).map((spec) => [spec.id, spec])));

export const RENDERING_STACK_KIT_ORDER = Object.freeze(SPECS.map(([factoryName]) => factoryName));
export const RENDERING_STACK_MANIFEST = Object.freeze(Object.values(SPEC_BY_FACTORY).map((spec) => Object.freeze({ ...spec })));

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function freeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, freeze(entry)])));
  return value;
}

function spec(id) {
  return SPEC_BY_ID[id] ?? SPEC_BY_FACTORY[id] ?? { id, factoryName: id, category: "rendering", provides: [`${id}:capability`], requires: [], purpose: "Rendering stack ProtoKit." };
}

function kit(nexusRealtime = {}, options = {}, id, services = {}) {
  const s = spec(id);
  const api = {
    id: options.id ?? s.id,
    version: RENDERING_STACK_KITS_VERSION,
    category: s.category,
    purpose: s.purpose,
    requires: Object.freeze([...(options.requires ?? s.requires)]),
    provides: Object.freeze([...(options.provides ?? s.provides)]),
    config: freeze(options.config ?? {}),
    ...services
  };
  const frozenApi = Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      const bindingName = runtimeOptions.bindingName ?? s.id.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
      return defineInjectedRuntimeKit(nexusRealtime, {
        id: runtimeOptions.id ?? api.id,
        requires: runtimeOptions.requires ?? api.requires,
        provides: runtimeOptions.provides ?? api.provides,
        bindings: { [bindingName]: frozenApi, renderingStackKit: frozenApi, ...(runtimeOptions.bindings ?? {}) },
        metadata: { version: RENDERING_STACK_KITS_VERSION, category: api.category, purpose: api.purpose, promotionStatus: "prototype", ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
  return frozenApi;
}

function registry(initial = [], kind = "descriptor") {
  const entries = new Map();
  function normalize(descriptor = {}, index = entries.size) {
    const id = String(descriptor.id ?? `${kind}-${index + 1}`);
    return freeze({ id, type: descriptor.type ?? kind, ...descriptor });
  }
  for (const [index, descriptor] of asArray(initial).entries()) {
    const item = normalize(descriptor, index);
    entries.set(item.id, item);
  }
  return {
    register(descriptor = {}) {
      const item = normalize(descriptor);
      entries.set(item.id, item);
      return item;
    },
    get(id) {
      return entries.get(String(id)) ?? null;
    },
    list() {
      return Object.freeze(Array.from(entries.values()));
    },
    clear() {
      entries.clear();
    }
  };
}

function descriptorKit(nexusRealtime, options, id, kind = id) {
  const r = registry(options.descriptors ?? options.items ?? [], kind);
  return kit(nexusRealtime, options, id, {
    register: r.register,
    get: r.get,
    list: r.list,
    clear: r.clear,
    compile(extra = {}) {
      return freeze({ id: extra.id ?? `${id}-snapshot`, type: kind, descriptors: r.list(), metadata: extra.metadata ?? {} });
    }
  });
}

function normalize3(value = {}, fallback = {}) {
  return freeze({
    x: number(value.x, number(fallback.x, 0)),
    y: number(value.y, number(fallback.y, 0)),
    z: number(value.z, number(value.y, number(fallback.z, 0)))
  });
}

function v3(positions, i) {
  const o = i * 3;
  return { x: number(positions[o]), y: number(positions[o + 1]), z: number(positions[o + 2]) };
}

function sub(a, b) {
  return { x: number(a.x) - number(b.x), y: number(a.y) - number(b.y), z: number(a.z) - number(b.z) };
}

function cross(a, b) {
  return { x: number(a.y) * number(b.z) - number(a.z) * number(b.y), y: number(a.z) * number(b.x) - number(a.x) * number(b.z), z: number(a.x) * number(b.y) - number(a.y) * number(b.x) };
}

function dot(a, b) {
  return number(a.x) * number(b.x) + number(a.y) * number(b.y) + number(a.z) * number(b.z);
}

function unit(value = { x: 0, y: 1, z: 0 }) {
  const length = Math.hypot(number(value.x), number(value.y), number(value.z));
  return length > 0.000001 ? freeze({ x: value.x / length, y: value.y / length, z: value.z / length }) : freeze({ x: 0, y: 1, z: 0 });
}

function faceNormal(a, b, c) {
  return unit(cross(sub(b, a), sub(c, a)));
}

function bounds(positions = []) {
  if (!positions.length) return freeze({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } });
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (let i = 0; i < positions.length; i += 3) {
    min.x = Math.min(min.x, number(positions[i]));
    min.y = Math.min(min.y, number(positions[i + 1]));
    min.z = Math.min(min.z, number(positions[i + 2]));
    max.x = Math.max(max.x, number(positions[i]));
    max.y = Math.max(max.y, number(positions[i + 1]));
    max.z = Math.max(max.z, number(positions[i + 2]));
  }
  return freeze({ min, max, center: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 } });
}

function mesh(input = {}) {
  const positions = Object.freeze(Array.from(input.positions ?? []));
  const indices = Object.freeze(Array.from(input.indices ?? []));
  return freeze({
    id: input.id ?? "mesh",
    type: "mesh",
    primitive: input.primitive ?? "triangles",
    positions,
    indices,
    normals: Object.freeze(Array.from(input.normals ?? [])),
    tangents: Object.freeze(Array.from(input.tangents ?? [])),
    uvs: Object.freeze(Array.from(input.uvs ?? [])),
    colors: Object.freeze(Array.from(input.colors ?? [])),
    vertexCount: Math.floor(positions.length / 3),
    triangleCount: Math.floor(indices.length / 3),
    bounds: input.bounds ?? bounds(positions),
    metadata: input.metadata ?? {}
  });
}

function normals(positions = [], indices = []) {
  const out = Array.from({ length: positions.length }, () => 0);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i + 1], c = indices[i + 2];
    const n = faceNormal(v3(positions, a), v3(positions, b), v3(positions, c));
    for (const vertex of [a, b, c]) {
      out[vertex * 3] += n.x;
      out[vertex * 3 + 1] += n.y;
      out[vertex * 3 + 2] += n.z;
    }
  }
  for (let i = 0; i < out.length; i += 3) {
    const n = unit({ x: out[i], y: out[i + 1], z: out[i + 2] });
    out[i] = n.x;
    out[i + 1] = n.y;
    out[i + 2] = n.z;
  }
  return Object.freeze(out);
}

function plane(options = {}) {
  const width = Math.max(0.001, number(options.width, 1));
  const depth = Math.max(0.001, number(options.depth, 1));
  const sx = Math.max(1, Math.floor(number(options.segmentsX ?? options.segments, 1)));
  const sz = Math.max(1, Math.floor(number(options.segmentsZ ?? options.segments, 1)));
  const heightAt = typeof options.heightAt === "function" ? options.heightAt : () => number(options.y, 0);
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let zi = 0; zi <= sz; zi += 1) {
    const v = zi / sz, z = (v - 0.5) * depth;
    for (let xi = 0; xi <= sx; xi += 1) {
      const u = xi / sx, x = (u - 0.5) * width;
      positions.push(x, number(heightAt(x, z, u, v), 0), z);
      uvs.push(u, v);
    }
  }
  const row = sx + 1;
  for (let zi = 0; zi < sz; zi += 1) {
    for (let xi = 0; xi < sx; xi += 1) {
      const a = zi * row + xi, b = a + 1, c = a + row, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return mesh({ id: options.id ?? "plane-grid", positions, indices, uvs, normals: normals(positions, indices), metadata: options.metadata });
}

function planarUvs(positions = [], axes = ["x", "z"], scale = 1) {
  const out = [];
  for (let i = 0; i < positions.length; i += 3) {
    const p = { x: positions[i], y: positions[i + 1], z: positions[i + 2] };
    out.push(number(p[axes[0]], 0) * scale, number(p[axes[1]], 0) * scale);
  }
  return Object.freeze(out);
}

function terrainSampler(options = {}) {
  const seed = String(options.seed ?? "terrain");
  const seedPhase = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) / 997;
  const amplitude = number(options.amplitude, 1.5);
  const frequency = number(options.frequency, 0.06);
  function heightAt(x = 0, z = 0) {
    return number(options.baseHeight, 0) + (Math.sin((number(x) + seedPhase) * frequency) + Math.cos((number(z) - seedPhase) * frequency * 1.37)) * amplitude * 0.5;
  }
  function normalAt(x = 0, z = 0) {
    const e = number(options.normalSampleDistance, 0.5);
    return unit({ x: heightAt(x - e, z) - heightAt(x + e, z), y: e * 2, z: heightAt(x, z - e) - heightAt(x, z + e) });
  }
  return freeze({ heightAt, normalAt, sample: (x = 0, z = 0) => freeze({ x, y: heightAt(x, z), z, normal: normalAt(x, z) }) });
}

function scatter(options = {}) {
  const random = createSeededRandom(options.seed ?? "scatter");
  const count = Math.max(0, Math.floor(number(options.count, 16)));
  const width = number(options.width, 10), depth = number(options.depth, 10);
  return Object.freeze(Array.from({ length: count }, (_, index) => {
    const x = random.range(-width / 2, width / 2);
    const z = random.range(-depth / 2, depth / 2);
    return freeze({ id: `${options.prefix ?? "instance"}-${index + 1}`, x, y: typeof options.heightAt === "function" ? options.heightAt(x, z) : number(options.y, 0), z, yaw: random.range(0, Math.PI * 2), scale: random.range(number(options.minScale, 0.8), number(options.maxScale, 1.2)) });
  }));
}

function lod(levels = []) {
  const list = Object.freeze((levels.length ? levels : [{ id: "near", maxDistance: 24, quality: 1 }, { id: "mid", maxDistance: 80, quality: 0.55 }, { id: "far", maxDistance: 180, quality: 0.2 }, { id: "cull", maxDistance: Infinity, quality: 0 }]).map(freeze).sort((a, b) => a.maxDistance - b.maxDistance));
  return freeze({ levels: list, choose: (distance = 0) => list.find((level) => number(distance) <= level.maxDistance) ?? list[list.length - 1] });
}

export function createRenderDescriptorKit(nexusRealtime = {}, options = {}) {
  const r = registry(options.descriptors ?? [], "render-descriptor");
  return kit(nexusRealtime, options, "render-descriptor-kit", { register: r.register, get: r.get, list: r.list, snapshot: (extra = {}) => freeze({ id: extra.id ?? "render-snapshot", descriptors: r.list(), metadata: extra.metadata ?? {} }) });
}
export const createRenderObjectRegistryKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, options, "render-object-registry-kit", "render-object");
export const createTransformHierarchyKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, options, "transform-hierarchy-kit", "transform");
export function createDirtyRenderSetKit(nexusRealtime = {}, options = {}) {
  const dirty = new Map();
  return kit(nexusRealtime, options, "dirty-render-set-kit", { mark: (id, reason = "changed") => dirty.set(String(id), freeze({ id, reason })) && dirty.get(String(id)), list: () => Object.freeze(Array.from(dirty.values())), clear: () => dirty.clear() });
}
export function createRenderBudgetKit(nexusRealtime = {}, options = {}) {
  const budgets = freeze({ frameMs: number(options.frameMs, 16.67), drawCalls: number(options.drawCalls, 600), triangles: number(options.triangles, 1500000), instances: number(options.instances, 100000), textureMegabytes: number(options.textureMegabytes, 256) });
  return kit(nexusRealtime, options, "render-budget-kit", { budgets, evaluate: (sample = {}) => freeze(Object.fromEntries(Object.entries(budgets).map(([key, limit]) => [key, { value: number(sample[key], 0), limit, ok: number(sample[key], 0) <= limit }]))) });
}
export function createProceduralMeshKit(nexusRealtime = {}, options = {}) {
  return kit(nexusRealtime, options, "procedural-mesh-kit", { createMeshDescriptor: mesh, createPlaneGrid: plane, validate: (m = {}) => freeze({ ok: asArray(m.positions).length % 3 === 0 && asArray(m.indices).length % 3 === 0, vertexCount: Math.floor(asArray(m.positions).length / 3), triangleCount: Math.floor(asArray(m.indices).length / 3) }) });
}
export function createTriangleWindingKit(nexusRealtime = {}, options = {}) {
  return kit(nexusRealtime, options, "triangle-winding-kit", { buildQuad: (a, b, c, d, mode = "y-up") => Object.freeze(mode === "y-up" ? [a, c, b, b, c, d] : [a, b, c, b, d, c]), ensureTriangle: (positions, tri, expected = { x: 0, y: 1, z: 0 }) => dot(faceNormal(v3(positions, tri[0]), v3(positions, tri[1]), v3(positions, tri[2])), expected) >= 0 ? Object.freeze([...tri]) : Object.freeze([tri[0], tri[2], tri[1]]) });
}
export const createNormalTangentKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "normal-tangent-kit", { computeFaceNormal: faceNormal, computeVertexNormals: normals, computeTangents: (m = {}) => Object.freeze(Array.from({ length: Math.floor(asArray(m.positions).length / 3) }, () => [1, 0, 0, 1]).flat()) });
export const createUvUnwrapKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "uv-unwrap-kit", { planarProject: (m = {}, o = {}) => planarUvs(asArray(m.positions), o.axes ?? ["x", "z"], number(o.scale, 1)), withPlanarUvs: (m = {}, o = {}) => mesh({ ...m, uvs: planarUvs(asArray(m.positions), o.axes ?? ["x", "z"], number(o.scale, 1)) }), triplanarDescriptor: (materialId = "material", o = {}) => freeze({ type: "triplanar-uv", materialId, scale: number(o.scale, 1), blendSharpness: number(o.blendSharpness, 4) }) });
export function createMeshLodKit(nexusRealtime = {}, options = {}) { const chooser = lod(options.levels); return kit(nexusRealtime, options, "mesh-lod-kit", { levels: chooser.levels, choose: chooser.choose }); }
export const createMeshInstancingKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "mesh-instancing-kit", { createBatch: (meshId, transforms = [], o = {}) => freeze({ id: o.id ?? `${meshId}-instances`, type: "instance-batch", meshId, count: asArray(transforms).length, transforms: asArray(transforms).map((t) => freeze({ position: normalize3(t.position ?? t), scale: normalize3(t.scale, { x: 1, y: 1, z: 1 }), rotation: normalize3(t.rotation) })) }) });
export function createMeshCacheKit(nexusRealtime = {}, options = {}) { const c = new Map(); return kit(nexusRealtime, options, "mesh-cache-kit", { set: (key, value) => c.set(String(key), mesh(value)) && c.get(String(key)), get: (key) => c.get(String(key)) ?? null, keys: () => Object.freeze(Array.from(c.keys())) }); }
export function createTerrainFieldKit(nexusRealtime = {}, options = {}) { return kit(nexusRealtime, options, "terrain-field-kit", terrainSampler(options)); }
export function createTerrainMeshKit(nexusRealtime = {}, options = {}) { const sampler = options.sampler ?? terrainSampler(options.terrain ?? options); return kit(nexusRealtime, options, "terrain-mesh-kit", { sampler, createTerrainMesh: (o = {}) => plane({ id: o.id ?? "terrain-mesh", width: number(o.width, number(options.width, 32)), depth: number(o.depth, number(options.depth, 32)), segments: number(o.segments, number(options.segments, 32)), heightAt: sampler.heightAt, metadata: { terrain: true } }) }); }
export function createBiomeFieldKit(nexusRealtime = {}, options = {}) { const biomes = asArray(options.biomes).length ? asArray(options.biomes) : [{ id: "meadow", weight: 1, color: "#79a96b" }]; return kit(nexusRealtime, options, "biome-field-kit", { biomes: freeze(biomes), biomeAt: () => freeze(biomes[0]) }); }
export function createGroundContactKit(nexusRealtime = {}, options = {}) { const sampler = options.sampler ?? terrainSampler(options.terrain ?? {}); return kit(nexusRealtime, options, "ground-contact-kit", { sampler, seat: (input = {}) => { const p = normalize3(input.position ?? input); return freeze({ ...input, position: { x: p.x, y: sampler.heightAt(p.x, p.z) - number(input.inset, 0), z: p.z }, normal: sampler.normalAt(p.x, p.z) }); } }); }
export function createVegetationArchetypeKit(nexusRealtime = {}, options = {}) { const species = asArray(options.species).length ? asArray(options.species) : [{ id: "meadow-oak", weight: 1 }, { id: "silver-birch", weight: 0.7 }]; return kit(nexusRealtime, options, "vegetation-archetype-kit", { species: freeze(species), sampleSpecies: () => freeze(species[0]) }); }
export function createVegetationLodKit(nexusRealtime = {}, options = {}) { const chooser = lod(options.levels); return kit(nexusRealtime, options, "vegetation-lod-kit", { levels: chooser.levels, choose: chooser.choose, descriptorFor: (distance = 0, species = {}) => freeze({ speciesId: species.id ?? null, lodId: chooser.choose(distance).id }) }); }
export function createGrassFieldKit(nexusRealtime = {}, options = {}) { const sampler = options.sampler ?? terrainSampler(options.terrain ?? {}); return kit(nexusRealtime, options, "grass-field-kit", { sampler, scatter: (o = {}) => scatter({ seed: o.seed ?? options.seed ?? "grass", count: number(o.count, 128), width: number(o.width, 24), depth: number(o.depth, 24), prefix: "grass", heightAt: sampler.heightAt }) }); }
export const createRockFormationKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "rock-formation-kit", { createCluster: (o = {}) => scatter({ seed: o.seed ?? options.seed ?? "rock", count: number(o.count, 8), width: number(o.width, 12), depth: number(o.depth, 12), prefix: "rock" }).map((p) => freeze({ ...p, type: "rock" })) });
export const createStructurePlacementKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, options, "structure-placement-kit", "structure");
export const createMaterialPaletteKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, { descriptors: options.materials ?? options.descriptors ?? [{ id: "grass", type: "material", color: "#6fa35b" }, { id: "bark", type: "material", color: "#6a4a2d" }], ...options }, "material-palette-kit", "material");
export const createPbrMaterialKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "pbr-material-kit", { createMaterial: (m = {}) => freeze({ id: m.id ?? "pbr-material", type: "pbr-material", color: m.color ?? "#ffffff", metalness: clamp(number(m.metalness, 0), 0, 1), roughness: clamp(number(m.roughness, 0.8), 0, 1), maps: freeze(m.maps ?? {}) }) });
export const createProceduralTextureKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "procedural-texture-kit", { sampleNoise: (x = 0, y = 0) => { const raw = Math.sin((number(x) + String(options.seed ?? "").length) * 12.9898 + number(y) * 78.233) * 43758.5453; return raw - Math.floor(raw); }, createTextureDescriptor: (o = {}) => freeze({ id: o.id ?? "procedural-texture", type: o.type ?? "noise", resolution: number(o.resolution, 256), seed: o.seed ?? options.seed ?? "texture" }) });
export const createTriplanarMaterialKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "triplanar-material-kit", { createTriplanarDescriptor: (m = {}) => freeze({ id: m.id ?? "triplanar-material", type: "triplanar-material", materialIds: m.materialIds ?? [m.materialId ?? "default"], scale: number(m.scale, 1), blendSharpness: number(m.blendSharpness, 4) }) });
export const createVertexColorKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "vertex-color-kit", { apply: (m = {}, color = [1, 1, 1, 1]) => mesh({ ...m, colors: Array.from({ length: Math.floor(asArray(m.positions).length / 3) }, () => color).flat() }) });
export const createShaderVariantKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, { descriptors: options.variants ?? options.descriptors ?? [{ id: "standard" }, { id: "instanced-pbr", features: ["instancing", "pbr"] }], ...options }, "shader-variant-kit", "shader-variant");
export const createCelShadedRenderKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "cel-shaded-render-kit", { createPolicy: (p = {}) => freeze({ id: p.id ?? "cel-shaded-policy", bands: number(p.bands, 3), outlineWidth: number(p.outlineWidth, 0.012), ramp: p.ramp ?? ["#1b1b2b", "#5b6f4d", "#d8df9f"] }) });
export const createLightingPolicyKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "lighting-policy-kit", { resolve: (p = {}) => freeze({ ambient: p.ambient ?? { color: "#8fa7c2", intensity: 0.45 }, key: p.key ?? { color: "#fff0c8", intensity: 1.4, direction: { x: -0.4, y: -1, z: -0.25 } } }) });
export const createSkyAtmosphereKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "sky-atmosphere-kit", { descriptor: (s = {}) => freeze({ id: s.id ?? "sky-atmosphere", zenith: s.zenith ?? "#6fb7ff", horizon: s.horizon ?? "#f5d6a1", haze: number(s.haze, 0.32) }) });
export const createFogVolumeKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "fog-volume-kit", { descriptor: (f = {}) => freeze({ id: f.id ?? "fog-volume", color: f.color ?? "#ccd8d0", density: number(f.density, 0.018), start: number(f.start, 8), end: number(f.end, 160) }) });
export const createShadowPolicyKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "shadow-policy-kit", { descriptor: (p = {}) => freeze({ id: p.id ?? "shadow-policy", cascades: number(p.cascades, 3), resolution: number(p.resolution, 2048), contactShadows: p.contactShadows ?? true }) });
export const createReflectionProbeKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, { descriptors: options.probes ?? options.descriptors ?? [], ...options }, "reflection-probe-kit", "reflection-probe");
export const createTimeOfDayKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "time-of-day-kit", { stateAt: (t = 0.5) => { const a = (((number(t, 0.5) % 1) + 1) % 1) * Math.PI * 2 - Math.PI / 2; return freeze({ sunDirection: unit({ x: Math.cos(a) * 0.25, y: Math.sin(a), z: -0.5 }), sunIntensity: clamp(Math.sin(a) * 1.25, 0, 1.25) }); } });
export const createWeatherVisualKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "weather-visual-kit", { resolve: (w = {}) => freeze({ preset: w.preset ?? options.preset ?? "clear", cloudCover: number(w.cloudCover, 0.15), precipitation: number(w.precipitation, 0), wetness: number(w.wetness, 0), fogDensity: number(w.fogDensity, 0.01) }) });
export const createWindFieldKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "wind-field-kit", { sample: (x = 0, y = 0, z = 0, time = 0) => { const dir = unit(options.direction ?? { x: 1, y: 0, z: 0.25 }); const gust = 0.5 + 0.5 * Math.sin(number(x) * 0.07 + number(z) * 0.11 + number(time)); const strength = number(options.strength, 1) * gust; return freeze({ x: dir.x * strength, y: dir.y * strength, z: dir.z * strength, strength }); } });
export const createSkeletalRenderDescriptorKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, { descriptors: options.skeletons ?? options.descriptors ?? [], ...options }, "skeletal-render-descriptor-kit", "skeleton");
export const createVertexAnimationKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "vertex-animation-kit", { descriptor: (a = {}) => freeze({ id: a.id ?? "vertex-animation", type: a.type ?? "sway", amplitude: number(a.amplitude, 0.1), frequency: number(a.frequency, 1) }) });
export const createFurShellRenderDescriptorKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "fur-shell-render-descriptor-kit", { descriptor: (f = {}) => freeze({ id: f.id ?? "fur-shell", shellCount: number(f.shellCount, 12), length: number(f.length, 0.08), density: number(f.density, 0.7), windResponse: number(f.windResponse, 0.35) }) });
export const createClothRenderDescriptorKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "cloth-render-descriptor-kit", { descriptor: (c = {}) => freeze({ id: c.id ?? "cloth", resolution: c.resolution ?? { x: 8, y: 8 }, pins: c.pins ?? [], windResponse: number(c.windResponse, 0.6) }) });
export function createParticleFieldKit(nexusRealtime = {}, options = {}) { let next = 0; return kit(nexusRealtime, options, "particle-field-kit", { emit: (e = {}) => freeze({ id: e.id ?? `particle-burst-${++next}`, position: normalize3(e.position), count: number(e.count, 16), lifetime: number(e.lifetime, 1) }) }); }
export const createVfxEventKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "vfx-event-kit", { descriptorForEvent: (e = {}) => freeze({ type: "vfx-event", eventType: e.type ?? e.event ?? "event", position: e.position ?? null, particle: e.particle ?? "spark" }) });
export const createCameraRigKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "camera-rig-kit", { descriptor: (c = {}) => freeze({ id: c.id ?? "camera-rig", mode: c.mode ?? "third-person", position: normalize3(c.position, { x: 0, y: 4, z: 8 }), lookAt: normalize3(c.lookAt, { x: 0, y: 1, z: 0 }), fov: number(c.fov, 55) }) });
export const createCameraCollisionKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "camera-collision-kit", { resolve: (camera = {}, hit = null) => freeze(hit ? { ...camera, collisionAdjusted: true, collisionDistance: number(hit.distance, 0) - number(options.padding, 0.25) } : camera) });
export const createCinematicFramingKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "cinematic-framing-kit", { frame: (targets = []) => freeze({ targetCount: asArray(targets).length, ruleOfThirds: true }) });
export const createPostprocessPolicyKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "postprocess-policy-kit", { descriptor: (p = {}) => freeze({ bloom: p.bloom ?? { enabled: true, intensity: 0.25 }, tonemap: p.tonemap ?? "aces", exposure: number(p.exposure, 1) }) });
export const createDiegeticUiRenderKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, { descriptors: options.markers ?? options.descriptors ?? [], ...options }, "diegetic-ui-render-kit", "diegetic-ui");

function adapter(nexusRealtime = {}, options = {}, id, backend) {
  const capabilities = freeze({ backend, instancing: true, pbr: true, shadows: true, webgpu: backend === "webgpu" });
  return kit(nexusRealtime, options, id, { capabilities, createAdapterDescriptor: (d = {}) => freeze({ id: d.id ?? id, type: "render-adapter", backend, consumes: d.consumes ?? ["render:descriptors"], capabilities }) });
}
export const createWebglRenderAdapterKit = (nexusRealtime = {}, options = {}) => adapter(nexusRealtime, options, "webgl-render-adapter-kit", "webgl");
export const createThreeRenderAdapterKit = (nexusRealtime = {}, options = {}) => adapter(nexusRealtime, options, "three-render-adapter-kit", "three");
export const createWebgpuRenderAdapterKit = (nexusRealtime = {}, options = {}) => adapter(nexusRealtime, options, "webgpu-render-adapter-kit", "webgpu");
export const createAssetLoaderAdapterKit = (nexusRealtime = {}, options = {}) => descriptorKit(nexusRealtime, { descriptors: options.assets ?? options.descriptors ?? [], ...options }, "asset-loader-adapter-kit", "asset");
export const createBrowserSmokeTestKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "browser-smoke-test-kit", { expectations: freeze({ hostGlobal: options.hostGlobal ?? "GameHost", minFrames: number(options.minFrames, 2), requiredApis: options.requiredApis ?? ["getState"] }), evaluate: (host = {}) => freeze({ ok: asArray(options.requiredApis ?? ["getState"]).every((api) => typeof host?.[api] === "function") }) });
export const createPerformanceBudgetKit = (nexusRealtime = {}, options = {}) => kit(nexusRealtime, options, "performance-budget-kit", createRenderBudgetKit(nexusRealtime, options));

export const RENDERING_STACK_KIT_FACTORIES = Object.freeze({
  createRenderDescriptorKit, createRenderObjectRegistryKit, createTransformHierarchyKit, createDirtyRenderSetKit, createRenderBudgetKit,
  createProceduralMeshKit, createTriangleWindingKit, createNormalTangentKit, createUvUnwrapKit, createMeshLodKit, createMeshInstancingKit, createMeshCacheKit,
  createTerrainFieldKit, createTerrainMeshKit, createBiomeFieldKit, createGroundContactKit, createVegetationArchetypeKit, createVegetationLodKit, createGrassFieldKit, createRockFormationKit, createStructurePlacementKit,
  createMaterialPaletteKit, createPbrMaterialKit, createProceduralTextureKit, createTriplanarMaterialKit, createVertexColorKit, createShaderVariantKit, createCelShadedRenderKit,
  createLightingPolicyKit, createSkyAtmosphereKit, createFogVolumeKit, createShadowPolicyKit, createReflectionProbeKit, createTimeOfDayKit, createWeatherVisualKit,
  createWindFieldKit, createSkeletalRenderDescriptorKit, createVertexAnimationKit, createFurShellRenderDescriptorKit, createClothRenderDescriptorKit, createParticleFieldKit, createVfxEventKit,
  createCameraRigKit, createCameraCollisionKit, createCinematicFramingKit, createPostprocessPolicyKit, createDiegeticUiRenderKit,
  createWebglRenderAdapterKit, createThreeRenderAdapterKit, createWebgpuRenderAdapterKit, createAssetLoaderAdapterKit, createBrowserSmokeTestKit, createPerformanceBudgetKit
});

export function createRenderingStackKitApis(nexusRealtime = {}, options = {}) {
  const only = options.only ? new Set(asArray(options.only)) : null;
  const exclude = new Set(asArray(options.exclude));
  return Object.freeze(Object.fromEntries(RENDERING_STACK_KIT_ORDER
    .filter((name) => (!only || only.has(name)) && !exclude.has(name))
    .map((name) => [name, RENDERING_STACK_KIT_FACTORIES[name](nexusRealtime, options[name] ?? {})])));
}

export function createRenderingStackKits(nexusRealtime = {}, options = {}) {
  return Object.freeze(Object.values(createRenderingStackKitApis(nexusRealtime, options)).map((api) => api.createRuntimeKit()));
}

export function createMeadowRenderingStackKits(nexusRealtime = {}, options = {}) {
  return createRenderingStackKits(nexusRealtime, {
    ...options,
    only: options.only ?? [
      "createRenderDescriptorKit", "createProceduralMeshKit", "createTriangleWindingKit", "createNormalTangentKit", "createUvUnwrapKit",
      "createTerrainFieldKit", "createTerrainMeshKit", "createBiomeFieldKit", "createGroundContactKit", "createVegetationArchetypeKit", "createVegetationLodKit", "createGrassFieldKit",
      "createMaterialPaletteKit", "createPbrMaterialKit", "createProceduralTextureKit", "createTriplanarMaterialKit",
      "createLightingPolicyKit", "createSkyAtmosphereKit", "createFogVolumeKit", "createShadowPolicyKit", "createTimeOfDayKit", "createWeatherVisualKit",
      "createWindFieldKit", "createVertexAnimationKit", "createFurShellRenderDescriptorKit", "createParticleFieldKit",
      "createCameraRigKit", "createPostprocessPolicyKit", "createDiegeticUiRenderKit", "createThreeRenderAdapterKit", "createAssetLoaderAdapterKit", "createPerformanceBudgetKit"
    ]
  });
}

export default createRenderingStackKits;
