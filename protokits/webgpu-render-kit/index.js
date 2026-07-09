import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, stableId } from "../protokit-core/index.js";

export const WEBGPU_RENDER_KIT_VERSION = "0.1.0";

const list = (value) => value == null ? [] : Array.isArray(value) ? value.slice() : [value];
const makeState = () => ({ version: WEBGPU_RENDER_KIT_VERSION, device: { requested: false, ready: false, reason: "not-requested" }, context: { configured: false, width: 0, height: 0, format: "bgra8unorm" }, pipelines: {}, buffers: {}, fallback: { active: false, reason: null, visibleError: null }, noBlackScreen: { required: true, lastFrameHadSurface: false, errorSurfaceAvailable: true } });

function defineWebgpuKit(nexusEngine, config) {
  const { resource } = createDefinitionFactory(nexusEngine);
  const State = resource(config.resourceName || config.surface + ".state");
  return defineInjectedRuntimeKit(nexusEngine, {
    id: config.id,
    resources: { State },
    provides: list(config.provides || config.id),
    initWorld({ world }) { ensureResource(world, State, makeState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, makeState);
      engine.n = engine.n || {};
      engine.n[config.surface] = config.createApi({ state, engine, world, State });
    },
    metadata: { version: WEBGPU_RENDER_KIT_VERSION, stability: "prototype", purpose: config.id }
  });
}

export function detectWebgpuSupport(scope = globalThis) {
  const supported = Boolean(scope && scope.navigator && scope.navigator.gpu);
  return { supported, reason: supported ? "navigator-gpu-present" : "navigator-gpu-missing" };
}

export function createPipelineKey(descriptor = {}) {
  return stableId("webgpu-pipeline", descriptor.id, descriptor.shaderId, JSON.stringify(descriptor.vertexBuffers || []), JSON.stringify(descriptor.bindGroups || []));
}

export function createWebgpuRenderKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-render-kit", surface: options.surface || "webgpuRender", provides: ["webgpu-render"], createApi: ({ state }) => ({ snapshot: () => clone(state()), validate: () => ({ ok: Boolean(state().noBlackScreen.errorSurfaceAvailable), issues: state().noBlackScreen.errorSurfaceAvailable ? [] : ["missing-error-surface"] }) }) });
}

export function createWebgpuDeviceKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-device-kit", surface: options.surface || "webgpuDevice", provides: ["webgpu-device"], createApi: ({ state }) => ({ snapshot: () => clone(state().device), detect: detectWebgpuSupport, markReady(info = {}) { state().device = { ...state().device, ...info, requested: true, ready: true, reason: "ready" }; return clone(state().device); }, markUnavailable(reason = "unavailable") { state().device = { requested: true, ready: false, reason }; state().fallback = { active: true, reason, visibleError: "WebGPU unavailable: " + reason }; return clone(state().device); } }) });
}

export function createWebgpuCanvasContextKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-canvas-context-kit", surface: options.surface || "webgpuCanvasContext", createApi: ({ state }) => ({ snapshot: () => clone(state().context), configure(config = {}) { state().context = { ...state().context, configured: true, ...config }; return clone(state().context); }, resize(width = 0, height = 0) { state().context.width = Number(width) || 0; state().context.height = Number(height) || 0; return clone(state().context); } }) });
}

export function createWebgpuPipelineCacheKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-pipeline-cache-kit", surface: options.surface || "webgpuPipelineCache", createApi: ({ state }) => ({ snapshot: () => clone(state().pipelines), keyFor: createPipelineKey, registerPipeline(descriptor = {}) { const key = descriptor.key || createPipelineKey(descriptor); state().pipelines[key] = { key, ...descriptor }; return clone(state().pipelines[key]); } }) });
}

export function createWebgpuUniformBufferKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-uniform-buffer-kit", surface: options.surface || "webgpuUniformBuffer", createApi: ({ state }) => ({ snapshot: () => clone(state().buffers), registerUniformBuffer(name, schema = {}) { state().buffers[name] = { name, kind: "uniform", schema }; return clone(state().buffers[name]); } }) });
}

export function createWebgpuStorageBufferKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-storage-buffer-kit", surface: options.surface || "webgpuStorageBuffer", createApi: ({ state }) => ({ snapshot: () => clone(state().buffers), registerStorageBuffer(name, schema = {}) { state().buffers[name] = { name, kind: "storage", schema }; return clone(state().buffers[name]); } }) });
}

export function createWebgpuFallbackKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-fallback-kit", surface: options.surface || "webgpuFallback", createApi: ({ state }) => ({ snapshot: () => clone(state().fallback), activate(reason = "fallback-requested", visibleError = null) { state().fallback = { active: true, reason, visibleError: visibleError || reason }; state().noBlackScreen.lastFrameHadSurface = true; return clone(state().fallback); } }) });
}

export function createWebgpuNoBlackScreenKit(nexusEngine = {}, options = {}) {
  return defineWebgpuKit(nexusEngine, { id: options.id || "webgpu-no-black-screen-kit", surface: options.surface || "webgpuNoBlackScreen", createApi: ({ state }) => ({ snapshot: () => clone(state().noBlackScreen), reportFailure(message = "render-failure") { state().fallback = { active: true, reason: "render-failure", visibleError: message }; state().noBlackScreen.lastFrameHadSurface = true; return clone(state().fallback); }, validate() { const ok = Boolean(state().noBlackScreen.errorSurfaceAvailable); return { ok, issues: ok ? [] : ["missing-error-surface"] }; } }) });
}

export function createWebgpuRenderKitSuite(nexusEngine = {}, options = {}) {
  return [createWebgpuRenderKit(nexusEngine, options.render), createWebgpuDeviceKit(nexusEngine, options.device), createWebgpuCanvasContextKit(nexusEngine, options.canvasContext), createWebgpuPipelineCacheKit(nexusEngine, options.pipelineCache), createWebgpuUniformBufferKit(nexusEngine, options.uniformBuffer), createWebgpuStorageBufferKit(nexusEngine, options.storageBuffer), createWebgpuFallbackKit(nexusEngine, options.fallback), createWebgpuNoBlackScreenKit(nexusEngine, options.noBlackScreen)];
}

export default createWebgpuRenderKit;
