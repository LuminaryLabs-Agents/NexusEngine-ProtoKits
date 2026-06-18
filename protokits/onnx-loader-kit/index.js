export const ONNX_LOADER_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createOnnxLoaderKit requires NexusRealtime.${key}.`);
  }
}

function initialState() {
  return { version: ONNX_LOADER_KIT_VERSION, sessions: {}, runs: [], failures: [] };
}

function normalizeInputs(namedInputs = {}) {
  return Object.fromEntries(Object.entries(namedInputs).map(([key, value]) => [key, Array.isArray(value) ? value.map(Number) : value]));
}

export function createOnnxLoaderKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const OnnxLoaderState = defineResource(config.resourceName ?? "onnxLoader.state");
  const OnnxSessionLoaded = defineEvent("onnx.sessionLoaded");
  const OnnxRunRequested = defineEvent("onnx.runRequested");
  const OnnxRunCompleted = defineEvent("onnx.runCompleted");
  const OnnxRunFailed = defineEvent("onnx.runFailed");

  return defineRuntimeKit({
    id: config.kitId ?? "onnx-loader-kit",
    requires: ["model:manifest"],
    provides: ["model:onnx-loader", "inference:onnx-dry-run"],
    resources: { OnnxLoaderState },
    events: { OnnxSessionLoaded, OnnxRunRequested, OnnxRunCompleted, OnnxRunFailed },
    systems: [],
    initWorld({ world }) { world.setResource(OnnxLoaderState, initialState()); },
    install({ engine, world }) {
      engine.onnx = {
        resources: { OnnxLoaderState },
        events: { OnnxSessionLoaded, OnnxRunRequested, OnnxRunCompleted, OnnxRunFailed },
        loadSession(modelId, options = {}) {
          const manifest = options.manifest ?? engine.modelManifest?.get?.(modelId) ?? null;
          if (manifest && manifest.runtime !== "onnx") {
            const failure = { modelId, reason: "manifest-runtime-not-onnx" };
            const previous = world.getResource(OnnxLoaderState) ?? initialState();
            world.setResource(OnnxLoaderState, { ...previous, failures: [failure, ...previous.failures].slice(0, 16) });
            world.emit(OnnxRunFailed, failure);
            return clone(failure);
          }
          const previous = world.getResource(OnnxLoaderState) ?? initialState();
          const session = { modelId, status: "loaded", dryRun: options.dryRun !== false, inputs: manifest?.expectedInputs ?? [], outputs: manifest?.expectedOutputs ?? [], loadedAtTick: world.__nexusClock?.frame ?? 0 };
          world.setResource(OnnxLoaderState, { ...previous, sessions: { ...previous.sessions, [modelId]: session } });
          world.emit(OnnxSessionLoaded, { modelId, session });
          return clone(session);
        },
        run(modelId, namedInputs = {}, options = {}) {
          let state = world.getResource(OnnxLoaderState) ?? initialState();
          if (!state.sessions[modelId]) this.loadSession(modelId, options);
          state = world.getResource(OnnxLoaderState) ?? state;
          const runId = `onnx-run-${state.runs.length + 1}`;
          const inputs = normalizeInputs(namedInputs);
          const output = clone(options.output ?? config.mockOutputs?.[modelId] ?? config.mockOutputs?.default ?? { logits: [1, 0], labels: ["observe", "warn"] });
          const run = { id: runId, modelId, inputs, output, status: "completed", requestedAtTick: world.__nexusClock?.frame ?? 0 };
          world.setResource(OnnxLoaderState, { ...state, runs: [run, ...state.runs].slice(0, 32) });
          world.emit(OnnxRunRequested, { modelId, runId, inputs });
          world.emit(OnnxRunCompleted, { modelId, runId, output });
          return clone(run);
        },
        failRun(modelId, reason = "onnx-run-failed") {
          const previous = world.getResource(OnnxLoaderState) ?? initialState();
          const failure = { modelId, reason: String(reason) };
          world.setResource(OnnxLoaderState, { ...previous, failures: [failure, ...previous.failures].slice(0, 16) });
          world.emit(OnnxRunFailed, failure);
          return clone(failure);
        },
        getSessionState(modelId) { return clone(world.getResource(OnnxLoaderState)?.sessions?.[modelId] ?? null); },
        dispose(modelId) {
          const previous = world.getResource(OnnxLoaderState) ?? initialState();
          const sessions = { ...previous.sessions };
          delete sessions[modelId];
          world.setResource(OnnxLoaderState, { ...previous, sessions });
          return true;
        },
        getState() { return clone(world.getResource(OnnxLoaderState)); }
      };
    },
    metadata: { purpose: "ONNX loader/session adapter with deterministic dry-run inference queue for browser and headless tests." }
  });
}

export default createOnnxLoaderKit;
