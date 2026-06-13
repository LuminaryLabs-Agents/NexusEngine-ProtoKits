export const SoraFlightData = Object.freeze({
  seed: "sora-sunlit-v1",
  mode: "hybrid",
  quality: {
    tier: "adaptive",
    patchRadius: 3,
    maxInstancesPerPatch: 900,
    shadowMapSize: 2048,
    pixelRatioMax: 2
  },
  controls: {
    pitchUp: ["KeyW", "ArrowUp"],
    pitchDown: ["KeyS", "ArrowDown"],
    bankLeft: ["KeyA", "ArrowLeft"],
    bankRight: ["KeyD", "ArrowRight"],
    boost: ["Space"]
  },
  sky: {
    preset: "noon",
    sky: {
      zenith: "#5fb7ff",
      horizon: "#d8f2ff",
      fog: "#b9ddda",
      haze: 0.18,
      sun: { elevation: 48, azimuth: -35, color: "#fff1bd", intensity: 1.55 },
      clouds: [
        { id: "high-clouds", altitude: 900, density: 0.16, speed: 0.015, scale: 2.2 },
        { id: "horizon-bands", altitude: 420, density: 0.18, speed: 0.01, scale: 3.4 }
      ]
    }
  },
  lighting: {
    exposure: 1.08,
    toneMapping: "aces",
    outputColorSpace: "srgb",
    shadows: { enabled: true, mapSize: 2048, distance: 520, bias: -0.00015, normalBias: 0.02 },
    hemisphere: { sky: "#b9e7ff", ground: "#273b21", intensity: 0.72 }
  },
  terrain: {
    seed: "sora-terrain",
    scale: 0.005,
    detailScale: 0.02,
    amplitude: 90,
    detailAmplitude: 20,
    baseHeight: -40,
    biomeSize: 600
  },
  physics: {
    gravity: 0.18,
    drag: 0.04,
    lift: 0.95,
    maxSpeed: 140,
    boostImpulse: 45,
    boostCooldown: 1.5,
    pitchSpeed: 1.8,
    rollSpeed: 2.2,
    yawFromRoll: 1.5,
    groundClearance: 12
  },
  materials: [
    { id: "terrain.grass", role: "terrain", albedo: "#2f6b39", roughness: 0.92 },
    { id: "terrain.rock", role: "terrain", albedo: "#68706b", roughness: 0.86 },
    { id: "tree.bark", role: "static", albedo: "#4b2c17", roughness: 0.9 },
    { id: "tree.foliage", role: "static", albedo: "#165b2b", roughness: 0.82 },
    { id: "actor.body", role: "character", albedo: "#f8fafc", roughness: 0.7 },
    { id: "fx.wind", role: "emissive", albedo: "#7dd3fc", emissive: "#7dd3fc", alpha: 0.66 }
  ],
  scatterRules: [
    { id: "forest-trees", kind: "tree", archetypes: [{ id: "pine", weight: 1 }, { id: "spruce", weight: 0.7 }], densityByBiome: { forest: 1, meadow: 0.2, rocky: 0.05, highland: 0.15 }, maxPerPatch: 86, material: "tree.foliage", layer: "instanced-scatter", scaleMin: 0.8, scaleMax: 1.6 },
    { id: "rock-scatter", kind: "rock", archetypes: [{ id: "small-rock", weight: 1 }, { id: "slab-rock", weight: 0.45 }], densityByBiome: { forest: 0.24, meadow: 0.18, rocky: 0.8, highland: 0.55 }, maxPerPatch: 42, material: "terrain.rock", layer: "instanced-scatter", scaleMin: 0.5, scaleMax: 1.4 },
    { id: "cloud-puffs", kind: "cloud", archetypes: [{ id: "soft-puff", weight: 1 }], densityByBiome: { forest: 0.05, meadow: 0.06, rocky: 0.04, highland: 0.12 }, maxPerPatch: 10, material: "cloud.soft", layer: "transparent-fog", scaleMin: 1.5, scaleMax: 4.2 }
  ],
  flock: { count: 8, archetype: "bird", maxSpeed: 38, followForce: 18 },
  updrafts: { radius: 45, height: 220, lift: 28, maxPerPatch: 2 },
  checkpoints: { radius: 18, maxPerPatch: 2, altitudeMin: 70, altitudeMax: 220, reward: { boost: 32 } }
});
