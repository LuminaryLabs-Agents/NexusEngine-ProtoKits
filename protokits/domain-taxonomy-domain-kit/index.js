import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const DOMAIN_TAXONOMY_DOMAIN_KIT_VERSION = "0.1.0";

export const manifest = Object.freeze({
  id: "domain-taxonomy-domain-kit",
  domain: "domain-taxonomy",
  parentDomain: "domain-control-plane",
  scope: "control-domain",
  extendsBase: "DomainServiceKit",
  composes: ["domain-manifest-registry-domain-kit"],
  requires: ["n:runtime.engine"],
  provides: ["domain:taxonomy", "domain:scope-policy", "domain:naming-policy"],
  ownsLoop: false,
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",
  exportPath: "./domain-taxonomy-domain-kit",
  sourcePath: "protokits/domain-taxonomy-domain-kit/index.js",
  testPaths: ["tests/domain-control-plane-smoke.test.mjs"],
  status: "experimental"
});

const defaultScopes = Object.freeze([
  "atomic-domain",
  "feature-domain",
  "stack-domain",
  "mode-domain",
  "application-domain",
  "route-domain",
  "adapter-domain",
  "content-domain",
  "proof-domain",
  "control-domain"
]);

const idOf = (value, fallback = "domain") => String(value ?? fallback).trim() || fallback;

function createInitialState(options = {}) {
  return {
    version: DOMAIN_TAXONOMY_DOMAIN_KIT_VERSION,
    scopes: Object.fromEntries(asList(options.scopes ?? defaultScopes).map((scope, index) => [String(scope), { id: String(scope), order: index }])),
    classifications: [],
    nameReports: [],
    lastReason: "initialized"
  };
}

export function classifyDomain(input = {}) {
  const id = idOf(input.id ?? input.name, "unnamed");
  const scope = String(input.scope ?? "");
  const lower = `${id} ${scope} ${input.extendsBase ?? ""}`.toLowerCase();
  let kind = "unknown-domain";
  if (lower.includes("application-domain")) kind = "application-domain";
  else if (lower.includes("mode-domain")) kind = "mode-domain";
  else if (lower.includes("route-domain")) kind = "route-domain";
  else if (lower.includes("adapter-domain")) kind = "adapter-domain";
  else if (lower.includes("content-domain")) kind = "content-domain";
  else if (lower.includes("proof-domain") || lower.includes("harness") || lower.includes("smoke") || lower.includes("replay")) kind = "proof-domain";
  else if (lower.includes("stack-domain")) kind = "stack-domain";
  else if (id.endsWith("-domain-kit") || id.endsWith("-dsk")) kind = "service-domain";
  const boundaryReady = Boolean(input.domain ?? id.endsWith("-domain-kit")) && asList(input.provides).length > 0;
  return { id, kind, scope: scope || kind, boundaryReady, reason: boundaryReady ? "classified" : "missing-domain-boundary-evidence" };
}

export function validateDomainName(id, options = {}) {
  const name = idOf(id, "");
  const warnings = [];
  const allowedLegacy = Boolean(options.allowLegacyDsk ?? true) && name.endsWith("-dsk");
  if (!name) warnings.push({ type: "missing-name" });
  if (name && !name.endsWith("-domain-kit") && !allowedLegacy) warnings.push({ type: "name-must-end-domain-kit", name });
  if (/game|experiment|demo/i.test(name) && !/mode-domain-kit|route-domain-kit|application-domain-kit/i.test(name)) warnings.push({ type: "game-name-domain-warning", name });
  if (name.includes("_")) warnings.push({ type: "use-kebab-case", name });
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings, name };
}

export function createDomainTaxonomyDomainKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const DomainTaxonomyState = resource(options.resourceName ?? "domainTaxonomy.state");
  const DomainClassified = event("domainTaxonomy.classified");
  const DomainNameValidated = event("domainTaxonomy.nameValidated");
  const DomainScopeRegistered = event("domainTaxonomy.scopeRegistered");
  const DomainTaxonomyReset = event("domainTaxonomy.reset");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "domain-taxonomy-domain-kit",
    resources: { DomainTaxonomyState },
    events: { DomainClassified, DomainNameValidated, DomainScopeRegistered, DomainTaxonomyReset },
    requires: asList(options.requires),
    provides: ["domain:taxonomy", "domain:scope-policy", "domain:naming-policy", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, DomainTaxonomyState, () => createInitialState(options)); },
    install({ engine, world }) {
      const get = () => ensureResource(world, DomainTaxonomyState, () => createInitialState(options));
      const set = (next) => { world.setResource(DomainTaxonomyState, next); return clone(next); };
      engine[options.apiName ?? "domainTaxonomy"] = {
        classify(input = {}) {
          const next = get();
          const report = { id: `domain-classification-${next.classifications.length + 1}`, ...classifyDomain(input) };
          next.classifications = [report, ...next.classifications].slice(0, Number(options.classificationLimit ?? 128));
          next.lastReason = report.reason;
          set(next);
          world.emit(DomainClassified, { report: clone(report) });
          return clone(report);
        },
        validateName(id, payload = {}) {
          const next = get();
          const report = { id: `domain-name-validation-${next.nameReports.length + 1}`, ...validateDomainName(id, { ...options, ...payload }) };
          next.nameReports = [report, ...next.nameReports].slice(0, Number(options.nameReportLimit ?? 128));
          next.lastReason = report.ok ? "name-valid" : "name-warning";
          set(next);
          world.emit(DomainNameValidated, { report: clone(report) });
          return clone(report);
        },
        registerScope(scope = {}) {
          const next = get();
          const id = idOf(scope.id ?? scope.name, `scope-${Object.keys(next.scopes).length + 1}`);
          const record = { id, label: String(scope.label ?? id), order: Number(scope.order ?? Object.keys(next.scopes).length), metadata: clone(scope.metadata ?? {}) };
          next.scopes[id] = record;
          next.lastReason = "scope-registered";
          set(next);
          world.emit(DomainScopeRegistered, { scope: clone(record) });
          return clone(record);
        },
        validateScope(scopeId) { const scope = get().scopes[idOf(scopeId)]; return { ok: Boolean(scope), scope: clone(scope ?? null), reason: scope ? "scope-known" : "scope-unknown" }; },
        getState() { return clone(get()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(DomainTaxonomyState, next); world.emit(DomainTaxonomyReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: DOMAIN_TAXONOMY_DOMAIN_KIT_VERSION, domain: "domain-taxonomy", extendsBase: "DomainServiceKit", composes: ["domain-manifest-registry-domain-kit"], ownsLoop: false, manifest }
  });
}

export default createDomainTaxonomyDomainKit;
