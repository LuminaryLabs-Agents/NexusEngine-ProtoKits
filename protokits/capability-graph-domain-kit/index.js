import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const CAPABILITY_GRAPH_DOMAIN_KIT_VERSION = "0.1.0";

export const manifest = Object.freeze({
  id: "capability-graph-domain-kit",
  domain: "capability-graph",
  parentDomain: "domain-control-plane",
  scope: "control-domain",
  extendsBase: "DomainServiceKit",
  composes: ["domain-manifest-registry-domain-kit"],
  requires: ["domain:manifest-registry"],
  provides: ["domain:capability-graph", "domain:dependency-graph"],
  ownsLoop: false,
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",
  exportPath: "./capability-graph-domain-kit",
  sourcePath: "protokits/capability-graph-domain-kit/index.js",
  testPaths: ["tests/domain-composition-planning-smoke.test.mjs"],
  status: "experimental"
});

const idOf = (value, fallback = "domain") => String(value ?? fallback).trim() || fallback;
const normalize = (entry = {}) => ({
  id: idOf(entry.id ?? entry.name, "unnamed-domain-kit"),
  domain: entry.domain == null ? idOf(entry.id ?? entry.name, "domain").replace(/-domain-kit$/, "") : String(entry.domain),
  parentDomain: entry.parentDomain == null ? null : String(entry.parentDomain),
  scope: String(entry.scope ?? "feature-domain"),
  requires: asList(entry.requires).map(String),
  provides: asList(entry.provides).map(String),
  composes: asList(entry.composes).map(String),
  status: String(entry.status ?? "experimental"),
  metadata: clone(entry.metadata ?? {})
});

function createInitialState(options = {}) {
  const nodes = Object.fromEntries(asList(options.manifests ?? options.nodes).map(normalize).map((node) => [node.id, node]));
  return { version: CAPABILITY_GRAPH_DOMAIN_KIT_VERSION, nodes, edges: [], missingReports: [], clusters: [], lastReason: "initialized" };
}

function buildIndexes(nodes = {}) {
  const byProvides = {};
  const byRequires = {};
  const byDomain = {};
  const edges = [];
  for (const node of Object.values(nodes)) {
    byDomain[node.domain] = [...(byDomain[node.domain] ?? []), node.id];
    for (const token of node.provides) byProvides[token] = [...(byProvides[token] ?? []), node.id];
    for (const token of node.requires) byRequires[token] = [...(byRequires[token] ?? []), node.id];
  }
  for (const node of Object.values(nodes)) {
    for (const token of node.requires) {
      const providers = byProvides[token] ?? [];
      if (providers.length) for (const providerId of providers) edges.push({ from: providerId, to: node.id, token, type: "provides-requires" });
      else edges.push({ from: null, to: node.id, token, type: "missing-require" });
    }
    for (const composedId of node.composes) if (nodes[composedId]) edges.push({ from: composedId, to: node.id, token: composedId, type: "composes" });
  }
  return { byProvides, byRequires, byDomain, edges };
}

export function createCapabilityGraphDomainKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const CapabilityGraphState = resource(options.resourceName ?? "capabilityGraph.state");
  const DomainNodeRegistered = event("capabilityGraph.nodeRegistered");
  const CapabilityGraphBuilt = event("capabilityGraph.built");
  const CapabilityGraphClusterFound = event("capabilityGraph.clusterFound");
  const CapabilityGraphReset = event("capabilityGraph.reset");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "capability-graph-domain-kit",
    resources: { CapabilityGraphState },
    events: { DomainNodeRegistered, CapabilityGraphBuilt, CapabilityGraphClusterFound, CapabilityGraphReset },
    requires: asList(options.requires),
    provides: ["domain:capability-graph", "domain:dependency-graph", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, CapabilityGraphState, () => createInitialState(options)); },
    install({ engine, world }) {
      const get = () => ensureResource(world, CapabilityGraphState, () => createInitialState(options));
      const set = (next) => { world.setResource(CapabilityGraphState, next); return clone(next); };
      engine[options.apiName ?? "capabilityGraph"] = {
        registerDomain(input = {}) {
          const next = get();
          const node = normalize(input);
          next.nodes[node.id] = node;
          next.lastReason = "node-registered";
          set(next);
          world.emit(DomainNodeRegistered, { node: clone(node) });
          return clone(node);
        },
        registerMany(inputs = []) { return asList(inputs).map((input) => this.registerDomain(input)); },
        buildGraph() {
          const next = get();
          const indexes = buildIndexes(next.nodes);
          next.edges = indexes.edges;
          next.indexes = { byProvides: indexes.byProvides, byRequires: indexes.byRequires, byDomain: indexes.byDomain };
          next.lastReason = "graph-built";
          set(next);
          world.emit(CapabilityGraphBuilt, { graph: clone({ nodeCount: Object.keys(next.nodes).length, edgeCount: next.edges.length }) });
          return clone(next);
        },
        listByProvides(token) { const graph = this.buildGraph(); return clone((graph.indexes?.byProvides?.[token] ?? []).map((id) => graph.nodes[id])); },
        listByDomain(domain) { const graph = this.buildGraph(); return clone((graph.indexes?.byDomain?.[domain] ?? []).map((id) => graph.nodes[id])); },
        findMissingRequires(id) {
          const graph = this.buildGraph();
          const node = graph.nodes[idOf(id)];
          const missing = node ? node.requires.filter((token) => !(graph.indexes?.byProvides?.[token]?.length)) : [];
          const report = { id: `missing-requires-${get().missingReports.length + 1}`, domainId: id, ok: missing.length === 0, missing };
          const next = get();
          next.missingReports = [report, ...next.missingReports].slice(0, Number(options.reportLimit ?? 128));
          set(next);
          return clone(report);
        },
        findClusters(seedTokens = []) {
          const graph = this.buildGraph();
          const tokens = asList(seedTokens).map(String);
          const ids = new Set();
          for (const token of tokens) for (const id of graph.indexes?.byProvides?.[token] ?? []) ids.add(id);
          const cluster = { id: `capability-cluster-${get().clusters.length + 1}`, tokens, domainIds: [...ids], domains: [...ids].map((id) => graph.nodes[id]) };
          const next = get();
          next.clusters = [cluster, ...next.clusters].slice(0, Number(options.clusterLimit ?? 64));
          set(next);
          world.emit(CapabilityGraphClusterFound, { cluster: clone(cluster) });
          return clone(cluster);
        },
        getState() { return clone(get()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(CapabilityGraphState, next); world.emit(CapabilityGraphReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: CAPABILITY_GRAPH_DOMAIN_KIT_VERSION, domain: "capability-graph", extendsBase: "DomainServiceKit", composes: ["domain-manifest-registry-domain-kit"], ownsLoop: false, manifest }
  });
}

export default createCapabilityGraphDomainKit;
