import { DEFAULT_HARNESS_DATA } from "./data/default-data.js";
import { createHarnessServiceKit, createServiceApis } from "./service-factory.js";

export const DOMAIN_HARNESS_KIT_VERSION = "0.1.0";
export { createHarnessServiceKit, createInitialServiceState, createMemoryWorld } from "./service-factory.js";
export { DEFAULT_HARNESS_DATA } from "./data/default-data.js";

export function getHarnessServiceDescriptors(data = DEFAULT_HARNESS_DATA) {
  return Array.from(data.services || []);
}

export function createDomainHarnessKit(NexusRealtime, config = {}) {
  const data = config.data || DEFAULT_HARNESS_DATA;
  return getHarnessServiceDescriptors(data).map((descriptor) => createHarnessServiceKit(NexusRealtime, descriptor, config[descriptor.id] || {}));
}

export function createDomainHarnessSession(config = {}) {
  const data = config.data || DEFAULT_HARNESS_DATA;
  const descriptors = getHarnessServiceDescriptors(data);
  const session = createServiceApis(descriptors, config.services || {});
  const service = (id) => session.engine.domainHarnessServices && session.engine.domainHarnessServices[id];
  return {
    data,
    descriptors,
    engine: session.engine,
    world: session.world,
    kits: session.kits,
    service,
    getServices() { return Object.values(session.engine.domainHarnessServices || {}); },
    getGraph() { return (service("semantic-map-kit") && service("semantic-map-kit").getState().graph) || { nodes: [], edges: [] }; },
    getCatalog() { return (service("source-catalog-kit") && service("source-catalog-kit").getState().catalog) || { sources: [] }; },
    createBrief(payload = {}) { return service("agent-brief-kit") && service("agent-brief-kit").createBrief(payload); },
    createBuildPlan(payload = {}) { return service("build-plan-kit") && service("build-plan-kit").createPlan(payload); },
    reviewPromotion(payload = {}) { return service("promotion-gate-kit") && service("promotion-gate-kit").reviewPromotion(payload); },
    runSystems() { for (const kit of session.kits) for (const entry of kit.systems || []) entry.system(session.world); if (session.world.clearEvents) session.world.clearEvents(); }
  };
}

export default createDomainHarnessKit;
