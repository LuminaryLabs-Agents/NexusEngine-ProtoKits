import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const DOMAIN_MANIFEST_REGISTRY_DOMAIN_KIT_VERSION = "0.1.0";

export const manifest = Object.freeze({
  id: "domain-manifest-registry-domain-kit",
  domain: "domain-manifest-registry",
  parentDomain: "domain-control-plane",
  scope: "control-domain",
  extendsBase: "DomainServiceKit",
  composes: [],
  requires: ["n:runtime.engine"],
  provides: ["domain:manifest-registry", "domain:metadata-index"],
  ownsLoop: false,
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",
  exportPath: "./domain-manifest-registry-domain-kit",
  sourcePath: "protokits/domain-manifest-registry-domain-kit/index.js",
  testPaths: ["tests/domain-control-plane-smoke.test.mjs"],
  status: "experimental"
});

const requiredFields = Object.freeze(["id", "domain", "scope", "extendsBase", "provides", "exportPath", "sourcePath", "status"]);
const idOf = (value, fallback = "domain") => String(value ?? fallback).trim() || fallback;

function createInitialState(options = {}) {
  const manifests = Object.fromEntries(asList(options.manifests).map(normalizeManifest).map((entry) => [entry.id, entry]));
  return {
    version: DOMAIN_MANIFEST_REGISTRY_DOMAIN_KIT_VERSION,
    manifests,
    order: Object.keys(manifests),
    validations: [],
    lastReason: "initialized"
  };
}

export function normalizeManifest(input = {}) {
  const id = idOf(input.id ?? input.name, "unnamed-domain-kit");
  return {
    id,
    domain: input.domain == null ? id.replace(/-domain-kit$/, "") : String(input.domain),
    parentDomain: input.parentDomain == null ? null : String(input.parentDomain),
    scope: String(input.scope ?? "feature-domain"),
    extendsBase: String(input.extendsBase ?? "DomainServiceKit"),
    composes: asList(input.composes).map(String),
    requires: asList(input.requires).map(String),
    provides: asList(input.provides).map(String),
    ownsLoop: Boolean(input.ownsLoop ?? false),
    snapshotPolicy: String(input.snapshotPolicy ?? "serializable"),
    resetPolicy: String(input.resetPolicy ?? "engine-reset-aware"),
    exportPath: input.exportPath == null ? `./${id}` : String(input.exportPath),
    sourcePath: input.sourcePath == null ? `protokits/${id}/index.js` : String(input.sourcePath),
    testPaths: asList(input.testPaths).map(String),
    status: String(input.status ?? "experimental"),
    metadata: clone(input.metadata ?? {})
  };
}

export function validateDomainManifest(input = {}) {
  const entry = normalizeManifest(input);
  const warnings = [];
  for (const field of requiredFields) {
    const value = entry[field];
    if (value == null || value === "" || Array.isArray(value) && value.length === 0) warnings.push({ type: "missing-field", field });
  }
  if (!entry.id.endsWith("-domain-kit") && !entry.id.endsWith("-dsk")) warnings.push({ type: "domain-name-warning", id: entry.id });
  if (entry.extendsBase !== "DomainServiceKit" && !entry.extendsBase.endsWith("Kit")) warnings.push({ type: "extends-base-warning", extendsBase: entry.extendsBase });
  if (entry.ownsLoop && !entry.metadata?.loopLifecycle) warnings.push({ type: "loop-lifecycle-missing" });
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings, manifest: entry };
}

function indexesFor(manifests = {}) {
  const byDomain = {};
  const byScope = {};
  const byProvides = {};
  const byRequires = {};
  for (const entry of Object.values(manifests)) {
    byDomain[entry.domain] = [...(byDomain[entry.domain] ?? []), entry.id];
    byScope[entry.scope] = [...(byScope[entry.scope] ?? []), entry.id];
    for (const token of entry.provides) byProvides[token] = [...(byProvides[token] ?? []), entry.id];
    for (const token of entry.requires) byRequires[token] = [...(byRequires[token] ?? []), entry.id];
  }
  return { byDomain, byScope, byProvides, byRequires };
}

export function createDomainManifestRegistryDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const DomainManifestRegistryState = resource(options.resourceName ?? "domainManifestRegistry.state");
  const ManifestRegistered = event("domainManifestRegistry.registered");
  const ManifestValidated = event("domainManifestRegistry.validated");
  const DomainManifestRegistryReset = event("domainManifestRegistry.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "domain-manifest-registry-domain-kit",
    resources: { DomainManifestRegistryState },
    events: { ManifestRegistered, ManifestValidated, DomainManifestRegistryReset },
    requires: asList(options.requires),
    provides: ["domain:manifest-registry", "domain:metadata-index", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, DomainManifestRegistryState, () => createInitialState(options)); },
    install({ engine, world }) {
      const get = () => ensureResource(world, DomainManifestRegistryState, () => createInitialState(options));
      const set = (next) => { world.setResource(DomainManifestRegistryState, next); return clone(next); };
      engine[options.apiName ?? "domainManifestRegistry"] = {
        registerManifest(input = {}) {
          const next = get();
          const entry = normalizeManifest(input);
          next.manifests[entry.id] = entry;
          next.order = [entry.id, ...next.order.filter((id) => id !== entry.id)];
          next.lastReason = "manifest-registered";
          set(next);
          world.emit(ManifestRegistered, { manifest: clone(entry) });
          return clone(entry);
        },
        registerMany(inputs = []) { return asList(inputs).map((input) => this.registerManifest(input)); },
        validateManifest(idOrManifest) {
          const next = get();
          const entry = typeof idOrManifest === "string" ? next.manifests[idOrManifest] : idOrManifest;
          const report = entry ? { id: `domain-manifest-validation-${next.validations.length + 1}`, ...validateDomainManifest(entry) } : { id: `domain-manifest-validation-${next.validations.length + 1}`, ok: false, warningCount: 1, warnings: [{ type: "missing-manifest", id: idOrManifest }] };
          next.validations = [report, ...next.validations].slice(0, Number(options.validationLimit ?? 128));
          next.lastReason = report.ok ? "manifest-valid" : "manifest-warning";
          set(next);
          world.emit(ManifestValidated, { report: clone(report) });
          return clone(report);
        },
        listByDomain(domain) { return clone(Object.values(get().manifests).filter((entry) => entry.domain === domain || entry.parentDomain === domain)); },
        listByProvides(token) { return clone(Object.values(get().manifests).filter((entry) => entry.provides.includes(token))); },
        listByScope(scope) { return clone(Object.values(get().manifests).filter((entry) => entry.scope === scope)); },
        getManifest(id) { return clone(get().manifests[idOf(id)] ?? null); },
        getIndexes() { return clone(indexesFor(get().manifests)); },
        getState() { return clone(get()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(DomainManifestRegistryState, next); world.emit(DomainManifestRegistryReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: DOMAIN_MANIFEST_REGISTRY_DOMAIN_KIT_VERSION, domain: "domain-manifest-registry", extendsBase: "DomainServiceKit", composes: [], ownsLoop: false, manifest }
  });
}

export default createDomainManifestRegistryDomainKit;
