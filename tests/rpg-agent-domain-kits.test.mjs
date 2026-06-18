import assert from "node:assert/strict";

import { createPerceptionKit } from "../protokits/perception-kit/index.js";
import { createAffordanceChoiceKit } from "../protokits/affordance-choice-kit/index.js";
import { createRpgSocialFactKit } from "../protokits/rpg-social-fact-kit/index.js";
import { createAgentKit } from "../protokits/agent-kit/index.js";

function createNexusStub() {
  return {
    defineResource(name) { return { kind: "resource", name }; },
    defineEvent(name) { return { kind: "event", name }; },
    defineRuntimeKit(definition) { return definition; }
  };
}

function install(kits) {
  const resources = new Map();
  const events = [];
  const world = {
    __nexusClock: { frame: 1, elapsed: 0, delta: 1 / 60 },
    getResource(resource) { return resources.get(resource); },
    setResource(resource, value) { resources.set(resource, value); },
    emit(event, payload) { events.push({ event: event.name, payload }); },
    readEvents(event) { return events.filter((entry) => entry.event === event.name).map((entry) => entry.payload); }
  };
  const engine = {};
  for (const kit of kits) kit.initWorld?.({ world, engine });
  for (const kit of kits) kit.install?.({ world, engine });
  return { engine, world, events };
}

const NexusRealtime = createNexusStub();
const { engine } = install([
  createAgentKit(NexusRealtime, {
    agents: [{ id: "guard_01", role: "guard", goals: ["protect market"] }],
    knownTargets: ["player", "apple", "merchant", "gate"],
    allowedIntents: ["observe", "warn", "accuse", "question", "unlock"]
  }),
  createPerceptionKit(NexusRealtime, {
    entities: [
      { id: "guard_01", label: "Guard", role: "guard", position: { x: 0, z: 0 }, metadata: { sightRange: 8 } },
      { id: "player", label: "Player", position: { x: 2, z: 0 }, tags: ["person"] },
      { id: "merchant", label: "Merchant", position: { x: 4, z: 0 }, tags: ["person"] },
      { id: "gate", label: "Gate", position: { x: 5, z: 0 }, tags: ["door"] },
      { id: "distant_wolf", label: "Distant Wolf", position: { x: 40, z: 0 }, tags: ["monster"] },
      { id: "hidden_note", label: "Hidden Note", position: { x: 1, z: 0 }, hidden: true }
    ]
  }),
  createRpgSocialFactKit(NexusRealtime, {
    ownership: { apple: { itemId: "apple", ownerId: "merchant", holderId: "merchant", stolen: false } }
  }),
  createAffordanceChoiceKit(NexusRealtime, {
    actions: [
      { id: "patrol", label: "patrol market", intent: "observe", priority: 1 },
      { id: "warn", label: "warn player", intent: "warn", targetId: "player", priority: 2 },
      { id: "accuse", label: "accuse player", intent: "accuse", targetId: "player", requiresFacts: ["apple.stolen"], priority: 3 },
      { id: "unlock", label: "unlock gate", intent: "unlock", targetId: "gate", blockedByFacts: ["apple.stolen"], priority: 4 }
    ]
  })
]);

const observation = engine.perception.observe("guard_01");
assert.ok(observation.visibleEntityIds.includes("player"));
assert.ok(observation.visibleEntityIds.includes("merchant"));
assert.equal(observation.visibleEntityIds.includes("distant_wolf"), false);
assert.equal(observation.visibleEntityIds.includes("hidden_note"), false);

let legal = engine.agentChoices.getLegalActions("guard_01");
assert.ok(legal.some((action) => action.id === "warn"));
assert.ok(legal.some((action) => action.id === "unlock"));
assert.equal(legal.some((action) => action.id === "accuse"), false);

engine.socialFacts.markStolen("apple", "player", "guard_01");
legal = engine.agentChoices.getLegalActions("guard_01");
assert.ok(legal.some((action) => action.id === "accuse"));
assert.equal(legal.some((action) => action.id === "unlock"), false);

const packet = engine.agentChoices.buildChoicePacket("guard_01");
assert.ok(packet.actionLabels.includes("accuse player"));
assert.match(packet.observationText, /Guard sees/);

const choice = engine.agentChoices.chooseFromScores("guard_01", { accuse: 0.9, warn: 0.2 }, { packet });
assert.equal(choice.actionId, "accuse");

const committed = engine.agentChoices.commitChoice("guard_01", choice);
assert.equal(committed.accepted.accepted, true);
assert.equal(engine.agents.getAgent("guard_01").currentIntent.intent, "accuse");

engine.socialFacts.adjustRelationship("guard_01", "player", "suspicion", 2, "saw theft");
assert.equal(engine.socialFacts.getRelationship("guard_01", "player").suspicion, 2);

console.log("rpg-agent-domain-kits.test.mjs passed");
