import { asList, clone } from "../protokit-core/index.js";

export const KIT_REGISTRY_VERSION = "0.1.0";

export function normalizeKitManifest(input = {}) {
  const id = String(input.id ?? "").trim();
  if (!id) throw new TypeError("Kit manifest requires an id.");
  return {
    version: input.version ?? KIT_REGISTRY_VERSION,
    id,
    domain: String(input.domain ?? id.replace(/-kit$/, "")),
    type: String(input.type ?? "atomic-domain-service-kit"),
    status: String(input.status ?? "experimental"),
    factory: input.factory ? String(input.factory) : null,
    path: input.path ? String(input.path) : null,
    requires: asList(input.requires).map(String),
    provides: asList(input.provides).map(String),
    resources: asList(input.resources).map(String),
    events: asList(input.events).map(String),
    publicApi: asList(input.publicApi).map(String),
    descriptors: asList(input.descriptors).map(String),
    rendererBoundary: { outputsDescriptors: false, ownsDom: false, ownsCanvas: false, ownsThreeObjects: false, ...(input.rendererBoundary ?? {}) },
    performance: { scalesWith: [], telemetry: [], degradationModes: [], ...(input.performance ?? {}) },
    snapshot: { supportsSnapshot: false, supportsReset: false, supportsLoadSnapshot: false, ...(input.snapshot ?? {}) },
    promotion: { level: input.status ?? "experimental", criteria: [], ...(input.promotion ?? {}) },
    metadata: clone(input.metadata ?? {})
  };
}

export function validateKitManifest(input = {}) {
  const errors = [];
  let manifest = null;
  try { manifest = normalizeKitManifest(input); } catch (error) { errors.push(error.message); }
  if (manifest) {
    for (const key of ["requires", "provides", "resources", "events", "publicApi", "descriptors"]) if (!Array.isArray(manifest[key])) errors.push(`${key} must be an array`);
    if (!manifest.rendererBoundary || typeof manifest.rendererBoundary !== "object") errors.push("rendererBoundary must be an object");
    if (!manifest.performance || typeof manifest.performance !== "object") errors.push("performance must be an object");
    if (!manifest.snapshot || typeof manifest.snapshot !== "object") errors.push("snapshot must be an object");
  }
  return { ok: errors.length === 0, errors, manifest };
}

export function createKitRegistry(manifests = []) {
  const byId = new Map();
  const register = (input = {}) => {
    const result = validateKitManifest(input);
    if (!result.ok) return result;
    byId.set(result.manifest.id, result.manifest);
    return { ok: true, manifest: clone(result.manifest) };
  };
  for (const manifest of asList(manifests)) register(manifest);
  return {
    register,
    get(id) { return clone(byId.get(String(id)) ?? null); },
    list(filter = {}) {
      let values = [...byId.values()];
      if (filter.type) values = values.filter((manifest) => manifest.type === filter.type);
      if (filter.status) values = values.filter((manifest) => manifest.status === filter.status);
      if (filter.provides) values = values.filter((manifest) => manifest.provides.includes(filter.provides));
      if (filter.requires) values = values.filter((manifest) => manifest.requires.includes(filter.requires));
      return values.map(clone);
    },
    findByProvide(token) { return this.list({ provides: token }); },
    findByRequire(token) { return this.list({ requires: token }); },
    findCompatibleKits(id) {
      const kit = byId.get(String(id));
      if (!kit) return [];
      const required = new Set(kit.requires ?? []);
      return [...byId.values()].filter((candidate) => candidate.id !== kit.id && candidate.provides?.some((token) => required.has(token))).map(clone);
    },
    listDeployKits() { return this.list().filter((manifest) => /deploy/i.test(manifest.type)); },
    listDomainBoundaries() { return this.list().filter((manifest) => manifest.metadata?.boundary || manifest.descriptors?.length || manifest.resources?.length); },
    snapshot() { return { version: KIT_REGISTRY_VERSION, kits: this.list() }; }
  };
}

export default createKitRegistry;
