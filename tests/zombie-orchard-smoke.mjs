import { createZombieOrchardProtoKits } from "../protokits/zombie-orchard/index.js";

const NexusRealtime = {
  defineResource: (name) => ({ kind: "resource", name }),
  defineEvent: (name) => ({ kind: "event", name }),
  defineComponent: (name) => ({ kind: "component", name }),
  defineRuntimeKit: (config) => Object.freeze(config)
};

function createWorld() {
  const resources = new Map();
  const events = new Map();
  return {
    __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 },
    setResource(definition, value) {
      resources.set(definition.name, value);
      return value;
    },
    getResource(definition) {
      return resources.get(definition.name);
    },
    emit(definition, payload) {
      const queue = events.get(definition.name) ?? [];
      queue.push(payload);
      events.set(definition.name, queue);
      return payload;
    },
    readEvents(definition) {
      return (events.get(definition.name) ?? []).slice();
    },
    clearAllEvents() {
      events.clear();
    },
    query() {
      return [];
    }
  };
}

function installKits(kits, world, engine) {
  for (const kit of kits) kit.initWorld?.({ world, engine, kit, options: {} });
  for (const kit of kits) kit.install?.({ world, engine, kit, options: {} });
}

function tickKits(kits, world, delta, frame) {
  world.__nexusClock = { delta, elapsed: delta * frame, frame };
  for (const phase of ["input", "simulate", "resolve", "cleanup"]) {
    for (const kit of kits) {
      for (const entry of kit.systems ?? []) {
        if (entry.phase === phase) entry.system(world);
      }
    }
  }
  world.clearAllEvents();
}

const world = createWorld();
const engine = { world, zombieOrchard: {} };
const kits = createZombieOrchardProtoKits(NexusRealtime, {
  survivalRounds: {
    autoStart: false,
    baseDurationSeconds: 3,
    baseSpawnBudget: 8,
    baseEnemyCap: 6
  },
  orchardBiome: {
    seed: "zombie-orchard-smoke",
    targetActiveApples: 6
  },
  hordeDirector: {
    initialSpawnCooldown: 0,
    minSpawnIntervalSeconds: 0.01,
    maxSpawnIntervalSeconds: 0.02
  }
});

installKits(kits, world, engine);
engine.zombieOrchard.survivalRounds.startRound(1, "smoke");
engine.zombieOrchard.hordeDirector.feedPlayerSnapshot({
  position: { x: 0, z: 0 },
  health01: 1,
  stamina01: 1,
  killsRecently: 3,
  applesRecently: 2
});

for (let frame = 1; frame <= 10; frame += 1) {
  tickKits(kits, world, 0.1, frame);
}

const round = engine.zombieOrchard.survivalRounds.getState();
const horde = engine.zombieOrchard.hordeDirector.getState();
const monsters = engine.zombieOrchard.monsterRoster.getState();
const orchard = engine.zombieOrchard.orchardBiome.snapshot();
const weapons = engine.zombieOrchard.foundWeapons.getState();

if (round.round !== 1 || round.status !== "active") throw new Error("survival round did not stay active during smoke test");
if (!horde.mode || horde.mode === "waiting") throw new Error("horde director did not enter pressure mode");
if (!monsters.recentSpawnRequests.length) throw new Error("monster roster did not expand horde spawn requests");
if (!orchard.activeApples.length) throw new Error("orchard biome did not expose active apples");
if (!weapons.pickups.length) throw new Error("found weapon kit did not expose pickups");

console.log(JSON.stringify({
  round: round.round,
  hordeMode: horde.mode,
  spawnRequests: monsters.recentSpawnRequests.length,
  apples: orchard.activeApples.length,
  pickups: weapons.pickups.length
}, null, 2));
