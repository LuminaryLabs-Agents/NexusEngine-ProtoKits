import { createSeededRandom, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const VEGETATION_ARCHETYPE_KIT_VERSION = "0.0.1";

function normalizeRange(range, fallback = [1, 1]) {
  const source = Array.isArray(range) ? range : fallback;
  const min = number(source[0], fallback[0]);
  const max = number(source[1], fallback[1]);
  return Object.freeze([Math.min(min, max), Math.max(min, max)]);
}

function normalizeSpecies(species = {}, index = 0) {
  const id = String(species.id ?? `species-${index + 1}`);
  return Object.freeze({
    id,
    label: String(species.label ?? id),
    kind: String(species.kind ?? "tree"),
    biomes: Object.freeze({ ...(species.biomes ?? { default: 1 }) }),
    scaleRange: normalizeRange(species.scaleRange, [0.8, 1.4]),
    sinkRange: normalizeRange(species.sinkRange, [0.03, 0.16]),
    crownProfile: Object.freeze({ ...(species.crownProfile ?? {}) }),
    trunkProfile: Object.freeze({ ...(species.trunkProfile ?? {}) }),
    lod: Object.freeze({ ...(species.lod ?? {}) }),
    materialSlots: Object.freeze({ ...(species.materialSlots ?? {}) }),
    metadata: Object.freeze({ ...(species.metadata ?? {}) })
  });
}

function pickWeighted(random, entries, fallback = null) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, number(entry.weight, 0)), 0);
  if (total <= 0) return fallback;
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= Math.max(0, number(entry.weight, 0));
    if (cursor <= 0) return entry.value;
  }
  return entries[entries.length - 1]?.value ?? fallback;
}

export function createVegetationArchetypeLibrary(data = {}, options = {}) {
  const species = (data.species ?? options.species ?? []).map(normalizeSpecies);
  const defaultSpecies = species[0] ?? normalizeSpecies({ id: "default-tree" });
  const byId = new Map(species.map((entry) => [entry.id, entry]));

  function getSpecies(id) {
    return byId.get(String(id)) ?? null;
  }

  function getScaleRange(id) {
    return (getSpecies(id) ?? defaultSpecies).scaleRange;
  }

  function getSinkRange(id) {
    return (getSpecies(id) ?? defaultSpecies).sinkRange;
  }

  function getLodSet(id) {
    return Object.freeze({ ...((getSpecies(id) ?? defaultSpecies).lod) });
  }

  function getMaterialSlots(id) {
    return Object.freeze({ ...((getSpecies(id) ?? defaultSpecies).materialSlots) });
  }

  function sampleSpeciesForBiome(biomeId = "default", randomInput = null) {
    const random = typeof randomInput === "function" ? randomInput : createSeededRandom(`${options.seed ?? "vegetation"}:${biomeId}`);
    const entries = species.map((entry) => ({ value: entry, weight: entry.biomes[biomeId] ?? entry.biomes.default ?? 0 })).filter((entry) => entry.weight > 0);
    return pickWeighted(random, entries, defaultSpecies);
  }

  function sampleInstanceForBiome(biomeId = "default", randomInput = null) {
    const random = typeof randomInput === "function" ? randomInput : createSeededRandom(`${options.seed ?? "vegetation-instance"}:${biomeId}`);
    const picked = sampleSpeciesForBiome(biomeId, random);
    const [scaleMin, scaleMax] = picked.scaleRange;
    const [sinkMin, sinkMax] = picked.sinkRange;
    return Object.freeze({
      speciesId: picked.id,
      kind: picked.kind,
      scale: scaleMin + (scaleMax - scaleMin) * random(),
      sink: sinkMin + (sinkMax - sinkMin) * random(),
      materialSlots: picked.materialSlots,
      lod: picked.lod
    });
  }

  return Object.freeze({ species: Object.freeze([...species]), getSpecies, sampleSpeciesForBiome, sampleInstanceForBiome, getScaleRange, getSinkRange, getLodSet, getMaterialSlots });
}

export function createVegetationArchetypeKit(nexusEngine = {}, options = {}) {
  const library = createVegetationArchetypeLibrary(options.data ?? options, options);
  const api = Object.freeze({ id: options.id ?? "vegetation-archetype-kit", version: VEGETATION_ARCHETYPE_KIT_VERSION, ...library });
  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusEngine, {
        id: runtimeOptions.id ?? api.id,
        provides: runtimeOptions.provides ?? ["domain:vegetation-archetype", "service:vegetation-species", "service:vegetation-sampling"],
        bindings: { vegetationArchetypeKit: api },
        metadata: { version: VEGETATION_ARCHETYPE_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
}
