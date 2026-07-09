export const HUGGINGFACE_LOADER_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const trimSlash = (value) => String(value ?? "").replace(/^\/+|\/+$/g, "");

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createHuggingFaceLoaderKit requires NexusEngine.${key}.`);
  }
}

export function createHuggingFaceFileUrl({ endpoint = "https://huggingface.co", repo, revision = "main", path }) {
  if (!repo) throw new TypeError("Hugging Face download plans require repo.");
  if (!path) throw new TypeError("Hugging Face download plans require file path.");
  return `${trimSlash(endpoint)}/${trimSlash(repo)}/resolve/${encodeURIComponent(revision)}/${trimSlash(path)}`;
}

function manifestFromEngine(engine, modelId) {
  return engine.modelManifest?.get?.(modelId) ?? null;
}

function createPlan(manifest, config = {}) {
  const allowlist = asArray(config.allowlist ?? manifest.files?.map((file) => file.path)).map(String);
  const files = asArray(manifest.files).filter((file) => allowlist.length === 0 || allowlist.includes(file.path));
  return {
    modelId: manifest.id,
    source: "huggingface",
    repo: manifest.repo,
    revision: manifest.revision ?? "main",
    endpoint: config.endpoint ?? "https://huggingface.co",
    files: files.map((file) => ({ ...clone(file), url: createHuggingFaceFileUrl({ endpoint: config.endpoint, repo: manifest.repo, revision: manifest.revision ?? "main", path: file.path }) })),
    estimatedBytes: files.reduce((sum, file) => sum + Number(file.bytes ?? 0), 0),
    license: manifest.license ?? null
  };
}

export function createHuggingFaceLoaderKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const HuggingFaceLoaderState = defineResource(config.resourceName ?? "huggingFaceLoader.state");
  const HuggingFacePlanCreated = defineEvent("huggingFaceLoader.planCreated");
  const HuggingFacePlanRejected = defineEvent("huggingFaceLoader.planRejected");

  function initialState() { return { version: HUGGINGFACE_LOADER_KIT_VERSION, plans: {}, rejections: [] }; }

  return defineRuntimeKit({
    id: config.kitId ?? "huggingface-loader-kit",
    requires: ["model:manifest"],
    provides: ["model:huggingface-loader", "model:download-plan"],
    resources: { HuggingFaceLoaderState },
    events: { HuggingFacePlanCreated, HuggingFacePlanRejected },
    systems: [],
    initWorld({ world }) { world.setResource(HuggingFaceLoaderState, initialState()); },
    install({ engine, world }) {
      engine.huggingFaceLoader = {
        resources: { HuggingFaceLoaderState },
        events: { HuggingFacePlanCreated, HuggingFacePlanRejected },
        createDownloadPlan(modelId, override = {}) {
          const manifest = override.manifest ?? manifestFromEngine(engine, modelId);
          if (!manifest || manifest.source !== "huggingface" || !manifest.repo) {
            const rejection = { modelId, reason: "missing-huggingface-manifest" };
            const previous = world.getResource(HuggingFaceLoaderState) ?? initialState();
            world.setResource(HuggingFaceLoaderState, { ...previous, rejections: [rejection, ...previous.rejections].slice(0, 16) });
            world.emit(HuggingFacePlanRejected, rejection);
            return clone(rejection);
          }
          const plan = createPlan(manifest, { ...config, ...override });
          const previous = world.getResource(HuggingFaceLoaderState) ?? initialState();
          world.setResource(HuggingFaceLoaderState, { ...previous, plans: { ...previous.plans, [modelId]: plan } });
          world.emit(HuggingFacePlanCreated, { modelId, plan });
          return clone(plan);
        },
        getPlan(modelId) { return clone(world.getResource(HuggingFaceLoaderState)?.plans?.[modelId] ?? null); },
        getState() { return clone(world.getResource(HuggingFaceLoaderState)); }
      };
    },
    metadata: { purpose: "Creates pinned Hugging Face file download plans from model manifests. Does not run inference or own gameplay." }
  });
}

export default createHuggingFaceLoaderKit;
