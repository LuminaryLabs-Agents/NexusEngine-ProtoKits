import {
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  stableId
} from "../production-domain-kit-support.js";

export const STRUCTURAL_SUPPORT_NETWORK_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createStructuralSupportNetworkDomainKit",
  kitId: "structural-support-network-domain-kit",
  domain: "structural-support-network",
  domainPath: "n:infrastructure:structural-support",
  parentDomainPath: "n:infrastructure",
  apiName: "structuralSupport",
  schema: "nexusengine.structural-support-network/1",
  resource: "structuralSupport.state",
  purpose: "Resolve portable support graphs, semantic loads, capacity margins, repairs, and ordered failure propagation.",
  ownership: ["support graphs", "semantic loads", "capacity margins", "unsupported components", "ordered failure propagation", "repairable support state"],
  exclusions: ["rigid-body integration", "collision solving", "mesh fracture", "renderer debris", "build placement", "scene-specific content"],
  dependencies: ["NexusEngine DomainServiceKit", "portable scene ids", "optional normalized physics observations"],
  services: ["networks", "loads", "support-state", "failure-resolution", "margins", "snapshots", "descriptors", "reset"],
  provides: ["infrastructure:structural-support", "structure:support-graph", "structure:failure-propagation"],
  events: ["structure.loadApplied", "structure.supportLost", "structure.failurePropagated", "structure.supportRestored", "structure.commandRejected", "structure.reset"],
  rejectedEvent: "structure.commandRejected",
  resetEvent: "structure.reset"
};

function normalizeNetwork(input = {}, index = 0) {
  const id = stableId(input.id ?? `network-${index + 1}`, "Support network");
  const nodes = Object.fromEntries(list(input.nodes).map((node, nodeIndex) => {
    const nodeId = stableId(node.id ?? `node-${nodeIndex + 1}`, "Support node");
    return [nodeId, {
      id: nodeId,
      capacity: Math.max(0, number(node.capacity, 1)),
      anchor: Boolean(node.anchor),
      active: node.active !== false,
      failed: Boolean(node.failed),
      metadata: clone(node.metadata ?? {})
    }];
  }));
  const edges = list(input.edges).map((edge, edgeIndex) => ({
    id: stableId(edge.id ?? `edge-${edgeIndex + 1}`, "Support edge"),
    from: stableId(edge.from, "Support edge from"),
    to: stableId(edge.to, "Support edge to"),
    transfer: Math.max(0, number(edge.transfer, 1)),
    active: edge.active !== false
  }));
  return { id, nodes, edges, loads: {}, failures: [], tick: 0, metadata: clone(input.metadata ?? {}) };
}

function reachableNodes(network) {
  const reached = new Set(Object.values(network.nodes).filter((node) => node.anchor && node.active && !node.failed).map((node) => node.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of network.edges.filter((entry) => entry.active).sort((a, b) => a.id.localeCompare(b.id))) {
      const from = network.nodes[edge.from];
      const to = network.nodes[edge.to];
      if (!from?.active || from.failed || !to?.active || to.failed) continue;
      if (reached.has(edge.from) && !reached.has(edge.to)) { reached.add(edge.to); changed = true; }
      if (reached.has(edge.to) && !reached.has(edge.from)) { reached.add(edge.from); changed = true; }
    }
  }
  return reached;
}

function createInitial(config) {
  const networks = Object.fromEntries(list(config.networks).map((entry, index) => {
    const value = normalizeNetwork(entry, index);
    return [value.id, value];
  }));
  return { networks, tick: integer(config.initialTick) };
}

export function createStructuralSupportNetworkDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const registerNetwork = (input) => {
      const value = normalizeNetwork(input);
      if (read().networks[value.id]) return clone(read().networks[value.id]);
      commit({ result: { ok: true, action: "register-network", networkId: value.id }, transform: (state) => ({ ...state, networks: { ...state.networks, [value.id]: value } }) });
      return clone(value);
    };
    const networkFor = (networkId) => read().networks[String(networkId)] ?? null;
    const applyLoad = (observation = {}) => {
      const networkId = stableId(observation.networkId, "Load network");
      const nodeId = stableId(observation.nodeId, "Load node");
      const network = networkFor(networkId);
      if (!network) return reject("unknown-network", { networkId, nodeId, commandId: observation.commandId });
      if (!network.nodes[nodeId]) return reject("unknown-node", { networkId, nodeId, commandId: observation.commandId });
      const load = Math.max(0, number(observation.load ?? observation.amount));
      return commit({
        result: { ok: true, action: "apply-load", networkId, nodeId, load },
        eventName: "structure.loadApplied",
        commandId: observation.commandId,
        transform: (state) => ({ ...state, networks: { ...state.networks, [networkId]: { ...network, loads: { ...network.loads, [nodeId]: load } } } })
      });
    };
    const setSupportState = (networkId, nodeId, stateOrPayload, payload = {}) => {
      const id = stableId(networkId, "Support network");
      const targetId = stableId(nodeId, "Support node");
      const network = networkFor(id);
      if (!network?.nodes[targetId]) return reject("unknown-node", { networkId: id, nodeId: targetId, commandId: payload.commandId });
      const active = typeof stateOrPayload === "object" ? stateOrPayload.active !== false : stateOrPayload !== false && stateOrPayload !== "removed";
      const commandId = typeof stateOrPayload === "object" ? stateOrPayload.commandId : payload.commandId;
      const previous = network.nodes[targetId];
      if (previous.active === active && (!active || previous.failed === false)) return clone(previous);
      const nextNode = { ...previous, active, failed: active ? false : previous.failed };
      const eventName = active ? "structure.supportRestored" : "structure.supportLost";
      const result = commit({
        result: { ok: true, action: "set-support-state", networkId: id, nodeId: targetId, active },
        eventName,
        commandId,
        transform: (state) => ({ ...state, networks: { ...state.networks, [id]: { ...network, nodes: { ...network.nodes, [targetId]: nextNode } } } })
      });
      return result.duplicate ? result : clone(nextNode);
    };
    const resolve = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      const failures = [];
      let state = clone(read());
      for (let step = 0; step < count; step += 1) {
        state.tick += 1;
        for (const networkId of Object.keys(state.networks).sort()) {
          const network = state.networks[networkId];
          network.tick += 1;
          let changed = true;
          while (changed) {
            changed = false;
            const reached = reachableNodes(network);
            for (const nodeId of Object.keys(network.nodes).sort()) {
              const node = network.nodes[nodeId];
              if (!node.active || node.failed) continue;
              const load = number(network.loads[nodeId]);
              const unsupported = !node.anchor && !reached.has(nodeId);
              const overloaded = load > node.capacity;
              if (!unsupported && !overloaded) continue;
              node.failed = true;
              changed = true;
              const failure = { networkId, nodeId, reason: unsupported ? "unsupported" : "capacity-exceeded", load, capacity: node.capacity, tick: state.tick };
              network.failures.push(failure);
              failures.push(failure);
              const neighbors = network.edges.filter((edge) => edge.active && (edge.from === nodeId || edge.to === nodeId)).map((edge) => edge.from === nodeId ? edge.to : edge.from).filter((id) => network.nodes[id]?.active && !network.nodes[id].failed).sort();
              if (neighbors.length > 0 && load > 0) {
                const share = load / neighbors.length;
                for (const neighborId of neighbors) network.loads[neighborId] = number(network.loads[neighborId]) + share;
              }
            }
          }
          network.failures = network.failures.slice(-256);
        }
      }
      commit({ result: { ok: true, action: "resolve", ticks: count, tick: state.tick, failureCount: failures.length }, transform: () => state });
      for (const failure of failures) emit("structure.failurePropagated", failure);
      return clone(read());
    };
    const getMargin = (networkId, nodeId) => {
      const network = networkFor(networkId);
      const node = network?.nodes?.[String(nodeId)];
      if (!node) return null;
      const load = number(network.loads[String(nodeId)]);
      return { networkId: String(networkId), nodeId: String(nodeId), capacity: node.capacity, load, margin: node.capacity - load, supported: node.anchor || reachableNodes(network).has(String(nodeId)), failed: node.failed };
    };
    return {
      registerNetwork,
      applyLoad,
      setSupportState,
      resolve,
      getMargin,
      getDescriptors: () => Object.values(read().networks).flatMap((network) => Object.keys(network.nodes).sort().map((nodeId) => ({ id: `${network.id}:${nodeId}`, kind: "structural-support-margin", ...getMargin(network.id, nodeId) })))
    };
  });
}

export default createStructuralSupportNetworkDomainKit;
