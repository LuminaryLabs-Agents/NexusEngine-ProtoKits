import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const DOMAIN_INVENTORY_DOMAIN_KIT_VERSION = "0.1.0";

export const manifest = Object.freeze({
  id: "domain-inventory-domain-kit",
  domain: "domain-inventory",
  parentDomain: "domain-control-plane",
  scope: "control-domain",
  extendsBase: "DomainServiceKit",
  composes: ["domain-manifest-registry-domain-kit", "domain-taxonomy-domain-kit"],
  requires: ["n:runtime.engine"],
  provides: ["domain:inventory", "domain:discovery-report"],
  ownsLoop: false,
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",
  exportPath: "./domain-inventory-domain-kit",
  sourcePath: "protokits/domain-inventory-domain-kit/index.js",
  testPaths: ["tests/domain-control-plane-smoke.test.mjs"],
  status: "experimental"
});

const idOf = (value, fallback = "domain") => String(value ?? fallback).trim() || fallback;

function createInitialState(options = {}) {
  const entries = Object.fromEntries(asList(options.entries).map(normalizeEntry).map((entry) => [entry.id, entry]));
  return {
    version: DOMAIN_INVENTORY_DOMAIN_KIT_VERSION,
    entries,
    order: Object.keys(entries),
    reports: [],
    lastReason: "initialized"
  };
}

export function normalizeEntry(input = {}) {
  const id = idOf(input.id ?? input.name ?? input.path?.split?.("/")?.at?.(-1), "unnamed-domain-kit");
  return {
    id,
    path: String(input.path ?? `protokits/${id}`),
    domain: input.domain == null ? id.replace(/-domain-kit$/, "") : String(input.domain),
    scope: String(input.scope ?? "unknown"),
    hasIndex: Boolean(input.hasIndex ?? input.files?.includes?.("index.js")),
    hasReadme: Boolean(input.hasReadme ?? input.files?.some?.((file) => /^readme\.md$/i.test(file))),
    hasManifest: Boolean(input.hasManifest ?? input.files?.some?.((file) => /manifest/i.test(file))),
    factories: asList(input.factories).map(String),
    versionConstants: asList(input.versionConstants).map(String),
    provides: asList(input.provides).map(String),
    requires: asList(input.requires).map(String),
    status: String(input.status ?? "discovered"),
    metadata: clone(input.metadata ?? {})
  };
}

function summarizeEntries(entries = {}) {
  const list = Object.values(entries);
  const missingIndex = list.filter((entry) => !entry.hasIndex).map((entry) => entry.id);
  const missingReadme = list.filter((entry) => !entry.hasReadme).map((entry) => entry.id);
  const missingManifest = list.filter((entry) => !entry.hasManifest).map((entry) => entry.id);
  const missingFactory = list.filter((entry) => entry.factories.length === 0).map((entry) => entry.id);
  return {
    total: list.length,
    withIndex: list.length - missingIndex.length,
    withReadme: list.length - missingReadme.length,
    withManifest: list.length - missingManifest.length,
    withFactory: list.length - missingFactory.length,
    missingIndex: missingIndex.length,
    missingReadme: missingReadme.length,
    missingManifest: missingManifest.length,
    missingFactory: missingFactory.length,
    missing: { index: missingIndex, readme: missingReadme, manifest: missingManifest, factory: missingFactory }
  };
}

export function createDomainInventoryDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const DomainInventoryState = resource(options.resourceName ?? "domainInventory.state");
  const DomainInventoryEntryRegistered = event("domainInventory.entryRegistered");
  const DomainInventorySummarized = event("domainInventory.summarized");
  const DomainInventoryReset = event("domainInventory.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "domain-inventory-domain-kit",
    resources: { DomainInventoryState },
    events: { DomainInventoryEntryRegistered, DomainInventorySummarized, DomainInventoryReset },
    requires: asList(options.requires),
    provides: ["domain:inventory", "domain:discovery-report", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, DomainInventoryState, () => createInitialState(options)); },
    install({ engine, world }) {
      const get = () => ensureResource(world, DomainInventoryState, () => createInitialState(options));
      const set = (next) => { world.setResource(DomainInventoryState, next); return clone(next); };
      engine[options.apiName ?? "domainInventory"] = {
        registerEntry(input = {}) {
          const next = get();
          const entry = normalizeEntry(input);
          next.entries[entry.id] = entry;
          next.order = [entry.id, ...next.order.filter((id) => id !== entry.id)];
          next.lastReason = "entry-registered";
          set(next);
          world.emit(DomainInventoryEntryRegistered, { entry: clone(entry) });
          return clone(entry);
        },
        registerMany(inputs = []) { return asList(inputs).map((input) => this.registerEntry(input)); },
        summarize() {
          const next = get();
          const report = { id: `domain-inventory-report-${next.reports.length + 1}`, ...summarizeEntries(next.entries) };
          next.reports = [report, ...next.reports].slice(0, Number(options.reportLimit ?? 64));
          next.lastReason = "inventory-summarized";
          set(next);
          world.emit(DomainInventorySummarized, { report: clone(report) });
          return clone(report);
        },
        listMissing(field = "manifest") { const summary = summarizeEntries(get().entries); return clone(summary.missing[field] ?? []); },
        listByStatus(status) { return clone(Object.values(get().entries).filter((entry) => entry.status === status)); },
        getEntry(id) { return clone(get().entries[idOf(id)] ?? null); },
        getState() { return clone(get()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(DomainInventoryState, next); world.emit(DomainInventoryReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: DOMAIN_INVENTORY_DOMAIN_KIT_VERSION, domain: "domain-inventory", extendsBase: "DomainServiceKit", composes: ["domain-manifest-registry-domain-kit", "domain-taxonomy-domain-kit"], ownsLoop: false, manifest }
  });
}

export default createDomainInventoryDomainKit;
