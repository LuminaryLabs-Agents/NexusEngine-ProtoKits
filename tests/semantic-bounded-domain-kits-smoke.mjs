import assert from "node:assert/strict";
import {
  createMobilityTraversalDomainKit,
  createInfrastructureRestorationDomainKit,
  createConflictDefenseDomainKit,
  createWorldEnvironmentDomainKit,
  createAgencyCharacterDomainKit,
  createKnowledgeInvestigationDomainKit,
  createSemanticExperienceCompositionKit,
  listSemanticDomainFamilies
} from "../protokits/semantic-bounded-domain-kits/index.js";

function token(name) { return Object.freeze({ name }); }

const NexusEngine = {
  defineResource: token,
  defineEvent: token,
  defineDomainServiceKit(config) {
    return {
      ...config,
      id: config.id,
      metadata: {
        kind: "domain-service-kit",
        domain: config.domain,
        domainPath: config.domainPath,
        parentDomainPath: config.parentDomainPath,
        apiName: config.apiName,
        version: config.version,
        stability: config.stability,
        ...(config.metadata ?? {})
      }
    };
  }
};

function createWorld() {
  const resources = new Map();
  const events = [];
  return {
    getResource(ref) { return resources.get(ref.name); },
    setResource(ref, value) { resources.set(ref.name, value); return value; },
    emit(ref, payload) { events.push({ type: ref.name, payload }); },
    resources,
    events
  };
}

function install(kits) {
  const world = createWorld();
  const engine = { n: {} };
  for (const kit of kits) {
    kit.initWorld?.({ engine, world, kit });
    const api = kit.createApi?.({ engine, world, kit });
    if (api !== undefined) engine.n[kit.apiName] = api;
    kit.install?.({ engine, world, kit });
  }
  return { engine, world };
}

assert.equal(listSemanticDomainFamilies().length, 7);

const traversalKit = createMobilityTraversalDomainKit(NexusEngine, {
  routes: [{ id: "ridge", nodes: [{ id: "base" }, { id: "relay" }, { id: "summit" }] }]
});
const restorationKit = createInfrastructureRestorationDomainKit(NexusEngine, {
  assets: [{ id: "relay", requirements: [{ id: "parts", required: 2 }] }]
});
const environmentKit = createWorldEnvironmentDomainKit(NexusEngine, {
  regions: [{ id: "ridge", fields: [{ id: "cold", value: 0.2, rate: 0.1, max: 1 }] }]
});
const characterKit = createAgencyCharacterDomainKit(NexusEngine, {
  characters: [{ id: "climber", capabilities: ["climb"] }]
});
const investigationKit = createKnowledgeInvestigationDomainKit(NexusEngine, {
  cases: [{ id: "signal-loss", question: "Why did the relay fail?" }]
});
const compositionKit = createSemanticExperienceCompositionKit(NexusEngine, {
  compositionId: "summit-restoration",
  domains: [
    { id: "traversal", family: "mobility", domainPath: "n:mobility:traversal", apiName: "traversal" },
    { id: "restoration", family: "infrastructure", domainPath: "n:infrastructure:restoration", apiName: "restoration" },
    { id: "environment", family: "world", domainPath: "n:world:environment", apiName: "environment" },
    { id: "character", family: "agency", domainPath: "n:agency:character", apiName: "character" },
    { id: "investigation", family: "knowledge", domainPath: "n:knowledge:investigation", apiName: "investigation" }
  ]
});

const runtime = install([traversalKit, restorationKit, environmentKit, characterKit, investigationKit, compositionKit]);
const { engine } = runtime;

const journey = engine.n.traversal.journey.begin({ id: "ascent", routeId: "ridge", actorId: "climber" });
assert.equal(journey.activeNodeId, "base");
engine.n.traversal.passage.complete("ascent", "base");
engine.n.traversal.passage.complete("ascent", "relay");
const finished = engine.n.traversal.passage.complete("ascent", "summit");
assert.equal(finished.status, "completed");

const plan = engine.n.restoration.planning.create("relay", { id: "restore-relay" });
assert.equal(plan.status, "active");
engine.n.restoration.work.contribute("restore-relay", "parts", 2, { contributorId: "climber" });
const commissioned = engine.n.restoration.commissioning.commission("restore-relay");
assert.equal(commissioned.operational, true);

engine.n.environment.time.advance(3);
assert.equal(engine.n.environment.fields.get("ridge", "cold").value, 0.5);

engine.n.character.capabilities.grant("climber", "repair");
engine.n.character.conditions.set("climber", "cold-exposure", 0.5);
assert.equal(engine.n.character.capabilities.has("climber", "repair"), true);

engine.n.investigation.observations.record("signal-loss", { id: "obs-1", text: "Power coupling failed." });
engine.n.investigation.evidence.add("signal-loss", { id: "evidence-1", source: "relay" });
engine.n.investigation.hypotheses.propose("signal-loss", { id: "hypothesis-1", text: "Cold fractured the coupling." });
const concluded = engine.n.investigation.conclusions.reach("signal-loss", { finding: "cold-fracture" });
assert.equal(concluded.status, "concluded");

const validation = engine.n.experienceComposition.validation.run();
assert.equal(validation.valid, true);
const readModel = engine.n.experienceComposition.readModel.build();
assert.equal(Object.keys(readModel.domains).length, 5);
assert.equal(readModel.domains.restoration.snapshot.assets.relay.operational, true);

const defenseKit = createConflictDefenseDomainKit(NexusEngine);
const defenseRuntime = install([defenseKit]);
defenseRuntime.engine.n.genericDefense = {
  map: { getState: () => ({ id: "map" }) },
  economyWallet: { getState: () => ({ currency: 20 }) },
  buildPlacement: { getState: () => ({ structures: {} }) },
  waveAgentDirector: { getState: () => ({ active: {} }) },
  combatResolver: { getState: () => ({ projectiles: {} }) },
  sessionFacade: { getSnapshot: () => ({ session: { wave: 1 }, map: { id: "map" }, economy: { currency: 20 }, structures: {}, agents: {}, combat: {} }) },
  renderDescriptors: { getSnapshot: () => ({ descriptors: [{ kind: "path" }] }) }
};
const defenseSnapshot = defenseRuntime.engine.n.defense.session.getSnapshot();
assert.equal(defenseSnapshot.battlefield.id, "map");
assert.equal(defenseSnapshot.descriptors.length, 1);

console.log("semantic bounded domain kits smoke passed");
