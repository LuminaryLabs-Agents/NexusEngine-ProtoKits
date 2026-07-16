import {
  clamp,
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  stableId
} from "../production-domain-kit-support.js";

export const HABITAT_SUITABILITY_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createHabitatSuitabilityDomainKit",
  kitId: "habitat-suitability-domain-kit",
  domain: "habitat-suitability",
  domainPath: "n:ecology:habitat-suitability",
  parentDomainPath: "n:ecology",
  apiName: "habitatSuitability",
  schema: "nexusengine.habitat-suitability/1",
  resource: "habitatSuitability.state",
  purpose: "Evaluate authored ecological requirements against portable regional observations and expose suitability, limiting factors, and occupancy eligibility.",
  ownership: ["habitat requirement profiles", "regional condition observations", "weighted suitability", "limiting factors", "occupancy eligibility", "suitability history"],
  exclusions: ["biome generation", "terrain generation", "weather simulation", "population advancement", "spawn placement", "individual creature AI", "rendered habitat", "species content"],
  dependencies: ["NexusEngine DomainServiceKit", "portable region ids", "authored requirement profiles", "normalized condition observations"],
  services: ["profiles", "conditions", "evaluation", "occupancy-policy", "observation-invalidation", "snapshots", "descriptors", "reset"],
  provides: ["ecology:habitat-suitability", "habitat:limiting-factor", "habitat:occupancy-eligibility"],
  events: ["habitat.conditionsChanged", "habitat.suitabilityChanged", "habitat.thresholdCrossed", "habitat.limitingFactorChanged", "habitat.commandRejected", "habitat.reset"],
  rejectedEvent: "habitat.commandRejected",
  resetEvent: "habitat.reset"
};

function normalizeProfile(input = {}, index = 0) {
  const id = stableId(input.id ?? `profile-${index + 1}`, "Habitat profile");
  const requirements = list(input.requirements).map((requirement, requirementIndex) => ({
    id: stableId(requirement.id ?? requirement.conditionId ?? `condition-${requirementIndex + 1}`, "Habitat requirement"),
    conditionId: stableId(requirement.conditionId ?? requirement.id, "Habitat condition"),
    minimum: number(requirement.minimum ?? requirement.min, 0),
    maximum: number(requirement.maximum ?? requirement.max, 1),
    ideal: requirement.ideal == null ? null : number(requirement.ideal),
    weight: Math.max(0.0001, number(requirement.weight, 1)),
    required: requirement.required !== false
  }));
  return { id, requirements, occupancyThreshold: clamp(input.occupancyThreshold ?? 0.6), metadata: clone(input.metadata ?? {}) };
}

function normalizeObservation(input = {}, index = 0) {
  return {
    id: stableId(input.id ?? input.conditionId ?? `observation-${index + 1}`, "Habitat observation"),
    conditionId: stableId(input.conditionId ?? input.id, "Habitat condition"),
    value: number(input.value),
    valid: input.valid !== false,
    revision: Math.max(1, integer(input.revision, 1)),
    sourceId: input.sourceId == null ? null : String(input.sourceId),
    metadata: clone(input.metadata ?? {})
  };
}

function scoreRequirement(requirement, observation) {
  if (!observation?.valid) return requirement.required ? 0 : 1;
  if (observation.value < requirement.minimum) return Math.max(0, 1 - (requirement.minimum - observation.value) / Math.max(1, Math.abs(requirement.minimum)));
  if (observation.value > requirement.maximum) return Math.max(0, 1 - (observation.value - requirement.maximum) / Math.max(1, Math.abs(requirement.maximum)));
  if (requirement.ideal == null) return 1;
  const span = Math.max(0.0001, Math.max(requirement.ideal - requirement.minimum, requirement.maximum - requirement.ideal));
  return clamp(1 - Math.abs(observation.value - requirement.ideal) / span);
}

function createInitial(config) {
  const profiles = Object.fromEntries(list(config.profiles).map((entry, index) => {
    const value = normalizeProfile(entry, index);
    return [value.id, value];
  }));
  return { profiles, regions: {}, evaluations: {}, occupancyPolicy: { defaultThreshold: clamp(config.defaultOccupancyThreshold ?? 0.6), overrides: {} }, revisionCounter: 1 };
}

export function createHabitatSuitabilityDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const registerProfile = (input) => {
      const value = normalizeProfile(input);
      if (read().profiles[value.id]) return clone(read().profiles[value.id]);
      commit({ result: { ok: true, action: "register-profile", profileId: value.id }, transform: (state) => ({ ...state, profiles: { ...state.profiles, [value.id]: value } }) });
      return clone(value);
    };
    const setConditions = (regionId, observations, payload = {}) => {
      const id = stableId(regionId, "Habitat region");
      const region = read().regions[id] ?? { id, observations: {}, revision: 0 };
      const normalized = list(observations).map(normalizeObservation);
      const nextObservations = { ...region.observations };
      for (const observation of normalized) {
        const previous = nextObservations[observation.id];
        if (!previous || observation.revision >= previous.revision) nextObservations[observation.id] = observation;
      }
      return commit({ result: { ok: true, action: "set-conditions", regionId: id, observationCount: normalized.length }, eventName: "habitat.conditionsChanged", commandId: payload.commandId, transform: (state) => ({ ...state, regions: { ...state.regions, [id]: { ...region, observations: nextObservations, revision: region.revision + 1 } }, revisionCounter: state.revisionCounter + 1 }) });
    };
    const evaluate = (profileId, regionId, payload = {}) => {
      const profile = read().profiles[String(profileId)];
      const region = read().regions[String(regionId)];
      if (!profile) return reject("unknown-profile", { profileId, regionId, commandId: payload.commandId });
      if (!region) return reject("unknown-region", { profileId, regionId, commandId: payload.commandId });
      const observationsByCondition = Object.fromEntries(Object.values(region.observations).filter((observation) => observation.valid).map((observation) => [observation.conditionId, observation]));
      const factors = profile.requirements.map((requirement) => ({ requirementId: requirement.id, conditionId: requirement.conditionId, score: scoreRequirement(requirement, observationsByCondition[requirement.conditionId]), weight: requirement.weight, observedValue: observationsByCondition[requirement.conditionId]?.value ?? null }));
      const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
      const score = totalWeight > 0 ? factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight : 1;
      const limitingFactor = [...factors].sort((a, b) => a.score - b.score || a.conditionId.localeCompare(b.conditionId))[0] ?? null;
      const key = `${profile.id}:${region.id}`;
      const previous = read().evaluations[key];
      const threshold = read().occupancyPolicy.overrides[profile.id] ?? profile.occupancyThreshold ?? read().occupancyPolicy.defaultThreshold;
      const eligible = score >= threshold;
      const evaluation = { id: key, profileId: profile.id, regionId: region.id, score, threshold, eligible, limitingFactor, factors, regionRevision: region.revision, digest: `${profile.id}:${region.id}:${region.revision}:${score.toFixed(6)}` };
      const result = commit({ result: { ok: true, action: "evaluate", profileId: profile.id, regionId: region.id, score, eligible, limitingFactorId: limitingFactor?.conditionId ?? null }, eventName: "habitat.suitabilityChanged", commandId: payload.commandId, transform: (state) => ({ ...state, evaluations: { ...state.evaluations, [key]: evaluation } }) });
      if (!result.duplicate && previous && previous.eligible !== eligible) emit("habitat.thresholdCrossed", { profileId: profile.id, regionId: region.id, from: previous.eligible, to: eligible, score, threshold });
      if (!result.duplicate && previous?.limitingFactor?.conditionId !== limitingFactor?.conditionId) emit("habitat.limitingFactorChanged", { profileId: profile.id, regionId: region.id, from: previous?.limitingFactor?.conditionId ?? null, to: limitingFactor?.conditionId ?? null });
      return result.duplicate ? result : clone(evaluation);
    };
    const setOccupancyPolicy = (policy = {}) => {
      const defaultThreshold = clamp(policy.defaultThreshold ?? read().occupancyPolicy.defaultThreshold);
      const overrides = { ...read().occupancyPolicy.overrides, ...Object.fromEntries(Object.entries(policy.overrides ?? {}).map(([id, value]) => [id, clamp(value)])) };
      commit({ result: { ok: true, action: "set-occupancy-policy", defaultThreshold }, transform: (state) => ({ ...state, occupancyPolicy: { defaultThreshold, overrides } }) });
      return clone(read().occupancyPolicy);
    };
    const invalidate = (observationId, payload = {}) => {
      const id = stableId(observationId, "Habitat observation");
      const regionEntry = Object.entries(read().regions).find(([, region]) => region.observations[id]);
      if (!regionEntry) return reject("unknown-observation", { observationId: id, commandId: payload.commandId });
      const [regionId, region] = regionEntry;
      return commit({ result: { ok: true, action: "invalidate-observation", observationId: id, regionId }, eventName: "habitat.conditionsChanged", commandId: payload.commandId, transform: (state) => ({ ...state, regions: { ...state.regions, [regionId]: { ...region, observations: { ...region.observations, [id]: { ...region.observations[id], valid: false } }, revision: region.revision + 1 } }, revisionCounter: state.revisionCounter + 1 }) });
    };
    return {
      registerProfile,
      setConditions,
      evaluate,
      setOccupancyPolicy,
      invalidate,
      getDescriptors: () => Object.values(read().evaluations).sort((a, b) => a.id.localeCompare(b.id)).map((entry) => ({ id: entry.id, kind: "habitat-suitability", profileId: entry.profileId, regionId: entry.regionId, score: entry.score, eligible: entry.eligible, limitingFactorId: entry.limitingFactor?.conditionId ?? null }))
    };
  });
}

export default createHabitatSuitabilityDomainKit;
