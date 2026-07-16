import {
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  seededUnit,
  stableId
} from "../production-domain-kit-support.js";

export const ECOSYSTEM_POPULATION_CYCLE_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createEcosystemPopulationCycleDomainKit",
  kitId: "ecosystem-population-cycle-domain-kit",
  domain: "ecosystem-population-cycle",
  domainPath: "n:ecology:population-cycle",
  parentDomainPath: "n:ecology",
  apiName: "ecosystemPopulation",
  schema: "nexusengine.ecosystem-population-cycle/1",
  resource: "ecosystemPopulation.state",
  purpose: "Deterministic aggregate species cohorts, trophic flows, carrying capacity, births, mortality, and migration.",
  ownership: ["species cohorts", "regional populations", "feeding links", "birth and mortality rules", "carrying-capacity pressure", "seeded cycle transitions"],
  exclusions: ["individual creature AI", "spawn placement", "terrain generation", "weather", "rendered wildlife", "asset loading", "species lore"],
  dependencies: ["NexusEngine DomainServiceKit", "portable region ids", "authored species and feeding data"],
  services: ["species", "feeding-links", "capacity", "migration", "seeded-cycles", "snapshots", "descriptors", "reset"],
  provides: ["ecology:population-cycle", "ecology:trophic-flow", "ecology:capacity-pressure"],
  events: ["ecosystem.populationChanged", "ecosystem.capacityExceeded", "ecosystem.localExtinction", "ecosystem.recoveryStarted", "ecosystem.commandRejected", "ecosystem.reset"],
  rejectedEvent: "ecosystem.commandRejected",
  resetEvent: "ecosystem.reset"
};

function normalizeSpecies(input = {}, index = 0) {
  const id = stableId(input.id ?? `species-${index + 1}`, "Species");
  return {
    id,
    birthRate: Math.max(0, number(input.birthRate, 0.08)),
    mortalityRate: Math.max(0, number(input.mortalityRate, 0.03)),
    minimumViablePopulation: Math.max(0, integer(input.minimumViablePopulation, 1)),
    metadata: clone(input.metadata ?? {})
  };
}

function normalizeFeedingLink(input = {}, index = 0) {
  return {
    id: stableId(input.id ?? `feeding-${index + 1}`, "Feeding link"),
    predatorId: stableId(input.predatorId, "Predator"),
    preyId: stableId(input.preyId, "Prey"),
    predationRate: Math.max(0, number(input.predationRate, 0.01)),
    efficiency: Math.max(0, number(input.efficiency, 0.1)),
    metadata: clone(input.metadata ?? {})
  };
}

function normalizeRegion(input = {}, index = 0) {
  const id = stableId(input.id ?? `region-${index + 1}`, "Ecosystem region");
  return {
    id,
    populations: Object.fromEntries(Object.entries(input.populations ?? {}).map(([speciesId, value]) => [speciesId, Math.max(0, integer(value))])),
    capacities: Object.fromEntries(Object.entries(input.capacities ?? {}).map(([speciesId, value]) => [speciesId, Math.max(0, number(value))])),
    metadata: clone(input.metadata ?? {})
  };
}

function createInitial(config) {
  const species = Object.fromEntries(list(config.species).map((entry, index) => {
    const value = normalizeSpecies(entry, index);
    return [value.id, value];
  }));
  const feedingLinks = Object.fromEntries(list(config.feedingLinks).map((entry, index) => {
    const value = normalizeFeedingLink(entry, index);
    return [value.id, value];
  }));
  const regions = Object.fromEntries(list(config.regions).map((entry, index) => {
    const value = normalizeRegion(entry, index);
    return [value.id, value];
  }));
  return { seed: String(config.seed ?? "ecosystem-population"), species, feedingLinks, regions, cycle: integer(config.initialCycle) };
}

export function createEcosystemPopulationCycleDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const registerSpecies = (input) => {
      const value = normalizeSpecies(input);
      if (read().species[value.id]) return clone(read().species[value.id]);
      commit({ result: { ok: true, action: "register-species", speciesId: value.id }, transform: (state) => ({ ...state, species: { ...state.species, [value.id]: value } }) });
      return clone(value);
    };
    const registerFeedingLink = (input) => {
      const value = normalizeFeedingLink(input);
      if (!read().species[value.predatorId] || !read().species[value.preyId]) return reject("unknown-feeding-species", { linkId: value.id });
      if (read().feedingLinks[value.id]) return clone(read().feedingLinks[value.id]);
      commit({ result: { ok: true, action: "register-feeding-link", linkId: value.id }, transform: (state) => ({ ...state, feedingLinks: { ...state.feedingLinks, [value.id]: value } }) });
      return clone(value);
    };
    const setCapacity = (regionId, values = {}) => {
      const id = stableId(regionId, "Capacity region");
      const previous = read().regions[id] ?? normalizeRegion({ id });
      const capacities = { ...previous.capacities, ...Object.fromEntries(Object.entries(values).map(([speciesId, value]) => [speciesId, Math.max(0, number(value))])) };
      commit({ result: { ok: true, action: "set-capacity", regionId: id }, transform: (state) => ({ ...state, regions: { ...state.regions, [id]: { ...previous, capacities } } }) });
      return clone(read().regions[id]);
    };
    const applyMigration = (fact = {}) => {
      const regionId = stableId(fact.regionId, "Migration region");
      const speciesId = stableId(fact.speciesId, "Migration species");
      if (!read().species[speciesId]) return reject("unknown-species", { regionId, speciesId, commandId: fact.commandId });
      const region = read().regions[regionId] ?? normalizeRegion({ id: regionId });
      const before = region.populations[speciesId] ?? 0;
      const after = Math.max(0, before + integer(Math.abs(fact.delta), 0) * (number(fact.delta) < 0 ? -1 : 1));
      return commit({
        result: { ok: true, action: "apply-migration", regionId, speciesId, before, after },
        eventName: "ecosystem.populationChanged",
        commandId: fact.commandId,
        transform: (state) => ({ ...state, regions: { ...state.regions, [regionId]: { ...region, populations: { ...region.populations, [speciesId]: after } } } })
      });
    };
    const advanceCycle = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      const events = [];
      let state = clone(read());
      for (let step = 0; step < count; step += 1) {
        state.cycle += 1;
        for (const regionId of Object.keys(state.regions).sort()) {
          const region = state.regions[regionId];
          const populations = { ...region.populations };
          const before = { ...populations };
          for (const speciesId of Object.keys(state.species).sort()) {
            const definition = state.species[speciesId];
            const current = Math.max(0, integer(populations[speciesId]));
            const variation = 0.95 + seededUnit(`${state.seed}:${state.cycle}:${regionId}:${speciesId}`) * 0.1;
            const births = Math.floor(current * definition.birthRate * variation);
            const deaths = Math.floor(current * definition.mortalityRate);
            populations[speciesId] = Math.max(0, current + births - deaths);
          }
          for (const linkId of Object.keys(state.feedingLinks).sort()) {
            const link = state.feedingLinks[linkId];
            const predator = populations[link.predatorId] ?? 0;
            const prey = populations[link.preyId] ?? 0;
            const consumed = Math.min(prey, Math.floor(predator * link.predationRate));
            populations[link.preyId] = Math.max(0, prey - consumed);
            populations[link.predatorId] = Math.max(0, predator + Math.floor(consumed * link.efficiency));
          }
          for (const speciesId of Object.keys(state.species).sort()) {
            const capacity = region.capacities[speciesId];
            if (capacity != null && populations[speciesId] > capacity) {
              events.push({ type: "ecosystem.capacityExceeded", regionId, speciesId, population: populations[speciesId], capacity, cycle: state.cycle });
              populations[speciesId] = Math.max(capacity, Math.floor(populations[speciesId] - (populations[speciesId] - capacity) * 0.5));
            }
            if ((before[speciesId] ?? 0) > 0 && populations[speciesId] === 0) events.push({ type: "ecosystem.localExtinction", regionId, speciesId, cycle: state.cycle });
            if ((before[speciesId] ?? 0) === 0 && populations[speciesId] > 0) events.push({ type: "ecosystem.recoveryStarted", regionId, speciesId, cycle: state.cycle });
            if ((before[speciesId] ?? 0) !== populations[speciesId]) events.push({ type: "ecosystem.populationChanged", regionId, speciesId, before: before[speciesId] ?? 0, after: populations[speciesId], cycle: state.cycle });
          }
          state.regions[regionId] = { ...region, populations };
        }
      }
      commit({ result: { ok: true, action: "advance-cycle", ticks: count, cycle: state.cycle, changeCount: events.length }, transform: () => state });
      for (const event of events) emit(event.type, event);
      return clone(read());
    };
    const getRegion = (regionId) => clone(read().regions[String(regionId)] ?? null);
    return {
      registerSpecies,
      registerFeedingLink,
      setCapacity,
      applyMigration,
      advanceCycle,
      getRegion,
      getDescriptors: () => Object.values(read().regions).sort((a, b) => a.id.localeCompare(b.id)).map((region) => ({ id: region.id, kind: "ecosystem-region-population", cycle: read().cycle, populations: clone(region.populations), capacities: clone(region.capacities) })),
      getTrophicFlows: () => Object.values(read().feedingLinks).sort((a, b) => a.id.localeCompare(b.id)).map(clone)
    };
  });
}

export default createEcosystemPopulationCycleDomainKit;
