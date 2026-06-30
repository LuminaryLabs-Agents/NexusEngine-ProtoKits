import { createWebgpuRenderKitSuite, detectWebgpuSupport, createPipelineKey } from "../protokits/webgpu-render-kit/index.js";

function must(condition, message) { if (!condition) throw new Error(message); }
function createFakeWorld() { const resources = new Map(); const key = (resource) => resource?.name ?? resource; return { hasResource(resource) { return resources.has(key(resource)); }, getResource(resource) { return resources.get(key(resource)); }, setResource(resource, value) { resources.set(key(resource), value); return value; } }; }
function installKits(kits = []) { const engine = { n: {} }; const world = createFakeWorld(); for (const kit of kits) { kit.initWorld?.({ engine, world }); kit.install?.({ engine, world }); } return { engine, world }; }

const { engine } = installKits(createWebgpuRenderKitSuite());
must(detectWebgpuSupport({ navigator: {} }).supported === false, "headless no-WebGPU state should be safe");
engine.n.webgpuDevice.markUnavailable("headless-test");
must(engine.n.webgpuDevice.snapshot().ready === false, "device unavailable should be represented");
const keyA = createPipelineKey({ id: "p", shaderId: "s", vertexBuffers: [{ arrayStride: 12 }] });
const keyB = createPipelineKey({ id: "p", shaderId: "s", vertexBuffers: [{ arrayStride: 12 }] });
must(keyA === keyB, "pipeline key should be stable");
engine.n.webgpuPipelineCache.registerPipeline({ id: "p", shaderId: "s", vertexBuffers: [{ arrayStride: 12 }] });
must(Object.keys(engine.n.webgpuPipelineCache.snapshot()).length === 1, "pipeline cache should store descriptors");
must(engine.n.webgpuNoBlackScreen.validate().ok, "no-black-screen kit should validate error surface readiness");
console.log("webgpu-render-kit-check passed");
