import assert from "node:assert/strict";
import {
  batchInstances,
  chooseAssetVariant,
  chooseCapabilityProfile,
  computeSunDirection,
  createAdaptiveVisualStackKits,
  createAssetQualityKit,
  createAtmosphereDomainServiceKit,
  createCanvasRenderAdapterKit,
  createEnvironmentContentKit,
  createInstanceBatchingSystemKit,
  createLightingDomainServiceKit,
  createLodSelectionSystemKit,
  createMaterialDomainServiceKit,
  createRenderCapabilityKit,
  createRenderCullingSystemKit,
  createRenderGraphKit,
  createRenderQualityBudgetKit,
  createVisualPolicyDomainServiceKit,
  createWebglRenderAdapterKit,
  createWebgpuRenderAdapterKit,
  cullRenderables,
  generateEnvironmentContent,
  normalizeAtmosphere,
  normalizeLighting,
  normalizeMaterial,
  normalizeRenderGraph,
  normalizeVisualPolicy,
  planCanvasFrame,
  planWebglFrame,
  planWebgpuFrame,
  recommendQuality,
  selectLod
} from "../protokits/adaptive-visual-core/index.js";

const NexusRealtime = {
  defineResource(name) { return { kind: "resource", name }; },
  defineEvent(name) { return { kind: "event", name }; },
  defineRuntimeKit(config) { return config; }
};

class TestWorld {
  constructor() {
    this.resources = new Map();
    this.events = new Map();
    this.__nexusClock = { delta: 1 / 60, elapsed: 0 };
  }
  key(token) { return token?.name ?? String(token); }
  getResource(token) { return this.resources.get(this.key(token)); }
  setResource(token, value) { this.resources.set(this.key(token), value); return value; }
  emit(event, payload = {}) {
    const key = this.key(event);
    const list = this.events.get(key) ?? [];
    list.push(payload);
    this.events.set(key, list);
  }
  readEvents(event) { return this.events.get(this.key(event)) ?? []; }
}

const factories = [
  ["visualPolicy", createVisualPolicyDomainServiceKit],
  ["renderCapability", createRenderCapabilityKit],
  ["renderQualityBudget", createRenderQualityBudgetKit],
  ["renderGraph", createRenderGraphKit],
  ["materialDomain", createMaterialDomainServiceKit],
  ["lightingDomain", createLightingDomainServiceKit],
  ["atmosphereDomain", createAtmosphereDomainServiceKit],
  ["environmentContent", createEnvironmentContentKit],
  ["renderCulling", createRenderCullingSystemKit],
  ["lodSelection", createLodSelectionSystemKit],
  ["instanceBatching", createInstanceBatchingSystemKit],
  ["assetQuality", createAssetQualityKit],
  ["canvasRenderAdapter", createCanvasRenderAdapterKit],
  ["webglRenderAdapter", createWebglRenderAdapterKit],
  ["webgpuRenderAdapter", createWebgpuRenderAdapterKit]
];

for (const [engineKey, factory] of factories) {
  const kit = factory(NexusRealtime, { id: `${engineKey}-test` });
  assert.ok(kit.id.endsWith("kit"), `${engineKey} should define a kit id`);
  assert.ok(kit.provides.length > 0, `${engineKey} should provide capabilities`);
  assert.equal(typeof kit.systems[0].system, "function", `${engineKey} should install a system`);
  const world = new TestWorld();
  const engine = {};
  kit.initWorld({ world });
  kit.install({ engine, world });
  assert.equal(typeof engine[engineKey].getState, "function", `${engineKey} should install public API`);
  const before = engine[engineKey].getState();
  engine[engineKey].configure({ profile: "canvas", reason: "test-configure" });
  kit.systems[0].system(world);
  const after = engine[engineKey].getState();
  assert.ok(after.revision >= before.revision, `${engineKey} should remain inspectable after configure`);
  assert.ok(after.data, `${engineKey} should keep serializable data`);
  assert.ok(engine[engineKey].getDescriptors(), `${engineKey} should expose descriptors`);
}

assert.equal(createAdaptiveVisualStackKits(NexusRealtime, { environmentContent: { instanceCount: 4 } }).length, 15);
assert.equal(chooseCapabilityProfile({ webgpu: true }, { preferredProfile: "cinematic" }), "webgpu");
assert.equal(chooseCapabilityProfile({ webgpu: false, webgl2: false, webgl: false, canvas2d: true }, {}), "canvas");
assert.equal(normalizeVisualPolicy({ targetFrameMs: 33 }).targetFrameMs, 33);
assert.equal(recommendQuality({ frameMs: 40, targetFrameMs: 16 }).reason, "frame-budget");
assert.equal(normalizeRenderGraph({ passes: ["opaque", "fog"] }).passes.length, 2);
assert.equal(normalizeMaterial({ id: "m", color: "#fff" }).baseColor, "#fff");
assert.ok(Number.isFinite(computeSunDirection(0.5).y));
assert.ok(normalizeLighting({ timeOfDay: 0.5 }).sunDirection);
assert.equal(normalizeAtmosphere({ cloudCover: 2 }).clouds.cover, 1);
assert.equal(generateEnvironmentContent({ seed: "a", instanceCount: 3 }).vegetation.length, 3);
assert.equal(cullRenderables([{ id: "near", x: 0, z: 0 }, { id: "far", x: 100, z: 0 }], { x: 0, z: 0 }, { maxDistance: 10 }).length, 1);
assert.equal(selectLod(140).detail, "billboard");
assert.equal(batchInstances([{ id: "a", meshId: "m", materialId: "mat" }, { id: "b", meshId: "m", materialId: "mat" }])[0].count, 2);
assert.equal(chooseAssetVariant({ id: "tree", variants: [{ id: "hi", profile: "webgpu" }, { id: "lo", profile: "canvas" }] }, { profile: "canvas" }).id, "lo");
assert.equal(planCanvasFrame({ renderables: [{ id: "sprite" }] }).backend, "canvas");
assert.equal(planWebglFrame({}).backend, "webgl");
assert.equal(planWebgpuFrame({}).backend, "webgpu");

console.log("Adaptive visual stack kits passed.");
