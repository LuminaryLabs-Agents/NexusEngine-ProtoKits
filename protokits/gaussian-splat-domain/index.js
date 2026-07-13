export const GAUSSIAN_SPLAT_DOMAIN_VERSION = "0.1.0";
export const GAUSSIAN_SPLAT_DOMAIN_PATH = "n:gaussian-splat";

const clone = (value) => value === undefined ? undefined : structuredClone(value);
const list = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const stableId = (value, label = "Value") => {
  const next = String(value ?? "").trim();
  if (!next) throw new TypeError(`${label} requires a stable id.`);
  return next;
};
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine, factory) {
  for (const key of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`${factory} requires NexusEngine.${key}.`);
  }
}

function createStoreKit(NexusEngine, spec, config, initialState, createServices) {
  requireNexus(NexusEngine, spec.factory);
  const State = NexusEngine.defineResource(`${spec.path.slice(2).replaceAll(":", ".")}.state`);
  const events = Object.fromEntries(spec.events.map((name) => [name, NexusEngine.defineEvent(`gaussianSplat.${name}`)]));
  return NexusEngine.defineDomainServiceKit({
    id: config.id ?? spec.id,
    domain: spec.domain,
    domainPath: spec.path,
    parentDomainPath: spec.parent,
    apiName: config.apiName ?? spec.apiName,
    version: GAUSSIAN_SPLAT_DOMAIN_VERSION,
    stability: config.stability ?? "protokit",
    services: [...spec.services, "snapshot", "reset"],
    provides: spec.provides,
    requires: config.requires ?? [],
    resources: { State },
    events,
    metadata: {
      purpose: spec.purpose,
      rendererAgnostic: spec.rendererAgnostic !== false,
      serializableState: true,
      deterministic: true,
      ...(config.metadata ?? {})
    },
    initWorld({ world }) { world.setResource(State, clone(initialState)); },
    createApi({ engine, world }) {
      const read = () => world.getResource(State) ?? clone(initialState);
      const write = (next) => { world.setResource(State, clone(next)); return clone(next); };
      const emit = (name, payload = {}) => world.emit(events[name], clone(payload));
      const commit = (result, mutate, eventName) => {
        const current = read();
        const next = mutate ? mutate(clone(current)) : current;
        next.revision = finite(current.revision, 0) + 1;
        next.lastResult = clone(result);
        next.journal = [...list(current.journal), clone(result)].slice(-256);
        write(next);
        if (eventName) emit(eventName, result);
        return clone(result);
      };
      const reject = (reason, details = {}) => commit({ ok: false, reason, ...clone(details) }, null, "command.rejected");
      return Object.freeze({
        ...createServices({ engine, read, write, commit, reject, emit, config }),
        getState: () => clone(read()),
        getSnapshot: () => clone(read()),
        loadSnapshot(snapshot = {}) { return write({ ...clone(initialState), ...clone(snapshot) }); },
        reset() { write(initialState); emit("reset", { domainPath: spec.path }); return clone(initialState); }
      });
    }
  });
}

function projectDescriptor(input = {}) {
  return {
    id: stableId(input.id, "Gaussian splat project"),
    status: String(input.status ?? "initialized"),
    stage: String(input.stage ?? "source"),
    capturePlanId: input.capturePlanId ?? null,
    sourceSetId: input.sourceSetId ?? null,
    reconstructionJobId: input.reconstructionJobId ?? null,
    assetIds: list(input.assetIds).map(String),
    blockers: list(input.blockers).map(String),
    warnings: list(input.warnings).map(String),
    metadata: clone(input.metadata ?? {}),
    revision: finite(input.revision, 1)
  };
}

export function createGaussianSplatProjectKit(NexusEngine, config = {}) {
  const initial = { schema: "nexusengine.gaussian-splat.project/1", projects: {}, revision: 1, journal: [], lastResult: null };
  return createStoreKit(NexusEngine, {
    factory: "createGaussianSplatProjectKit", id: "gaussian-splat-project-domain-kit", domain: "gaussian-splat-project",
    path: "n:gaussian-splat:project", parent: GAUSSIAN_SPLAT_DOMAIN_PATH, apiName: "gaussianSplatProject",
    purpose: "Project lifecycle, stage, blocker, warning, and relationship authority for Gaussian splat work.",
    services: ["projects", "lifecycle", "blockers", "history"], provides: ["gaussian-splat:projects"],
    events: ["project.created", "project.updated", "project.blocked", "project.unblocked", "project.completed", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject }) => ({
    createProject(input = {}) {
      const value = projectDescriptor(input);
      if (read().projects[value.id]) return reject("project-already-exists", { projectId: value.id });
      commit({ ok: true, projectId: value.id }, (state) => ({ ...state, projects: { ...state.projects, [value.id]: value } }), "project.created");
      return clone(value);
    },
    getProject(id) { return clone(read().projects[String(id)] ?? null); },
    listProjects() { return Object.values(read().projects).map(clone); },
    updateProject(id, patch = {}) {
      const current = read().projects[String(id)];
      if (!current) return reject("unknown-project", { projectId: id });
      const next = projectDescriptor({ ...current, ...clone(patch), id: current.id, revision: current.revision + 1 });
      commit({ ok: true, projectId: current.id }, (state) => ({ ...state, projects: { ...state.projects, [current.id]: next } }), "project.updated");
      return clone(next);
    },
    addBlocker(id, blocker) {
      const current = read().projects[String(id)]; if (!current) return reject("unknown-project", { projectId: id });
      return this.updateProject(id, { blockers: [...new Set([...current.blockers, String(blocker)])], status: "blocked" });
    },
    clearBlocker(id, blocker) {
      const current = read().projects[String(id)]; if (!current) return reject("unknown-project", { projectId: id });
      const blockers = current.blockers.filter((item) => item !== String(blocker));
      return this.updateProject(id, { blockers, status: blockers.length ? "blocked" : current.status === "blocked" ? "ready" : current.status });
    }
  }));
}

function sourceItem(input = {}) {
  return {
    id: stableId(input.id, "Source item"), uri: String(input.uri ?? ""), mediaType: String(input.mediaType ?? "application/octet-stream"),
    width: finite(input.width), height: finite(input.height), byteLength: finite(input.byteLength), checksum: input.checksum ?? null,
    cameraPoseId: input.cameraPoseId ?? null, accepted: input.accepted !== false, warnings: list(input.warnings).map(String), metadata: clone(input.metadata ?? {})
  };
}
export function createGaussianSplatSourceKit(NexusEngine, config = {}) {
  const initial = { schema: "nexusengine.gaussian-splat.source/1", sourceSets: {}, revision: 1, journal: [], lastResult: null };
  return createStoreKit(NexusEngine, {
    factory: "createGaussianSplatSourceKit", id: "gaussian-splat-source-domain-kit", domain: "gaussian-splat-source",
    path: "n:gaussian-splat:source", parent: GAUSSIAN_SPLAT_DOMAIN_PATH, apiName: "gaussianSplatSource",
    purpose: "Provider-neutral source media manifests and readiness for Gaussian splat reconstruction.",
    services: ["source-sets", "sources", "readiness"], provides: ["gaussian-splat:sources"],
    events: ["source-set.registered", "source.registered", "source.updated", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject }) => ({
    registerSourceSet(input = {}) {
      const id = stableId(input.id, "Source set"); if (read().sourceSets[id]) return reject("source-set-already-exists", { sourceSetId: id });
      const value = { id, projectId: input.projectId ?? null, sources: {}, metadata: clone(input.metadata ?? {}), revision: 1 };
      commit({ ok: true, sourceSetId: id }, (state) => ({ ...state, sourceSets: { ...state.sourceSets, [id]: value } }), "source-set.registered"); return clone(value);
    },
    registerSource(sourceSetId, input = {}) {
      const set = read().sourceSets[String(sourceSetId)]; if (!set) return reject("unknown-source-set", { sourceSetId });
      const value = sourceItem(input); if (set.sources[value.id]) return reject("source-already-exists", { sourceSetId, sourceId: value.id });
      const next = { ...set, sources: { ...set.sources, [value.id]: value }, revision: set.revision + 1 };
      commit({ ok: true, sourceSetId, sourceId: value.id }, (state) => ({ ...state, sourceSets: { ...state.sourceSets, [sourceSetId]: next } }), "source.registered"); return clone(value);
    },
    getSourceSet(id) { return clone(read().sourceSets[String(id)] ?? null); },
    getReadiness(id, requirements = {}) {
      const set = read().sourceSets[String(id)]; if (!set) return null;
      const sources = Object.values(set.sources); const accepted = sources.filter((item) => item.accepted);
      const minimum = finite(requirements.minimumImages, config.minimumImages ?? 20);
      return { sourceSetId: set.id, total: sources.length, accepted: accepted.length, minimumImages: minimum, ready: accepted.length >= minimum };
    }
  }));
}

export function createGaussianSplatValidationKit(NexusEngine, config = {}) {
  const initial = { schema: "nexusengine.gaussian-splat.validation/1", reports: {}, revision: 1, journal: [], lastResult: null };
  return createStoreKit(NexusEngine, {
    factory: "createGaussianSplatValidationKit", id: "gaussian-splat-validation-domain-kit", domain: "gaussian-splat-validation",
    path: "n:gaussian-splat:validation", parent: GAUSSIAN_SPLAT_DOMAIN_PATH, apiName: "gaussianSplatValidation",
    purpose: "Deterministic source and Gaussian asset validation reports.", services: ["reports", "source-validation", "asset-validation"],
    provides: ["gaussian-splat:validation"], events: ["validation.completed", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject, engine }) => ({
    validateSourceSet(sourceSetId, options = {}) {
      const source = engine.n?.gaussianSplatSource?.getSourceSet(sourceSetId); if (!source) return reject("unknown-source-set", { sourceSetId });
      const items = Object.values(source.sources); const accepted = items.filter((item) => item.accepted);
      const minimum = finite(options.minimumImages, config.minimumImages ?? 20);
      const blockers = accepted.length < minimum ? ["insufficient-image-count"] : [];
      const dimensions = new Set(accepted.map((item) => `${item.width}x${item.height}`));
      const warnings = dimensions.size > 1 ? ["mixed-dimensions"] : [];
      const id = String(options.id ?? `source-set:${sourceSetId}`);
      const report = { id, subjectType: "source-set", subjectId: sourceSetId, passed: blockers.length === 0, blockers, warnings, metrics: { imageCount: accepted.length, requiredImageCount: minimum }, revision: 1 };
      commit({ ok: true, reportId: id, passed: report.passed }, (state) => ({ ...state, reports: { ...state.reports, [id]: report } }), "validation.completed"); return clone(report);
    },
    validateGaussianPlyHeader(header, options = {}) {
      const text = String(header ?? ""); const required = options.requiredProperties ?? ["opacity", "scale_0", "scale_1", "scale_2", "rot_0", "f_dc_0"];
      const missing = required.filter((name) => !new RegExp(`\\bproperty\\s+\\w+\\s+${name}\\b`).test(text));
      const id = String(options.id ?? "asset-header"); const report = { id, subjectType: "gaussian-ply-header", subjectId: options.subjectId ?? null, passed: missing.length === 0, blockers: missing.map((name) => `missing-property:${name}`), warnings: [], metrics: { requiredPropertyCount: required.length, missingPropertyCount: missing.length }, revision: 1 };
      commit({ ok: true, reportId: id, passed: report.passed }, (state) => ({ ...state, reports: { ...state.reports, [id]: report } }), "validation.completed"); return clone(report);
    },
    getReport(id) { return clone(read().reports[String(id)] ?? null); }
  }));
}

function jobDescriptor(input = {}) {
  return { id: stableId(input.id, "Reconstruction job"), projectId: input.projectId ?? null, sourceSetId: input.sourceSetId ?? null,
    providerId: String(input.providerId ?? "manual"), pipeline: String(input.pipeline ?? "gaussian-splat-reconstruction"), status: String(input.status ?? "requested"),
    progress: Math.max(0, Math.min(1, finite(input.progress))), requestedFormat: String(input.requestedFormat ?? "ply"), settings: clone(input.settings ?? {}),
    resultAssetId: input.resultAssetId ?? null, blockers: list(input.blockers).map(String), failure: clone(input.failure ?? null), revision: finite(input.revision, 1) };
}
export function createGaussianSplatReconstructionKit(NexusEngine, config = {}) {
  const initial = { schema: "nexusengine.gaussian-splat.reconstruction/1", jobs: {}, revision: 1, journal: [], lastResult: null };
  return createStoreKit(NexusEngine, {
    factory: "createGaussianSplatReconstructionKit", id: "gaussian-splat-reconstruction-domain-kit", domain: "gaussian-splat-reconstruction",
    path: "n:gaussian-splat:reconstruction", parent: GAUSSIAN_SPLAT_DOMAIN_PATH, apiName: "gaussianSplatReconstruction",
    purpose: "Provider-neutral Gaussian reconstruction job lifecycle without owning provider execution.",
    services: ["jobs", "progress", "handoff"], provides: ["gaussian-splat:reconstruction"],
    events: ["reconstruction.requested", "reconstruction.handoff-required", "reconstruction.started", "reconstruction.progressed", "reconstruction.completed", "reconstruction.failed", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject }) => {
    const update = (id, patch, eventName) => { const current = read().jobs[String(id)]; if (!current) return reject("unknown-reconstruction-job", { jobId: id }); const next = jobDescriptor({ ...current, ...clone(patch), id: current.id, revision: current.revision + 1 }); commit({ ok: true, jobId: current.id, status: next.status }, (state) => ({ ...state, jobs: { ...state.jobs, [current.id]: next } }), eventName); return clone(next); };
    return {
      requestReconstruction(input = {}) { const value = jobDescriptor(input); if (read().jobs[value.id]) return reject("reconstruction-job-already-exists", { jobId: value.id }); commit({ ok: true, jobId: value.id }, (state) => ({ ...state, jobs: { ...state.jobs, [value.id]: value } }), "reconstruction.requested"); return clone(value); },
      markHandoffRequired(id, blocker = "manual-provider-upload-required") { return update(id, { status: "handoff-required", blockers: [String(blocker)] }, "reconstruction.handoff-required"); },
      beginReconstruction(id) { return update(id, { status: "running", blockers: [] }, "reconstruction.started"); },
      reportProgress(id, progress) { return update(id, { status: "running", progress }, "reconstruction.progressed"); },
      completeReconstruction(id, assetId) { return update(id, { status: "completed", progress: 1, resultAssetId: assetId, blockers: [] }, "reconstruction.completed"); },
      failReconstruction(id, failure) { return update(id, { status: "failed", failure: clone(failure) }, "reconstruction.failed"); },
      getJob(id) { return clone(read().jobs[String(id)] ?? null); }
    };
  });
}

function assetDescriptor(input = {}) {
  const format = String(input.format ?? "ply").toLowerCase();
  if (!["ply", "splat", "ksplat"].includes(format)) throw new TypeError(`Unsupported Gaussian splat format: ${format}.`);
  return { id: stableId(input.id, "Gaussian splat asset"), kind: "gaussian-splat", format, uri: String(input.uri ?? ""), checksum: input.checksum ?? null,
    byteLength: finite(input.byteLength), splatCount: finite(input.splatCount), sphericalHarmonicsDegree: finite(input.sphericalHarmonicsDegree),
    bounds: clone(input.bounds ?? null), coordinateSystem: String(input.coordinateSystem ?? "right-handed-y-up"),
    transform: clone(input.transform ?? { position: [0,0,0], rotation: [0,0,0,1], scale: [1,1,1] }), reconstructionJobId: input.reconstructionJobId ?? null,
    readiness: String(input.readiness ?? "ready"), fallbackAssetId: input.fallbackAssetId ?? null, provenance: clone(input.provenance ?? {}), revision: finite(input.revision, 1) };
}
export function createGaussianSplatAssetKit(NexusEngine, config = {}) {
  const initial = { schema: "nexusengine.gaussian-splat.asset/1", assets: {}, revision: 1, journal: [], lastResult: null };
  return createStoreKit(NexusEngine, {
    factory: "createGaussianSplatAssetKit", id: "gaussian-splat-asset-domain-kit", domain: "gaussian-splat-asset",
    path: "n:gaussian-splat:asset", parent: GAUSSIAN_SPLAT_DOMAIN_PATH, apiName: "gaussianSplatAsset",
    purpose: "Durable Gaussian splat asset identity, format, provenance, bounds, transform, and readiness.",
    services: ["assets", "readiness", "descriptors"], provides: ["asset:gaussian-splat", "gaussian-splat:assets"],
    events: ["asset.imported", "asset.updated", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject }) => ({
    importAsset(input = {}) { const value = assetDescriptor(input); if (read().assets[value.id]) return reject("asset-already-exists", { assetId: value.id }); commit({ ok: true, assetId: value.id }, (state) => ({ ...state, assets: { ...state.assets, [value.id]: value } }), "asset.imported"); return clone(value); },
    getAsset(id) { return clone(read().assets[String(id)] ?? null); },
    listAssets() { return Object.values(read().assets).map(clone); },
    updateAsset(id, patch = {}) { const current = read().assets[String(id)]; if (!current) return reject("unknown-asset", { assetId: id }); const next = assetDescriptor({ ...current, ...clone(patch), id: current.id, revision: current.revision + 1 }); commit({ ok: true, assetId: id }, (state) => ({ ...state, assets: { ...state.assets, [id]: next } }), "asset.updated"); return clone(next); }
  }));
}

function instanceDescriptor(input = {}) {
  return { id: stableId(input.id, "Gaussian splat instance"), assetId: stableId(input.assetId, "Gaussian splat instance asset"), visible: input.visible !== false,
    transform: clone(input.transform ?? { position: [0,0,0], rotation: [0,0,0,1], scale: [1,1,1] }), opacity: Math.max(0, Math.min(1, finite(input.opacity, 1))),
    alphaRemovalThreshold: finite(input.alphaRemovalThreshold, 5), progressiveLoad: input.progressiveLoad !== false, renderLayer: String(input.renderLayer ?? "world-static"),
    qualityProfile: String(input.qualityProfile ?? "desktop-balanced"), sortPolicy: String(input.sortPolicy ?? "renderer-default"), metadata: clone(input.metadata ?? {}), revision: finite(input.revision, 1) };
}
export function createGaussianSplatPresentationKit(NexusEngine, config = {}) {
  const initial = { schema: "nexusengine.gaussian-splat.presentation/1", instances: {}, revision: 1, journal: [], lastResult: null };
  return createStoreKit(NexusEngine, {
    factory: "createGaussianSplatPresentationKit", id: "gaussian-splat-presentation-domain-kit", domain: "gaussian-splat-presentation",
    path: "n:gaussian-splat:presentation", parent: GAUSSIAN_SPLAT_DOMAIN_PATH, apiName: "gaussianSplatPresentation",
    purpose: "Renderer-neutral Gaussian splat instance and quality descriptors.", services: ["instances", "descriptors", "quality"],
    provides: ["render:gaussian-splat-descriptors", "gaussian-splat:presentation"], events: ["instance.created", "instance.updated", "instance.removed", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject }) => ({
    createInstance(input = {}) { const value = instanceDescriptor(input); if (read().instances[value.id]) return reject("instance-already-exists", { instanceId: value.id }); commit({ ok: true, instanceId: value.id }, (state) => ({ ...state, instances: { ...state.instances, [value.id]: value } }), "instance.created"); return clone(value); },
    updateInstance(id, patch = {}) { const current = read().instances[String(id)]; if (!current) return reject("unknown-instance", { instanceId: id }); const next = instanceDescriptor({ ...current, ...clone(patch), id: current.id, assetId: current.assetId, revision: current.revision + 1 }); commit({ ok: true, instanceId: id }, (state) => ({ ...state, instances: { ...state.instances, [id]: next } }), "instance.updated"); return clone(next); },
    removeInstance(id) { if (!read().instances[String(id)]) return reject("unknown-instance", { instanceId: id }); commit({ ok: true, instanceId: id }, (state) => { const instances = { ...state.instances }; delete instances[id]; return { ...state, instances }; }, "instance.removed"); return true; },
    getInstance(id) { return clone(read().instances[String(id)] ?? null); },
    getDescriptors() { return Object.values(read().instances).map(clone); }
  }));
}

export function createManualGaussianSplatProviderAdapter(config = {}) {
  return Object.freeze({
    id: config.id ?? "manual-gaussian-splat-provider", kind: "gaussian-splat-reconstruction-provider",
    capabilities: Object.freeze({ reconstruction: true, editing: false, localExecution: false, manualHandoff: true, supportedInputs: ["image-set"], supportedOutputs: ["ply", "splat", "ksplat"] }),
    createJobDescriptor(request = {}) { return jobDescriptor({ ...request, providerId: config.providerId ?? request.providerId ?? "manual", status: "handoff-required", blockers: ["manual-provider-upload-required"] }); },
    prepareHandoff(request = {}) { return { providerId: config.providerId ?? request.providerId ?? "manual", requiresManualUpload: true, uploadBundleUri: request.uploadBundleUri ?? null, instructions: list(config.instructions ?? request.instructions).map(String) }; },
    inspectResult(result = {}) { return { accepted: ["ply", "splat", "ksplat"].includes(String(result.format ?? "").toLowerCase()), format: String(result.format ?? "").toLowerCase(), uri: result.uri ?? null }; },
    normalizeImportedAsset(result = {}) { return assetDescriptor(result); }
  });
}

export function createThreeGaussianSplatRendererAdapter(config = {}) {
  const handles = new Map();
  return Object.freeze({
    id: config.id ?? "three-gaussian-splat-renderer", kind: "gaussian-splat-renderer-adapter",
    supports(asset) { return asset?.kind === "gaussian-splat" && ["ply", "splat", "ksplat"].includes(asset.format); },
    async createInstance(descriptor, host = {}) {
      if (typeof host.createViewer !== "function") throw new TypeError("Three Gaussian splat adapter requires host.createViewer().");
      const handle = await host.createViewer(clone(descriptor)); handles.set(descriptor.id, handle);
      return { id: descriptor.id, ready: true };
    },
    async updateInstance(id, descriptor, host = {}) { const handle = handles.get(id); await host.updateViewer?.(handle, clone(descriptor)); return { id, ready: Boolean(handle) }; },
    setCamera(id, cameraDescriptor, host = {}) { const handle = handles.get(id); host.setViewerCamera?.(handle, clone(cameraDescriptor)); },
    reportReadiness(id) { return { id, ready: handles.has(id) }; },
    async disposeInstance(id, host = {}) { const handle = handles.get(id); if (handle) await host.disposeViewer?.(handle); handles.delete(id); return true; }
  });
}

export function createGaussianSplatDomain(NexusEngine, config = {}) {
  requireNexus(NexusEngine, "createGaussianSplatDomain");
  const State = NexusEngine.defineResource("gaussian.splat.state");
  const Reset = NexusEngine.defineEvent("gaussianSplat.reset");
  return NexusEngine.defineDomainServiceKit({
    id: config.id ?? "gaussian-splat-domain-kit", domain: "gaussian-splat", domainPath: GAUSSIAN_SPLAT_DOMAIN_PATH,
    apiName: config.apiName ?? "gaussianSplat", version: GAUSSIAN_SPLAT_DOMAIN_VERSION, stability: config.stability ?? "protokit",
    services: ["project", "source", "validation", "reconstruction", "asset", "presentation", "snapshot", "reset"],
    requires: ["gaussian-splat:projects", "gaussian-splat:sources", "gaussian-splat:validation", "gaussian-splat:reconstruction", "gaussian-splat:assets", "gaussian-splat:presentation"],
    resources: { State }, events: { Reset }, metadata: { purpose: "Composed authority for the provider-neutral Gaussian splat lifecycle.", subdomains: ["project", "source", "validation", "reconstruction", "asset", "presentation"] },
    initWorld({ world }) { world.setResource(State, { schema: "nexusengine.gaussian-splat/1", version: GAUSSIAN_SPLAT_DOMAIN_VERSION, revision: 1 }); },
    createApi({ engine, world }) {
      const domains = () => ({ project: engine.n.gaussianSplatProject, source: engine.n.gaussianSplatSource, validation: engine.n.gaussianSplatValidation, reconstruction: engine.n.gaussianSplatReconstruction, asset: engine.n.gaussianSplatAsset, presentation: engine.n.gaussianSplatPresentation });
      return Object.freeze({
        getSubdomains: domains,
        createProject: (...args) => domains().project.createProject(...args),
        registerSourceSet: (...args) => domains().source.registerSourceSet(...args),
        validateSourceSet: (...args) => domains().validation.validateSourceSet(...args),
        requestReconstruction: (...args) => domains().reconstruction.requestReconstruction(...args),
        importAsset: (...args) => domains().asset.importAsset(...args),
        createInstance: (...args) => domains().presentation.createInstance(...args),
        getProjectStatus(id) { return { project: domains().project.getProject(id), reconstruction: domains().reconstruction.getState(), assets: domains().asset.listAssets(), instances: domains().presentation.getDescriptors() }; },
        getSnapshot() { const d = domains(); return { version: GAUSSIAN_SPLAT_DOMAIN_VERSION, project: d.project.getSnapshot(), source: d.source.getSnapshot(), validation: d.validation.getSnapshot(), reconstruction: d.reconstruction.getSnapshot(), asset: d.asset.getSnapshot(), presentation: d.presentation.getSnapshot() }; },
        loadSnapshot(snapshot = {}) { const d = domains(); for (const key of Object.keys(d)) if (snapshot[key]) d[key].loadSnapshot(snapshot[key]); return this.getSnapshot(); },
        reset() { const d = domains(); for (const api of Object.values(d)) api.reset(); world.emit(Reset, {}); return this.getSnapshot(); }
      });
    }
  });
}

export function createGaussianSplatKits(NexusEngine, config = {}) {
  return [
    createGaussianSplatProjectKit(NexusEngine, config.project ?? {}),
    createGaussianSplatSourceKit(NexusEngine, config.source ?? {}),
    createGaussianSplatValidationKit(NexusEngine, config.validation ?? {}),
    createGaussianSplatReconstructionKit(NexusEngine, config.reconstruction ?? {}),
    createGaussianSplatAssetKit(NexusEngine, config.asset ?? {}),
    createGaussianSplatPresentationKit(NexusEngine, config.presentation ?? {}),
    createGaussianSplatDomain(NexusEngine, config)
  ];
}
