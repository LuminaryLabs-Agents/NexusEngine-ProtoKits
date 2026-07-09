// Smoke signature: NexusEngine-generic-defense-replay::fixtures::2026-06-23

const fastDefenseLevel = Object.freeze({
  id: "generic-defense-replay-fast-clear",
  label: "Generic Defense Replay Fast Clear",
  width: 160,
  height: 80,
  path: [
    { x: 0, y: 40 },
    { x: 120, y: 40 }
  ],
  vital: { id: "core", label: "Core", x: 120, y: 40, maxHealth: 5 },
  slots: [{ id: "slot-a", x: 10, y: 40, tags: ["frontline"] }],
  blueprints: {
    bolt: {
      id: "bolt",
      label: "Replay Bolt",
      cost: 10,
      upgradeCost: 5,
      maxLevel: 2,
      range: 150,
      damage: 100,
      fireRate: 10,
      projectileSpeed: 1000,
      color: "#ffffff",
      role: "single-target"
    }
  },
  buildOrder: ["bolt"],
  startingCurrency: 200,
  waves: [
    { id: "wave-1", label: "Replay runner", reward: 20, groups: [{ archetype: "runner", count: 1, cadence: 1 }] }
  ],
  archetypes: {
    runner: { id: "runner", label: "Runner", maxHealth: 20, speed: 10, reward: 3, coreDamage: 1, radius: 6, color: "#ffffff" }
  }
});

const breachLevel = Object.freeze({
  id: "generic-defense-replay-breach",
  label: "Generic Defense Replay Breach",
  width: 40,
  height: 40,
  path: [
    { x: 0, y: 20 },
    { x: 10, y: 20 }
  ],
  vital: { id: "core", label: "Core", x: 10, y: 20, maxHealth: 1 },
  slots: [{ id: "slot-a", x: 5, y: 8, tags: ["unused"] }],
  blueprints: {
    bolt: {
      id: "bolt",
      label: "Unused Bolt",
      cost: 10,
      upgradeCost: 5,
      maxLevel: 1,
      range: 4,
      damage: 1,
      fireRate: 1,
      projectileSpeed: 20,
      color: "#ffffff"
    }
  },
  buildOrder: ["bolt"],
  startingCurrency: 0,
  waves: [
    { id: "breach-1", label: "Breach runner", reward: 0, groups: [{ archetype: "runner", count: 1, cadence: 1 }] }
  ],
  archetypes: {
    runner: { id: "runner", label: "Runner", maxHealth: 10, speed: 20, reward: 0, coreDamage: 1, radius: 4, color: "#ffffff" }
  }
});

export const genericDefenseReplayFixtures = Object.freeze([
  {
    id: "defense-build-upgrade-wave-reward",
    config: { level: fastDefenseLevel },
    steps: [
      { call: "genericDefense.build", args: ["slot-a", "bolt", { commandId: "build-slot-a" }] },
      { tick: { count: 2, dt: 0 } },
      { call: "genericDefense.upgrade", args: ["structure-1", { commandId: "upgrade-structure-1" }] },
      { tick: { count: 2, dt: 0 } },
      { call: "genericDefense.startWave", args: [{ commandId: "start-wave-1", waveNumber: 1 }] },
      { tick: { count: 1, dt: 0.1 } },
      { tick: { count: 2, dt: 0.1 } }
    ],
    expected: {
      eventCounts: {
        BuildRequested: 1,
        StructureBuilt: 1,
        UpgradeRequested: 1,
        StructureUpgraded: 1,
        EconomyDebit: 2,
        StartWave: 1,
        WaveStarted: 1,
        EnemyKilled: 1,
        EconomyCredit: 2,
        WaveCompleted: 1,
        VitalDamaged: 0,
        Rejected: 0
      },
      paths: {
        "session.status": "won",
        "session.won": true,
        "session.waveIndex": 1,
        "economy.currency": 208,
        "structures.structures.structure-1.level": 2,
        "structures.structures.structure-1.damage": 134,
        "agents.waveActive": false,
        "agents.currentWaveId": "wave-1",
        "map.vital.health": 5,
        "render.hud.status": "won",
        "render.hud.currency": 208
      },
      descriptorKindCounts: {
        path: 1,
        vital: 1,
        "build-slot": 1,
        structure: 1,
        effect: 3
      }
    }
  },
  {
    id: "defense-vital-breach-loss",
    config: { level: breachLevel },
    steps: [
      { call: "genericDefense.startWave", args: [{ commandId: "start-breach", waveNumber: 1 }] },
      { tick: { count: 3, dt: 1 } }
    ],
    expected: {
      eventCounts: {
        StartWave: 1,
        WaveStarted: 1,
        VitalDamaged: 1,
        WaveCompleted: 1,
        EnemyKilled: 0,
        EconomyCredit: 0,
        Rejected: 0
      },
      paths: {
        "session.status": "lost",
        "session.lost": true,
        "map.vital.health": 0,
        "agents.waveActive": false,
        "render.hud.status": "lost",
        "render.hud.core": "0/1"
      },
      descriptorKindCounts: {
        path: 1,
        vital: 1,
        "build-slot": 1
      }
    }
  }
]);
