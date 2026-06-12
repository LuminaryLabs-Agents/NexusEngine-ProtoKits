import { TAU, DEFAULT_SEED, createNoise, createRng, smoothNoise } from "./random.js";

const ISLAND_NAMES = ["Gullwake", "Cinder Cay", "Pearlhook", "Old Marrow", "Stormglass", "Knife Atoll", "Sable Tooth", "Crownreef", "Amber Shoal"];

function makeIsland(rng, index) {
  const ring = 280 + index * 120 + rng() * 120;
  const angle = index * 1.61 + rng() * 0.8;
  const radius = 62 + rng() * 86;
  const x = Math.cos(angle) * ring;
  const z = Math.sin(angle) * ring - 240;
  const name = ISLAND_NAMES[index % ISLAND_NAMES.length];
  const portAngle = angle + Math.PI + (rng() - 0.5) * 1.15;
  const port = (index === 0 || rng() > 0.55)
    ? { x: x + Math.cos(portAngle) * (radius + 24), z: z + Math.sin(portAngle) * (radius + 24), name: index === 0 ? "Gullwake Port" : `${name} Dock` }
    : null;
  const wreckAngle = angle + 1.2 + rng() * 1.8;
  const wreck = {
    id: `wreck-${index}`,
    x: x + Math.cos(wreckAngle) * (radius + 70 + rng() * 70),
    z: z + Math.sin(wreckAngle) * (radius + 70 + rng() * 70),
    depth: 10 + rng() * 36,
    value: 55 + Math.floor(rng() * 125),
    taken: false
  };
  const reefs = Array.from({ length: 3 + Math.floor(rng() * 5) }, (_, i) => {
    const reefAngle = angle + i * 0.95 + rng() * 0.9;
    const reefDistance = radius + 34 + rng() * 72;
    return { id: `reef-${index}-${i}`, x: x + Math.cos(reefAngle) * reefDistance, z: z + Math.sin(reefAngle) * reefDistance, r: 14 + rng() * 24 };
  });
  const palms = Array.from({ length: 8 + Math.floor(rng() * 16) }, (_, i) => {
    const palmAngle = rng() * TAU;
    const palmRadius = rng() * radius * 0.58;
    return { id: `palm-${index}-${i}`, x: x + Math.cos(palmAngle) * palmRadius, z: z + Math.sin(palmAngle) * palmRadius * 0.72, h: 9 + rng() * 12 };
  });
  return { id: `island-${index}`, index, name, x, z, radius, port, wreck, reefs, palms, discovered: index === 0 };
}

export function createBlackwakeWorld(seed = DEFAULT_SEED) {
  const rng = createRng(seed);
  const noise = createNoise(seed);
  const islands = Array.from({ length: 10 }, (_, index) => makeIsland(rng, index));
  const start = islands[0].port ?? { x: 0, z: 0, name: "Gullwake Port" };
  return {
    seed,
    rng,
    noise,
    islands,
    start,
    wind: { angle: -0.55, speed: 0.68 },
    storm: { intensity: 0.1, target: 0.18, lightning: 0, rain: 0 },
    sun: { angle: -0.9, elevation: 0.38 },
    sampleOcean(x, z, time) {
      const n = smoothNoise(noise, x * 0.018 + time * 0.07, z * 0.018 - time * 0.05);
      const long = Math.sin(x * 0.018 + z * 0.011 + time * 0.72) * 1.0;
      const cross = Math.sin(x * -0.036 + z * 0.027 + time * 1.28) * 0.36;
      return (long + cross + n * 0.32) * (1 + this.storm.intensity * 1.7);
    },
    currentAt(x, z, time) {
      return {
        x: Math.sin(z * 0.003 + time * 0.08) * 0.08,
        z: Math.cos(x * 0.003 - time * 0.06) * 0.08
      };
    },
    nearestPort(pos) {
      let best = null;
      for (const island of islands) {
        if (!island.port) continue;
        const d = Math.hypot(pos.x - island.port.x, pos.z - island.port.z);
        if (!best || d < best.distance) best = { island, port: island.port, distance: d };
      }
      return best;
    },
    nearestWreck(pos) {
      let best = null;
      for (const island of islands) {
        const d = Math.hypot(pos.x - island.wreck.x, pos.z - island.wreck.z);
        if (!best || d < best.distance) best = { island, wreck: island.wreck, distance: d };
      }
      return best;
    }
  };
}
