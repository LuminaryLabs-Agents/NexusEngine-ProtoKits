export const WEBXR_HIT_TEST_ADAPTER_DOMAIN_KIT_VERSION = "0.1.0";
export const WEBXR_HIT_TEST_ADAPTER_ENGINE_NAMESPACE = "webxrHitTestAdapter";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = NaN) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createWebXRHitTestAdapterDomainKit requires NexusEngine.${key}.`);
    }
  }
}

function finiteVector(value, fields, label) {
  const vector = Object.fromEntries(fields.map((field) => [field, toNumber(value?.[field])]));
  if (Object.values(vector).some((entry) => !Number.isFinite(entry))) {
    throw new TypeError(`${label} requires finite ${fields.join(", ")} values.`);
  }
  return vector;
}

function normalizeVector(value, fallback, label) {
  const vector = finiteVector(value ?? fallback, ["x", "y", "z"], label);
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length <= 1e-8) throw new TypeError(`${label} must be non-zero.`);
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function normalizeQuaternion(value) {
  const quaternion = finiteVector(value, ["x", "y", "z", "w"], "WebXR orientation");
  const length = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  if (length <= 1e-8) throw new TypeError("WebXR orientation must be non-zero.");
  return {
    x: quaternion.x / length,
    y: quaternion.y / length,
    z: quaternion.z / length,
    w: quaternion.w / length
  };
}

function normalizeMatrix(value) {
  if (value == null) return null;
  const matrix = Array.from(value, (entry) => toNumber(entry));
  if (matrix.length !== 16 || matrix.some((entry) => !Number.isFinite(entry))) {
    throw new TypeError("WebXR pose matrices require 16 finite values.");
  }
  return matrix;
}

function rotateByQuaternion(vector, quaternion) {
  const { x, y, z, w } = quaternion;
  const dot = x * vector.x + y * vector.y + z * vector.z;
  const unitSquared = x * x + y * y + z * z;
  const cross = {
    x: y * vector.z - z * vector.y,
    y: z * vector.x - x * vector.z,
    z: x * vector.y - y * vector.x
  };
  return normalizeVector({
    x: 2 * dot * x + (w * w - unitSquared) * vector.x + 2 * w * cross.x,
    y: 2 * dot * y + (w * w - unitSquared) * vector.y + 2 * w * cross.y,
    z: 2 * dot * z + (w * w - unitSquared) * vector.z + 2 * w * cross.z
  }, null, "WebXR surface normal");
}

function transformDirection(matrix, vector) {
  return normalizeVector({
    x: matrix[0] * vector.x + matrix[4] * vector.y + matrix[8] * vector.z,
    y: matrix[1] * vector.x + matrix[5] * vector.y + matrix[9] * vector.z,
    z: matrix[2] * vector.x + matrix[6] * vector.y + matrix[10] * vector.z
  }, null, "WebXR surface normal");
}

export function normalizeWebXRHitTestPose(pose = {}, options = {}) {
  const transform = pose.transform ?? pose;
  const matrix = normalizeMatrix(transform.matrix ?? pose.matrix);
  const rawPosition = transform.position ?? pose.position ?? (matrix ? { x: matrix[12], y: matrix[13], z: matrix[14] } : null);
  const position = finiteVector(rawPosition, ["x", "y", "z"], "WebXR hit-test position");
  const rawOrientation = transform.orientation ?? pose.orientation;
  const orientation = rawOrientation == null ? null : normalizeQuaternion(rawOrientation);
  const normalAxis = normalizeVector(options.normalAxis, { x: 0, y: 1, z: 0 }, "WebXR local normal axis");
  if (!orientation && !matrix) {
    throw new TypeError("WebXR hit-test poses require an orientation quaternion or transform matrix.");
  }
  return {
    position,
    orientation,
    matrix,
    normal: orientation ? rotateByQuaternion(normalAxis, orientation) : transformDirection(matrix, normalAxis)
  };
}

export function createSurfaceObservationFromWebXRHit(pose = {}, payload = {}, options = {}) {
  const normalized = normalizeWebXRHitTestPose(pose, options);
  const resultIndex = Math.max(0, Math.floor(toNumber(payload.resultIndex, 0)));
  const idPrefix = String(payload.idPrefix ?? options.idPrefix ?? "webxr-hit").trim() || "webxr-hit";
  const id = String(payload.id ?? payload.surfaceId ?? `${idPrefix}-${resultIndex}`).trim();
  if (!id) throw new TypeError("WebXR hit-test observations require a stable id.");
  return {
    id,
    position: normalized.position,
    normal: normalized.normal,
    confidence: Number.isFinite(toNumber(payload.confidence)) ? Math.min(1, Math.max(0, toNumber(payload.confidence))) : 1,
    source: String(payload.source ?? "webxr-hit-test"),
    metadata: {
      ...clone(payload.metadata ?? {}),
      entityType: payload.entityType ?? null,
      resultIndex,
      webxrPose: {
        orientation: normalized.orientation,
        matrix: normalized.matrix
      }
    }
  };
}

function createState(config = {}) {
  return {
    version: WEBXR_HIT_TEST_ADAPTER_DOMAIN_KIT_VERSION,
    id: String(config.stateId ?? "webxr-hit-test-adapter"),
    status: "idle",
    acceptedCount: 0,
    rejectedCount: 0,
    emptyFrameCount: 0,
    lastObservation: null,
    lastResult: null,
    updatedAtTick: 0
  };
}

function restoreState(snapshot, config = {}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("WebXR hit-test adapter snapshots must be objects.");
  }
  if (snapshot.version !== WEBXR_HIT_TEST_ADAPTER_DOMAIN_KIT_VERSION) {
    throw new TypeError(`Unsupported WebXR hit-test adapter snapshot version: ${snapshot.version}.`);
  }
  if (!["idle", "observing", "rejected", "no-results"].includes(snapshot.status)) {
    throw new TypeError(`Invalid WebXR hit-test adapter status: ${snapshot.status}.`);
  }
  return {
    ...createState({ ...config, stateId: snapshot.id ?? config.stateId }),
    status: snapshot.status,
    acceptedCount: Math.max(0, Math.floor(toNumber(snapshot.acceptedCount, 0))),
    rejectedCount: Math.max(0, Math.floor(toNumber(snapshot.rejectedCount, 0))),
    emptyFrameCount: Math.max(0, Math.floor(toNumber(snapshot.emptyFrameCount, 0))),
    lastObservation: clone(snapshot.lastObservation ?? null),
    lastResult: clone(snapshot.lastResult ?? null),
    updatedAtTick: Math.max(0, Math.floor(toNumber(snapshot.updatedAtTick, 0)))
  };
}

export function createWebXRHitTestAdapterDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineDomainServiceKit, defineResource, defineEvent } = NexusEngine;
  const maxResultsPerFrame = Math.max(1, Math.floor(toNumber(config.maxResultsPerFrame, 8)));
  const AdapterState = defineResource(config.resourceName ?? "webxrHitTestAdapter.state");
  const HitObserved = defineEvent("webxrHitTestAdapter.observed");
  const FrameObserved = defineEvent("webxrHitTestAdapter.frameObserved");
  const ObservationRejected = defineEvent("webxrHitTestAdapter.rejected");
  const AdapterReset = defineEvent("webxrHitTestAdapter.reset");

  function currentState(world) {
    return world.getResource(AdapterState) ?? createState(config);
  }

  function setState(world, state) {
    const next = { ...state, updatedAtTick: toNumber(world.__nexusClock?.frame, state.updatedAtTick) };
    world.setResource(AdapterState, next);
    return next;
  }

  function reject(world, reason, payload = {}) {
    const state = currentState(world);
    const result = { accepted: false, reason, ...clone(payload) };
    const next = setState(world, {
      ...state,
      status: reason === "no-hit-test-results" ? "no-results" : "rejected",
      rejectedCount: reason === "no-hit-test-results" ? state.rejectedCount : state.rejectedCount + 1,
      emptyFrameCount: reason === "no-hit-test-results" ? state.emptyFrameCount + 1 : state.emptyFrameCount,
      lastResult: result
    });
    if (reason !== "no-hit-test-results") world.emit(ObservationRejected, result);
    return { ...result, state: clone(next) };
  }

  function candidateApi(engine) {
    const api = engine.n?.spatialSurfaceCandidate;
    if (!api || typeof api.observe !== "function") {
      throw new TypeError("WebXR hit-test adapter requires engine.n.spatialSurfaceCandidate.observe.");
    }
    return api;
  }

  function observePose(engine, world, pose, payload = {}) {
    let observation;
    try {
      observation = createSurfaceObservationFromWebXRHit(pose, payload, config);
    } catch (error) {
      return reject(world, "invalid-hit-test-pose", { message: error.message });
    }
    const result = candidateApi(engine).observe(observation);
    const state = currentState(world);
    const next = setState(world, {
      ...state,
      status: result.accepted ? "observing" : "rejected",
      acceptedCount: state.acceptedCount + (result.accepted ? 1 : 0),
      rejectedCount: state.rejectedCount + (result.accepted ? 0 : 1),
      lastObservation: observation,
      lastResult: clone(result)
    });
    if (result.accepted) world.emit(HitObserved, observation);
    else world.emit(ObservationRejected, { reason: result.reason ?? "candidate-rejected", observation });
    return { ...clone(result), observation: clone(observation), state: clone(next) };
  }

  function observeResult(engine, world, result, referenceSpace, payload = {}) {
    if (!result || typeof result.getPose !== "function") {
      return reject(world, "invalid-hit-test-result");
    }
    let pose;
    try {
      pose = result.getPose(referenceSpace);
    } catch (error) {
      return reject(world, "hit-test-pose-failed", { message: error.message });
    }
    if (!pose) return reject(world, "hit-test-pose-unavailable");
    return observePose(engine, world, pose, payload);
  }

  function observeFrame(engine, world, frame, hitTestSource, referenceSpace, payload = {}) {
    if (!frame || typeof frame.getHitTestResults !== "function") {
      return reject(world, "invalid-xr-frame");
    }
    let results;
    try {
      results = Array.from(frame.getHitTestResults(hitTestSource) ?? []);
    } catch (error) {
      return reject(world, "hit-test-results-failed", { message: error.message });
    }
    if (results.length === 0) return reject(world, "no-hit-test-results");
    const resultIds = Array.isArray(payload.resultIds) ? payload.resultIds : [];
    const processed = results.slice(0, maxResultsPerFrame).map((result, resultIndex) => observeResult(engine, world, result, referenceSpace, {
      ...payload,
      id: resultIds[resultIndex] ?? (resultIndex === 0 ? payload.id ?? payload.surfaceId : undefined),
      surfaceId: undefined,
      resultIndex
    }));
    const summary = {
      accepted: processed.some((entry) => entry.accepted),
      resultCount: results.length,
      processedCount: processed.length,
      acceptedCount: processed.filter((entry) => entry.accepted).length,
      rejectedCount: processed.filter((entry) => !entry.accepted).length,
      results: processed
    };
    world.emit(FrameObserved, clone(summary));
    return summary;
  }

  function reset(world, payload = {}) {
    const next = setState(world, createState({ ...config, stateId: payload.stateId ?? config.stateId }));
    world.emit(AdapterReset, { reason: payload.reason ?? "reset" });
    return clone(next);
  }

  function loadSnapshot(world, snapshot) {
    const next = restoreState(snapshot, config);
    world.setResource(AdapterState, next);
    return clone(next);
  }

  return defineDomainServiceKit({
    id: config.kitId ?? config.id ?? "webxr-hit-test-adapter-domain-kit",
    domain: "webxr-hit-test-adapter",
    domainPath: "n:spatial-placement:webxr-hit-test-adapter",
    parentDomainPath: "n:spatial-placement",
    apiName: WEBXR_HIT_TEST_ADAPTER_ENGINE_NAMESPACE,
    stability: "experimental",
    version: WEBXR_HIT_TEST_ADAPTER_DOMAIN_KIT_VERSION,
    services: ["pose-observation", "frame-observation"],
    requires: ["n:spatial-placement:surface-candidate"],
    provides: ["spatial:webxr-hit-observation", "spatial:webxr-frame-observation"],
    resources: { AdapterState },
    events: { HitObserved, FrameObserved, ObservationRejected, AdapterReset },
    initWorld({ world }) { world.setResource(AdapterState, createState(config)); },
    createApi({ engine, world }) {
      return {
        resources: { AdapterState },
        events: { HitObserved, FrameObserved, ObservationRejected, AdapterReset },
        observePose: (pose, payload) => observePose(engine, world, pose, payload),
        observeResult: (result, referenceSpace, payload) => observeResult(engine, world, result, referenceSpace, payload),
        observeFrame: (frame, hitTestSource, referenceSpace, payload) => observeFrame(engine, world, frame, hitTestSource, referenceSpace, payload),
        reset: (payload) => reset(world, payload),
        loadSnapshot: (snapshot) => loadSnapshot(world, snapshot),
        getState: () => clone(currentState(world)),
        getSnapshot: () => clone(currentState(world))
      };
    },
    metadata: {
      version: WEBXR_HIT_TEST_ADAPTER_DOMAIN_KIT_VERSION,
      status: "experimental",
      parentDomain: "spatial-placement",
      scope: "adapter-domain",
      composes: ["spatial-surface-candidate-domain-kit"],
      ownsLoop: false,
      purpose: "Converts WebXR hit-test poses and frames into plain spatial surface observations without retaining host objects."
    }
  });
}

export default createWebXRHitTestAdapterDomainKit;
