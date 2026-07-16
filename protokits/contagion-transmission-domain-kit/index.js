import {
  clamp,
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  stableId
} from "../production-domain-kit-support.js";

export const CONTAGION_TRANSMISSION_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createContagionTransmissionDomainKit",
  kitId: "contagion-transmission-domain-kit",
  domain: "contagion-transmission",
  domainPath: "n:biology:contagion-transmission",
  parentDomainPath: "n:biology",
  apiName: "contagionTransmission",
  schema: "nexusengine.contagion-transmission/1",
  resource: "contagionTransmission.state",
  purpose: "Deterministic exposure chains and infection lifecycle state for authored contagions.",
  ownership: ["contagion definitions", "subject exposure doses", "infection stages", "transmission lineage", "recovery and immunity windows"],
  exclusions: ["medical content", "damage and health", "agent motion", "contact detection", "rendering", "UI", "network transport", "wall-clock time"],
  dependencies: ["NexusEngine DomainServiceKit", "explicit exposure observations", "stable subject ids"],
  services: ["registration", "exposure", "treatment", "fixed-tick-lifecycle", "snapshots", "descriptors", "reset"],
  provides: ["biology:contagion-transmission", "contagion:exposure-chain", "contagion:infection-lifecycle"],
  events: ["contagion.exposureRecorded", "contagion.stageChanged", "contagion.transmitted", "contagion.recovered", "contagion.commandRejected", "contagion.reset"],
  rejectedEvent: "contagion.commandRejected",
  resetEvent: "contagion.reset"
};

function normalizeDefinition(input = {}, index = 0) {
  const id = stableId(input.id ?? `contagion-${index + 1}`, "Contagion");
  return {
    id,
    exposureThreshold: Math.max(0.0001, number(input.exposureThreshold, 1)),
    incubationTicks: Math.max(1, integer(input.incubationTicks, 2)),
    infectiousTicks: Math.max(1, integer(input.infectiousTicks, 4)),
    recoveryTicks: Math.max(1, integer(input.recoveryTicks, 3)),
    immunityTicks: integer(input.immunityTicks, 5),
    treatmentAcceleration: Math.max(0, number(input.treatmentAcceleration, 1)),
    metadata: clone(input.metadata ?? {})
  };
}

function subjectDescriptor(subject) {
  return {
    id: subject.id,
    kind: "contagion-subject-status",
    contagionId: subject.contagionId,
    stage: subject.stage,
    dose: subject.dose,
    treatedTicks: subject.treatedTicks,
    stageEnteredTick: subject.stageEnteredTick,
    immunityUntilTick: subject.immunityUntilTick
  };
}

function createInitial(config) {
  const definitions = Object.fromEntries(list(config.contagions ?? config.definitions).map((entry, index) => {
    const value = normalizeDefinition(entry, index);
    return [value.id, value];
  }));
  return { definitions, subjects: {}, transmissions: [], tick: integer(config.initialTick) };
}

export function createContagionTransmissionDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const registerContagion = (input) => {
      const value = normalizeDefinition(input);
      const existing = read().definitions[value.id];
      if (existing) return clone(existing);
      commit({
        result: { ok: true, action: "register-contagion", contagionId: value.id },
        transform: (state) => ({ ...state, definitions: { ...state.definitions, [value.id]: value } })
      });
      return clone(value);
    };

    const recordExposure = (fact = {}) => {
      const contagionId = stableId(fact.contagionId, "Exposure contagion");
      const subjectId = stableId(fact.subjectId, "Exposure subject");
      const definition = read().definitions[contagionId];
      if (!definition) return reject("unknown-contagion", { contagionId, subjectId, commandId: fact.commandId });
      const existing = read().subjects[subjectId];
      if (existing && existing.contagionId !== contagionId && existing.stage !== "susceptible") {
        return reject("subject-already-infected", { contagionId, subjectId, commandId: fact.commandId });
      }
      const dose = Math.max(0, number(fact.dose, 1));
      const subject = existing ?? {
        id: subjectId,
        contagionId,
        stage: "susceptible",
        dose: 0,
        treatedTicks: 0,
        stageEnteredTick: read().tick,
        immunityUntilTick: null,
        lastSourceId: null
      };
      if (subject.stage === "recovered" && subject.immunityUntilTick != null && read().tick < subject.immunityUntilTick) {
        return reject("subject-immune", { contagionId, subjectId, commandId: fact.commandId });
      }
      const nextDose = subject.dose + dose;
      const infected = subject.stage === "susceptible" || subject.stage === "recovered"
        ? nextDose >= definition.exposureThreshold
        : false;
      const next = {
        ...subject,
        contagionId,
        dose: nextDose,
        stage: infected ? "exposed" : subject.stage,
        stageEnteredTick: infected ? read().tick : subject.stageEnteredTick,
        immunityUntilTick: infected ? null : subject.immunityUntilTick,
        lastSourceId: fact.sourceId == null ? subject.lastSourceId : String(fact.sourceId)
      };
      const transmission = fact.sourceId == null ? null : {
        id: String(fact.commandId ?? `${contagionId}:${fact.sourceId}:${subjectId}:${read().tick}`),
        contagionId,
        sourceId: String(fact.sourceId),
        subjectId,
        dose,
        tick: read().tick
      };
      const result = commit({
        result: { ok: true, action: "record-exposure", contagionId, subjectId, dose, infected, stage: next.stage },
        commandId: fact.commandId,
        eventName: "contagion.exposureRecorded",
        transform: (state) => ({
          ...state,
          subjects: { ...state.subjects, [subjectId]: next },
          transmissions: transmission ? [...state.transmissions, transmission].slice(-512) : state.transmissions
        })
      });
      if (!result.duplicate && transmission) emit("contagion.transmitted", clone(transmission));
      if (!result.duplicate && infected) emit("contagion.stageChanged", { contagionId, subjectId, from: subject.stage, to: "exposed", tick: read().tick });
      return result;
    };

    const applyTreatment = (fact = {}) => {
      const subjectId = stableId(fact.subjectId, "Treatment subject");
      const subject = read().subjects[subjectId];
      if (!subject) return reject("unknown-subject", { subjectId, commandId: fact.commandId });
      const definition = read().definitions[subject.contagionId];
      const amount = Math.max(0, number(fact.amount ?? fact.ticks, definition.treatmentAcceleration));
      return commit({
        result: { ok: true, action: "apply-treatment", subjectId, amount },
        commandId: fact.commandId,
        transform: (state) => ({ ...state, subjects: { ...state.subjects, [subjectId]: { ...subject, treatedTicks: subject.treatedTicks + amount } } })
      });
    };

    const advance = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      const transitions = [];
      let nextState = clone(read());
      for (let step = 0; step < count; step += 1) {
        nextState.tick += 1;
        for (const subjectId of Object.keys(nextState.subjects).sort()) {
          const subject = nextState.subjects[subjectId];
          const definition = nextState.definitions[subject.contagionId];
          if (!definition) continue;
          const elapsed = nextState.tick - subject.stageEnteredTick + subject.treatedTicks;
          let stage = subject.stage;
          if (stage === "exposed" && elapsed >= definition.incubationTicks) stage = "infectious";
          else if (stage === "infectious" && elapsed >= definition.infectiousTicks) stage = "recovering";
          else if (stage === "recovering" && elapsed >= definition.recoveryTicks) stage = "recovered";
          else if (stage === "recovered" && subject.immunityUntilTick != null && nextState.tick >= subject.immunityUntilTick) stage = "susceptible";
          if (stage !== subject.stage) {
            const recovered = stage === "recovered";
            nextState.subjects[subjectId] = {
              ...subject,
              stage,
              dose: stage === "susceptible" ? 0 : subject.dose,
              treatedTicks: 0,
              stageEnteredTick: nextState.tick,
              immunityUntilTick: recovered ? nextState.tick + definition.immunityTicks : stage === "susceptible" ? null : subject.immunityUntilTick
            };
            transitions.push({ contagionId: subject.contagionId, subjectId, from: subject.stage, to: stage, tick: nextState.tick });
          }
        }
      }
      commit({
        result: { ok: true, action: "advance", ticks: count, transitionCount: transitions.length, tick: nextState.tick },
        transform: () => nextState
      });
      for (const transition of transitions) {
        emit("contagion.stageChanged", transition);
        if (transition.to === "recovered") emit("contagion.recovered", transition);
      }
      return clone(read());
    };

    return {
      registerContagion,
      recordExposure,
      applyTreatment,
      advance,
      getSubject: (subjectId) => clone(read().subjects[String(subjectId)] ?? null),
      getDescriptors: () => Object.values(read().subjects).sort((a, b) => a.id.localeCompare(b.id)).map(subjectDescriptor),
      getOutbreakSummary: () => {
        const counts = {};
        for (const subject of Object.values(read().subjects)) counts[subject.stage] = (counts[subject.stage] ?? 0) + 1;
        return { kind: "contagion-outbreak-summary", tick: read().tick, subjectCount: Object.keys(read().subjects).length, stages: counts, transmissionCount: read().transmissions.length };
      }
    };
  });
}

export default createContagionTransmissionDomainKit;
