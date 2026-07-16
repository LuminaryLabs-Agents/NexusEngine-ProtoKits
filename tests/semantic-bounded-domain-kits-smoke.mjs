import assert from "node:assert/strict";
import * as RealNexusEngine from "nexusengine";
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
import { createContagionTransmissionDomainKit } from "../protokits/contagion-transmission-domain-kit/index.js";
import { createEcosystemPopulationCycleDomainKit } from "../protokits/ecosystem-population-cycle-domain-kit/index.js";
import { createStructuralSupportNetworkDomainKit } from "../protokits/structural-support-network-domain-kit/index.js";
import { createCollectiveResolveDomainKit } from "../protokits/collective-resolve-domain-kit/index.js";
import { createTerritoryInfluenceDomainKit } from "../protokits/territory-influence-domain-kit/index.js";
import { createRumorPropagationDomainKit } from "../protokits/rumor-propagation-domain-kit/index.js";
import { createNavigationKnowledgeDomainKit } from "../protokits/navigation-knowledge-domain-kit/index.js";
import { createRescueTriageDomainKit } from "../protokits/rescue-triage-domain-kit/index.js";
import { createNegotiationCommitmentDomainKit } from "../protokits/negotiation-commitment-domain-kit/index.js";
import { createHabitatSuitabilityDomainKit } from "../protokits/habitat-suitability-domain-kit/index.js";

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

function runProductionDomainScenario() {
  const productionEngine = RealNexusEngine.createEngine({
    kits: [
      createContagionTransmissionDomainKit(RealNexusEngine, {
        contagions: [{ id: "blight", exposureThreshold: 2, incubationTicks: 1, infectiousTicks: 1, recoveryTicks: 1, immunityTicks: 2 }]
      }),
      createEcosystemPopulationCycleDomainKit(RealNexusEngine, {
        seed: "rewilding-basin",
        species: [{ id: "grazer", birthRate: 0.2, mortalityRate: 0 }, { id: "predator", birthRate: 0, mortalityRate: 0 }],
        feedingLinks: [{ id: "predator-grazer", predatorId: "predator", preyId: "grazer", predationRate: 0.2, efficiency: 0.1 }],
        regions: [{ id: "basin", populations: { grazer: 20, predator: 5 }, capacities: { grazer: 30, predator: 10 } }]
      }),
      createStructuralSupportNetworkDomainKit(RealNexusEngine, {
        networks: [{ id: "bridge", nodes: [{ id: "anchor", capacity: 20, anchor: true }, { id: "span", capacity: 5 }], edges: [{ id: "anchor-span", from: "anchor", to: "span" }] }]
      }),
      createCollectiveResolveDomainKit(RealNexusEngine, {
        collectives: [{ id: "rescue-team", baseResolve: 0.5, breakThreshold: 0.4, rallyThreshold: 0.45, rallyBoost: 0.6, members: [{ id: "scout", readiness: 0.2 }], leader: { id: "captain", active: true } }]
      }),
      createTerritoryInfluenceDomainKit(RealNexusEngine, {
        regions: [{ id: "crossing", controlThreshold: 5, contestMargin: 2 }]
      }),
      createRumorPropagationDomainKit(RealNexusEngine, {
        seed: "border-accord",
        claims: [{ id: "safe-passage", payload: { route: "north" }, distortionVariants: [{ route: "east" }] }]
      }),
      createNavigationKnowledgeDomainKit(RealNexusEngine, {
        observers: [{ id: "guide" }, { id: "traveler" }]
      }),
      createRescueTriageDomainKit(RealNexusEngine, {
        casualties: [{ id: "climber", severity: 0.8, deteriorationPerTick: 0, treatments: [{ id: "stabilize", effect: 0.7, durationTicks: 1 }] }]
      }),
      createNegotiationCommitmentDomainKit(RealNexusEngine, {
        sessions: [{ id: "accord", partyIds: ["north", "south"], allowedTermTypes: ["passage"] }]
      }),
      createHabitatSuitabilityDomainKit(RealNexusEngine, {
        profiles: [{ id: "reef-grazer", occupancyThreshold: 0.7, requirements: [{ id: "salinity", conditionId: "salinity", minimum: 0.4, maximum: 0.9, ideal: 0.7 }] }]
      })
    ]
  });

  productionEngine.n.contagionTransmission.recordExposure({ contagionId: "blight", subjectId: "worker-a", sourceId: "worker-zero", dose: 2, commandId: "exposure-1" });
  productionEngine.n.contagionTransmission.recordExposure({ contagionId: "blight", subjectId: "worker-a", sourceId: "worker-zero", dose: 2, commandId: "exposure-1" });
  assert.equal(productionEngine.n.contagionTransmission.getSnapshot().transmissions.length, 1);
  productionEngine.n.contagionTransmission.advance(3);
  assert.equal(productionEngine.n.contagionTransmission.getSubject("worker-a").stage, "recovered");

  productionEngine.n.ecosystemPopulation.advanceCycle(2);
  assert.ok(productionEngine.n.ecosystemPopulation.getRegion("basin").populations.grazer > 0);

  productionEngine.n.structuralSupport.applyLoad({ networkId: "bridge", nodeId: "span", load: 8, commandId: "load-1" });
  productionEngine.n.structuralSupport.resolve(1);
  assert.equal(productionEngine.n.structuralSupport.getMargin("bridge", "span").failed, true);

  productionEngine.n.collectiveResolve.recordShock({ id: "collapse", collectiveId: "rescue-team", amount: 0.5, recoveryPerTick: 0, commandId: "shock-1" });
  assert.equal(productionEngine.n.collectiveResolve.getSnapshot().collectives["rescue-team"].status, "broken");
  productionEngine.n.collectiveResolve.attemptRally({ collectiveId: "rescue-team", commandId: "rally-1" });
  assert.equal(productionEngine.n.collectiveResolve.getSnapshot().collectives["rescue-team"].status, "steady");

  productionEngine.n.territoryInfluence.contribute({ id: "north-supply", regionId: "crossing", factionId: "north", value: 6, commandId: "influence-1" });
  assert.equal(productionEngine.n.territoryInfluence.getController("crossing"), "north");

  productionEngine.n.rumorPropagation.share({ claimId: "safe-passage", sourceId: "guide", recipientId: "traveler", distortionChance: 1, commandId: "share-1" });
  assert.equal(productionEngine.n.rumorPropagation.getExposure("traveler")[0].distorted, true);

  productionEngine.n.navigationKnowledge.observe({ observerId: "guide", id: "north-pass", kind: "link", fromPlaceId: "camp", toPlaceId: "summit", confidence: 1, decayPerTick: 0.1, commandId: "observe-1" });
  productionEngine.n.navigationKnowledge.share({ fromObserverId: "guide", toObserverId: "traveler", factIds: ["north-pass"], commandId: "knowledge-share-1" });
  assert.equal(productionEngine.n.navigationKnowledge.getKnownGraph("traveler").links.length, 1);

  productionEngine.n.rescueTriage.assess({ casualtyId: "climber", commandId: "assess-1" });
  productionEngine.n.rescueTriage.beginTreatment({ casualtyId: "climber", treatmentId: "stabilize", commandId: "treatment-start-1" });
  productionEngine.n.rescueTriage.advance(1);
  productionEngine.n.rescueTriage.completeTreatment({ casualtyId: "climber", treatmentId: "stabilize", commandId: "treatment-complete-1" });
  assert.equal(productionEngine.n.rescueTriage.getPriorityQueue()[0].transportReady, true);

  productionEngine.n.negotiationCommitment.propose({ id: "offer-1", sessionId: "accord", proposerId: "north", recipientIds: ["south"], terms: [{ id: "passage-obligation", type: "passage", debtorId: "north", creditorId: "south", deadlineTick: 4 }], commandId: "offer-command-1" });
  productionEngine.n.negotiationCommitment.accept({ offerId: "offer-1", partyId: "south", commandId: "accept-1" });
  productionEngine.n.negotiationCommitment.recordFulfillment({ obligationId: "passage-obligation", evidence: { route: "north" }, commandId: "fulfill-1" });
  productionEngine.n.negotiationCommitment.settle({ sessionId: "accord", commandId: "settle-1" });
  assert.equal(productionEngine.n.negotiationCommitment.getSnapshot().sessions.accord.status, "settled");

  productionEngine.n.habitatSuitability.setConditions("basin", [{ id: "salinity-observation", conditionId: "salinity", value: 0.7, revision: 1 }], { commandId: "conditions-1" });
  const suitability = productionEngine.n.habitatSuitability.evaluate("reef-grazer", "basin", { commandId: "evaluate-1" });
  assert.equal(suitability.eligible, true);

  const apiNames = [
    "contagionTransmission",
    "ecosystemPopulation",
    "structuralSupport",
    "collectiveResolve",
    "territoryInfluence",
    "rumorPropagation",
    "navigationKnowledge",
    "rescueTriage",
    "negotiationCommitment",
    "habitatSuitability"
  ];
  const snapshots = Object.fromEntries(apiNames.map((apiName) => [apiName, productionEngine.n[apiName].getSnapshot()]));
  for (const apiName of apiNames) {
    productionEngine.n[apiName].reset({ reason: "restore-proof" });
    productionEngine.n[apiName].loadSnapshot(snapshots[apiName]);
    assert.deepEqual(productionEngine.n[apiName].getSnapshot(), snapshots[apiName], `${apiName} snapshot restores exactly`);
  }
  return snapshots;
}

const firstProductionRun = runProductionDomainScenario();
const secondProductionRun = runProductionDomainScenario();
assert.deepEqual(secondProductionRun, firstProductionRun, "production domain batch replays deterministically");

console.log("semantic bounded domain kits smoke passed");
