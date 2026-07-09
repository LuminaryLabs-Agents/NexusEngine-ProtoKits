export const SPATIAL_SURFACE_CANDIDATE_DOMAIN_KIT_VERSION = "0.1.0";
export const SPATIAL_SURFACE_CANDIDATE_ENGINE_NAMESPACE = "spatialSurfaceCandidate";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function requireNexus(NexusEngine) {
  for (const key of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createSpatialSurfaceCandidateDomainKit requires NexusEngine.${key}.`);
    }
  }
}

function vec3(value = {}, fallback = {}) {
  return {
    x: toNumber(value.x, toNumber(fallback.x, 0)),
    y: toNumber(value.y, toNumber(fallback.y, 0)),
    z: toNumber(value.z, toNumber(fallback.z, 0))
  };
}

function normalizeVector(value = {}, fallback = {}) {
  const vector = vec3(value, fallback);
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length <= 1e-8) throw new TypeError("Surface candidate normals must be non-zero vectors.");
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function distance(a = {}, b = {}) {
  return Math.hypot(toNumber(a.x) - toNumber(b.x), toNumber(a.y) - toNumber(b.y), toNumber(a.z) - toNumber(b.z));
}

function dot(a = {}, b = {}) {
  return toNumber(a.x) * toNumber(b.x) + toNumber(a.y) * toNumber(b.y) + toNumber(a.z) * toNumber(b.z);
}

export function classifySurfaceOrientation(normal = {}, options = {}) {
  const value = normalizeVector(normal);
  const threshold = clamp(toNumber(options.horizontalThreshold, 0.75), 0.5, 1);
  if (Math.abs(value.y) < threshold) return "vertical";
  return value.y >= 0 ? "horizontal-up" : "horizontal-down";
}

export function normalizeSurfaceObservation(observation = {}, options = {}) {
  const id = String(observation.id ?? observation.surfaceId ?? "").trim();
  if (!id) throw new TypeError("Surface observations require a stable id.");
  const position = vec3(observation.position ?? observation.pose?.position);
  const normal = normalizeVector(observation.normal ?? observation.pose?.normal);
  return {
    id,
    position,
    normal,
    orientation: observation.orientation ?? classifySurfaceOrientation(normal, options),
    confidence: clamp(toNumber(observation.confidence, 1)),
    source: String(observation.source ?? "host-observation"),
    metadata: clone(observation.metadata ?? {})
  };
}

function createState(config = {}) {
  return {
    version: SPATIAL_SURFACE_CANDIDATE_DOMAIN_KIT_VERSION,
    id: String(config.stateId ?? "spatial-surface-candidates"),
    status: "searching",
    candidateIds: [],
    candidatesById: {},
    selectedCandidateId: null,
    lastResult: null,
    rejections: [],
    updatedAtTick: 0
  };
}

function restoreState(snapshot, config = {}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("Spatial surface candidate snapshots must be objects.");
  }
  if (snapshot.version !== SPATIAL_SURFACE_CANDIDATE_DOMAIN_KIT_VERSION) {
    throw new TypeError(`Unsupported spatial surface candidate snapshot version: ${snapshot.version}.`);
  }

  const candidateIds = Array.from(new Set(asArray(snapshot.candidateIds).map((id) => String(id))));
  const candidatesById = {};
  for (const id of candidateIds) {
    const candidate = snapshot.candidatesById?.[id];
    if (!candidate || candidate.id !== id) {
      throw new TypeError(`Spatial surface candidate snapshot is missing candidate ${id}.`);
    }
    const normalized = normalizeSurfaceObservation(candidate, config);
    candidatesById[id] = {
      ...normalized,
      stableFrames: Math.max(1, Math.floor(toNumber(candidate.stableFrames, 1))),
      status: candidate.status === "stable" ? "stable" : "tracking",
      firstObservedAtTick: Math.max(0, Math.floor(toNumber(candidate.firstObservedAtTick, 0))),
      lastObservedAtTick: Math.max(0, Math.floor(toNumber(candidate.lastObservedAtTick, 0)))
    };
  }

  const selectedCandidateId = snapshot.selectedCandidateId == null ? null : String(snapshot.selectedCandidateId);
  if (selectedCandidateId && !candidatesById[selectedCandidateId]) {
    throw new TypeError(`Spatial surface candidate snapshot selects unknown candidate ${selectedCandidateId}.`);
  }
  const statuses = new Set(["searching", "tracking", "surface-found", "selected"]);
  if (!statuses.has(snapshot.status)) {
    throw new TypeError(`Spatial surface candidate snapshot has invalid status ${snapshot.status}.`);
  }

  return {
    ...createState({ ...config, stateId: snapshot.id ?? config.stateId }),
    status: snapshot.status,
    candidateIds,
    candidatesById,
    selectedCandidateId,
    lastResult: clone(snapshot.lastResult ?? null),
    rejections: clone(asArray(snapshot.rejections)),
    updatedAtTick: Math.max(0, Math.floor(toNumber(snapshot.updatedAtTick, 0)))
  };
}

function candidateDescriptor(candidate) {
  return {
    id: candidate.id,
    kind: "spatial-surface-candidate",
    status: candidate.status,
    orientation: candidate.orientation,
    confidence: candidate.confidence,
    stableFrames: candidate.stableFrames,
    position: clone(candidate.position),
    normal: clone(candidate.normal),
    source: candidate.source,
    metadata: clone(candidate.metadata)
  };
}

function preferredRank(candidate, preferredOrientations) {
  const rank = preferredOrientations.indexOf(candidate.orientation);
  return rank < 0 ? preferredOrientations.length : rank;
}

export function createSpatialSurfaceCandidateDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineDomainServiceKit, defineResource, defineEvent } = NexusEngine;
  const stableFramesRequired = Math.max(1, Math.floor(toNumber(config.stableFramesRequired, 3)));
  const minConfidence = clamp(toNumber(config.minConfidence, 0.65));
  const maxPositionDelta = Math.max(0, toNumber(config.maxPositionDelta, 0.08));
  const minNormalDot = clamp(toNumber(config.minNormalDot, 0.94), -1, 1);
  const maxCandidates = Math.max(1, Math.floor(toNumber(config.maxCandidates, 32)));
  const allowedOrientations = new Set(asArray(config.allowedOrientations ?? ["vertical", "horizontal-up", "horizontal-down"]));
  const preferredOrientations = asArray(config.preferredOrientations ?? ["vertical", "horizontal-up", "horizontal-down"]);

  const SurfaceCandidateState = defineResource(config.resourceName ?? "spatialSurfaceCandidate.state");
  const SurfaceObserved = defineEvent("spatialSurfaceCandidate.observed");
  const SurfaceStabilized = defineEvent("spatialSurfaceCandidate.stabilized");
  const SurfaceSelected = defineEvent("spatialSurfaceCandidate.selected");
  const SurfaceRemoved = defineEvent("spatialSurfaceCandidate.removed");
  const SurfaceRejected = defineEvent("spatialSurfaceCandidate.rejected");
  const SurfaceReset = defineEvent("spatialSurfaceCandidate.reset");

  function currentState(world) {
    return world.getResource(SurfaceCandidateState) ?? createState(config);
  }

  function setState(world, state) {
    const next = { ...state, updatedAtTick: toNumber(world.__nexusClock?.frame, state.updatedAtTick) };
    world.setResource(SurfaceCandidateState, next);
    return next;
  }

  function reject(world, reason, payload = {}) {
    const state = currentState(world);
    const rejection = { reason, ...clone(payload) };
    const next = setState(world, { ...state, lastResult: rejection, rejections: [...state.rejections, rejection] });
    world.emit(SurfaceRejected, rejection);
    return { accepted: false, reason, state: clone(next) };
  }

  function observe(world, observation = {}) {
    let normalized;
    try {
      normalized = normalizeSurfaceObservation(observation, config);
    } catch (error) {
      return reject(world, "invalid-observation", { message: error.message });
    }
    if (!allowedOrientations.has(normalized.orientation)) {
      return reject(world, "orientation-not-allowed", { candidateId: normalized.id, orientation: normalized.orientation });
    }
    const state = currentState(world);
    const previous = state.candidatesById[normalized.id];
    if (!previous && state.candidateIds.length >= maxCandidates) {
      return reject(world, "candidate-limit", { candidateId: normalized.id, maxCandidates });
    }
    const consistent = previous && distance(previous.position, normalized.position) <= maxPositionDelta && dot(previous.normal, normalized.normal) >= minNormalDot;
    const stableFrames = consistent ? previous.stableFrames + 1 : 1;
    const stable = stableFrames >= stableFramesRequired && normalized.confidence >= minConfidence;
    const candidate = {
      ...normalized,
      stableFrames,
      status: stable ? "stable" : "tracking",
      firstObservedAtTick: previous?.firstObservedAtTick ?? toNumber(world.__nexusClock?.frame, 0),
      lastObservedAtTick: toNumber(world.__nexusClock?.frame, 0)
    };
    const next = setState(world, {
      ...state,
      status: state.selectedCandidateId ? "selected" : stable ? "surface-found" : "tracking",
      candidateIds: previous ? state.candidateIds : [...state.candidateIds, candidate.id],
      candidatesById: { ...state.candidatesById, [candidate.id]: candidate },
      lastResult: { accepted: true, candidateId: candidate.id, status: candidate.status }
    });
    world.emit(SurfaceObserved, candidateDescriptor(candidate));
    if (stable && previous?.status !== "stable") world.emit(SurfaceStabilized, candidateDescriptor(candidate));
    return { accepted: true, candidate: clone(candidate), state: clone(next) };
  }

  function stableCandidates(state) {
    return state.candidateIds
      .map((id) => state.candidatesById[id])
      .filter((candidate) => candidate?.status === "stable")
      .sort((a, b) => preferredRank(a, preferredOrientations) - preferredRank(b, preferredOrientations) || b.confidence - a.confidence || b.stableFrames - a.stableFrames || a.id.localeCompare(b.id));
  }

  function select(world, candidateId = null, payload = {}) {
    const state = currentState(world);
    const candidate = candidateId ? state.candidatesById[candidateId] : stableCandidates(state)[0];
    if (!candidate) return reject(world, "no-surface-candidate", { candidateId });
    if (candidate.status !== "stable" && payload.allowUnstable !== true) {
      return reject(world, "surface-not-stable", { candidateId: candidate.id, stableFrames: candidate.stableFrames });
    }
    const next = setState(world, { ...state, status: "selected", selectedCandidateId: candidate.id, lastResult: { accepted: true, candidateId: candidate.id, status: "selected" } });
    const descriptor = candidateDescriptor(candidate);
    world.emit(SurfaceSelected, descriptor);
    return { accepted: true, candidate: clone(candidate), descriptor, state: clone(next) };
  }

  function remove(world, candidateId) {
    const state = currentState(world);
    if (!state.candidatesById[candidateId]) return reject(world, "unknown-surface-candidate", { candidateId });
    const candidatesById = { ...state.candidatesById };
    delete candidatesById[candidateId];
    const candidateIds = state.candidateIds.filter((id) => id !== candidateId);
    const selectedCandidateId = state.selectedCandidateId === candidateId ? null : state.selectedCandidateId;
    const next = setState(world, { ...state, status: selectedCandidateId ? "selected" : candidateIds.length ? "tracking" : "searching", candidateIds, candidatesById, selectedCandidateId, lastResult: { accepted: true, candidateId, status: "removed" } });
    world.emit(SurfaceRemoved, { candidateId });
    return { accepted: true, state: clone(next) };
  }

  function reset(world, payload = {}) {
    const next = setState(world, createState({ ...config, stateId: payload.stateId ?? config.stateId }));
    world.emit(SurfaceReset, { reason: payload.reason ?? "reset" });
    return clone(next);
  }

  function loadSnapshot(world, snapshot) {
    const next = restoreState(snapshot, config);
    world.setResource(SurfaceCandidateState, next);
    return clone(next);
  }

  return defineDomainServiceKit({
    id: config.kitId ?? config.id ?? "spatial-surface-candidate-domain-kit",
    domain: "spatial-surface-candidate",
    domainPath: "n:spatial-placement:surface-candidate",
    parentDomainPath: "n:spatial-placement",
    apiName: SPATIAL_SURFACE_CANDIDATE_ENGINE_NAMESPACE,
    stability: "experimental",
    version: SPATIAL_SURFACE_CANDIDATE_DOMAIN_KIT_VERSION,
    services: ["observation", "selection"],
    provides: ["n:spatial:surface-candidate", "spatial:surface-observation", "spatial:surface-selection"],
    resources: { SurfaceCandidateState },
    events: { SurfaceObserved, SurfaceStabilized, SurfaceSelected, SurfaceRemoved, SurfaceRejected, SurfaceReset },
    initWorld({ world }) { world.setResource(SurfaceCandidateState, createState(config)); },
    createApi({ world }) {
      return {
        resources: { SurfaceCandidateState },
        events: { SurfaceObserved, SurfaceStabilized, SurfaceSelected, SurfaceRemoved, SurfaceRejected, SurfaceReset },
        observe: (observation) => observe(world, observation),
        select: (candidateId, payload) => select(world, candidateId, payload),
        remove: (candidateId) => remove(world, candidateId),
        reset: (payload) => reset(world, payload),
        loadSnapshot: (snapshot) => loadSnapshot(world, snapshot),
        getState: () => clone(currentState(world)),
        getSnapshot: () => clone(currentState(world)),
        getCandidates: () => currentState(world).candidateIds.map((id) => clone(currentState(world).candidatesById[id])),
        getStableCandidates: () => clone(stableCandidates(currentState(world))),
        getSelected: () => clone(currentState(world).candidatesById[currentState(world).selectedCandidateId] ?? null),
        getDescriptors: () => currentState(world).candidateIds.map((id) => candidateDescriptor(currentState(world).candidatesById[id]))
      };
    },
    metadata: {
      version: SPATIAL_SURFACE_CANDIDATE_DOMAIN_KIT_VERSION,
      status: "experimental",
      parentDomain: "spatial-placement",
      scope: "atomic-domain",
      composes: [],
      ownsLoop: false,
      purpose: "Normalizes host-produced surface observations into deterministic, stable, selectable spatial placement candidates."
    }
  });
}

export default createSpatialSurfaceCandidateDomainKit;
