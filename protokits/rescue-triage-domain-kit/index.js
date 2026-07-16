import {
  clamp,
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  stableId
} from "../production-domain-kit-support.js";

export const RESCUE_TRIAGE_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createRescueTriageDomainKit",
  kitId: "rescue-triage-domain-kit",
  domain: "rescue-triage",
  domainPath: "n:rescue:triage",
  parentDomainPath: "n:rescue",
  apiName: "rescueTriage",
  schema: "nexusengine.rescue-triage/1",
  resource: "rescueTriage.state",
  purpose: "Deterministic fictional casualty priority, stabilization, deterioration, treatment, transport readiness, and outcomes.",
  ownership: ["casualty records", "severity dimensions", "triage categories", "stabilization and deterioration windows", "treatment prerequisites", "transport readiness", "outcome ledger"],
  exclusions: ["combat damage", "medical diagnosis", "inventory consumption", "transport movement", "animation", "gore", "UI", "real-world clinical guidance"],
  dependencies: ["NexusEngine DomainServiceKit", "explicit fictional severity facts", "semantic treatment and transport commands"],
  services: ["casualties", "assessment", "treatment", "deterioration", "transport", "outcomes", "priority-queue", "snapshots", "descriptors", "reset"],
  provides: ["rescue:triage", "triage:priority", "triage:treatment-stages", "triage:transport-readiness"],
  events: ["triage.assessed", "triage.categoryChanged", "triage.treatmentStarted", "triage.stabilized", "triage.deteriorated", "triage.transportReady", "triage.outcomeResolved", "triage.commandRejected", "triage.reset"],
  rejectedEvent: "triage.commandRejected",
  resetEvent: "triage.reset"
};

const CATEGORY_PRIORITY = { red: 0, yellow: 1, green: 2, black: 3, unassessed: 4 };

function categoryFor(severity, outcome) {
  if (outcome === "lost") return "black";
  if (severity >= 0.75) return "red";
  if (severity >= 0.4) return "yellow";
  return "green";
}

function normalizeCasualty(input = {}, index = 0) {
  const id = stableId(input.id ?? `casualty-${index + 1}`, "Casualty");
  const severityDimensions = Object.fromEntries(Object.entries(input.severityDimensions ?? { primary: input.severity ?? 0.5 }).map(([key, value]) => [key, clamp(value)]));
  const severity = Object.values(severityDimensions).length ? Math.max(...Object.values(severityDimensions)) : clamp(input.severity ?? 0.5);
  return {
    id,
    severityDimensions,
    severity,
    assessed: Boolean(input.assessed),
    category: input.assessed ? categoryFor(severity) : "unassessed",
    deteriorationPerTick: Math.max(0, number(input.deteriorationPerTick, 0.02)),
    stabilizationThreshold: clamp(input.stabilizationThreshold ?? 0.35),
    treatments: Object.fromEntries(list(input.treatments).map((treatment, treatmentIndex) => {
      const treatmentId = stableId(treatment.id ?? `treatment-${treatmentIndex + 1}`, "Treatment");
      return [treatmentId, { id: treatmentId, effect: clamp(treatment.effect ?? 0.25), prerequisites: list(treatment.prerequisites).map(String), durationTicks: Math.max(1, integer(treatment.durationTicks, 1)), status: "available", startedTick: null, completedTick: null }];
    })),
    completedTreatmentIds: [],
    stabilized: Boolean(input.stabilized),
    transportReady: Boolean(input.transportReady),
    transported: Boolean(input.transported),
    outcome: input.outcome ?? null,
    metadata: clone(input.metadata ?? {})
  };
}

function createInitial(config) {
  const casualties = Object.fromEntries(list(config.casualties).map((entry, index) => {
    const value = normalizeCasualty(entry, index);
    return [value.id, value];
  }));
  return { casualties, treatments: [], outcomes: [], tick: integer(config.initialTick) };
}

export function createRescueTriageDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const casualtyFor = (casualtyId) => read().casualties[String(casualtyId)] ?? null;
    const registerCasualty = (input) => {
      const value = normalizeCasualty(input);
      if (casualtyFor(value.id)) return clone(casualtyFor(value.id));
      commit({ result: { ok: true, action: "register-casualty", casualtyId: value.id }, transform: (state) => ({ ...state, casualties: { ...state.casualties, [value.id]: value } }) });
      return clone(value);
    };
    const assess = (command = {}) => {
      const casualtyId = stableId(command.casualtyId, "Assessed casualty");
      const casualty = casualtyFor(casualtyId);
      if (!casualty) return reject("unknown-casualty", { casualtyId, commandId: command.commandId });
      const dimensions = command.severityDimensions ? Object.fromEntries(Object.entries(command.severityDimensions).map(([key, value]) => [key, clamp(value)])) : casualty.severityDimensions;
      const severity = Object.values(dimensions).length ? Math.max(...Object.values(dimensions)) : casualty.severity;
      const category = categoryFor(severity, casualty.outcome);
      const result = commit({ result: { ok: true, action: "assess", casualtyId, severity, category }, eventName: "triage.assessed", commandId: command.commandId, transform: (state) => ({ ...state, casualties: { ...state.casualties, [casualtyId]: { ...casualty, severityDimensions: dimensions, severity, assessed: true, category } } }) });
      if (!result.duplicate && casualty.category !== category) emit("triage.categoryChanged", { casualtyId, from: casualty.category, to: category, severity, tick: read().tick });
      return result;
    };
    const beginTreatment = (command = {}) => {
      const casualtyId = stableId(command.casualtyId, "Treatment casualty");
      const treatmentId = stableId(command.treatmentId, "Treatment");
      const casualty = casualtyFor(casualtyId);
      const treatment = casualty?.treatments?.[treatmentId];
      if (!casualty) return reject("unknown-casualty", { casualtyId, treatmentId, commandId: command.commandId });
      if (!treatment) return reject("unknown-treatment", { casualtyId, treatmentId, commandId: command.commandId });
      const missing = treatment.prerequisites.find((id) => !casualty.completedTreatmentIds.includes(id));
      if (missing) return reject("treatment-prerequisite-missing", { casualtyId, treatmentId, prerequisiteId: missing, commandId: command.commandId });
      if (treatment.status === "completed") return reject("treatment-already-completed", { casualtyId, treatmentId, commandId: command.commandId });
      return commit({ result: { ok: true, action: "begin-treatment", casualtyId, treatmentId }, eventName: "triage.treatmentStarted", commandId: command.commandId, transform: (state) => ({ ...state, casualties: { ...state.casualties, [casualtyId]: { ...casualty, treatments: { ...casualty.treatments, [treatmentId]: { ...treatment, status: "active", startedTick: state.tick } } } }, treatments: [...state.treatments, { casualtyId, treatmentId, action: "started", tick: state.tick }].slice(-256) }) });
    };
    const completeTreatment = (command = {}) => {
      const casualtyId = stableId(command.casualtyId, "Treatment casualty");
      const treatmentId = stableId(command.treatmentId, "Treatment");
      const casualty = casualtyFor(casualtyId);
      const treatment = casualty?.treatments?.[treatmentId];
      if (!casualty || !treatment) return reject(!casualty ? "unknown-casualty" : "unknown-treatment", { casualtyId, treatmentId, commandId: command.commandId });
      if (treatment.status !== "active") return reject("treatment-not-active", { casualtyId, treatmentId, commandId: command.commandId });
      if (read().tick - treatment.startedTick < treatment.durationTicks) return reject("treatment-duration-incomplete", { casualtyId, treatmentId, commandId: command.commandId });
      const severity = clamp(casualty.severity - treatment.effect);
      const stabilized = severity <= casualty.stabilizationThreshold;
      const transportReady = stabilized;
      const category = categoryFor(severity, casualty.outcome);
      const next = { ...casualty, severity, severityDimensions: { ...casualty.severityDimensions, primary: severity }, category, stabilized, transportReady, completedTreatmentIds: [...new Set([...casualty.completedTreatmentIds, treatmentId])], treatments: { ...casualty.treatments, [treatmentId]: { ...treatment, status: "completed", completedTick: read().tick } } };
      const result = commit({ result: { ok: true, action: "complete-treatment", casualtyId, treatmentId, severity, stabilized, transportReady }, commandId: command.commandId, transform: (state) => ({ ...state, casualties: { ...state.casualties, [casualtyId]: next }, treatments: [...state.treatments, { casualtyId, treatmentId, action: "completed", tick: state.tick }].slice(-256) }) });
      if (!result.duplicate && casualty.category !== category) emit("triage.categoryChanged", { casualtyId, from: casualty.category, to: category, severity, tick: read().tick });
      if (!result.duplicate && stabilized && !casualty.stabilized) emit("triage.stabilized", { casualtyId, severity, tick: read().tick });
      if (!result.duplicate && transportReady && !casualty.transportReady) emit("triage.transportReady", { casualtyId, tick: read().tick });
      return result;
    };
    const markTransported = (command = {}) => {
      const casualtyId = stableId(command.casualtyId, "Transport casualty");
      const casualty = casualtyFor(casualtyId);
      if (!casualty) return reject("unknown-casualty", { casualtyId, commandId: command.commandId });
      if (!casualty.transportReady) return reject("casualty-not-transport-ready", { casualtyId, commandId: command.commandId });
      return commit({ result: { ok: true, action: "mark-transported", casualtyId }, commandId: command.commandId, transform: (state) => ({ ...state, casualties: { ...state.casualties, [casualtyId]: { ...casualty, transported: true } } }) });
    };
    const resolveOutcome = (command = {}) => {
      const casualtyId = stableId(command.casualtyId, "Outcome casualty");
      const casualty = casualtyFor(casualtyId);
      if (!casualty) return reject("unknown-casualty", { casualtyId, commandId: command.commandId });
      if (casualty.outcome) return reject("outcome-already-resolved", { casualtyId, outcome: casualty.outcome, commandId: command.commandId });
      const outcome = String(command.outcome ?? (casualty.transported ? "evacuated" : casualty.stabilized ? "stabilized" : "lost"));
      return commit({ result: { ok: true, action: "resolve-outcome", casualtyId, outcome }, eventName: "triage.outcomeResolved", commandId: command.commandId, transform: (state) => ({ ...state, casualties: { ...state.casualties, [casualtyId]: { ...casualty, outcome, category: categoryFor(casualty.severity, outcome) } }, outcomes: [...state.outcomes, { casualtyId, outcome, tick: state.tick }].slice(-256) }) });
    };
    const advance = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      const deteriorationEvents = [];
      let state = clone(read());
      for (let step = 0; step < count; step += 1) {
        state.tick += 1;
        for (const casualtyId of Object.keys(state.casualties).sort()) {
          const casualty = state.casualties[casualtyId];
          if (casualty.outcome || casualty.stabilized) continue;
          const before = casualty.severity;
          const severity = clamp(before + casualty.deteriorationPerTick);
          const category = casualty.assessed ? categoryFor(severity) : casualty.category;
          state.casualties[casualtyId] = { ...casualty, severity, severityDimensions: { ...casualty.severityDimensions, primary: severity }, category };
          if (severity !== before) deteriorationEvents.push({ casualtyId, before, severity, category, tick: state.tick, previousCategory: casualty.category });
        }
      }
      commit({ result: { ok: true, action: "advance", ticks: count, tick: state.tick, deteriorationCount: deteriorationEvents.length }, transform: () => state });
      for (const event of deteriorationEvents) {
        emit("triage.deteriorated", event);
        if (event.previousCategory !== event.category) emit("triage.categoryChanged", { casualtyId: event.casualtyId, from: event.previousCategory, to: event.category, severity: event.severity, tick: event.tick });
      }
      return clone(read());
    };
    const getPriorityQueue = () => Object.values(read().casualties).filter((entry) => !entry.outcome).sort((a, b) => (CATEGORY_PRIORITY[a.category] ?? 99) - (CATEGORY_PRIORITY[b.category] ?? 99) || b.severity - a.severity || a.id.localeCompare(b.id)).map((entry) => ({ id: entry.id, category: entry.category, severity: entry.severity, stabilized: entry.stabilized, transportReady: entry.transportReady }));
    return {
      registerCasualty,
      assess,
      beginTreatment,
      completeTreatment,
      markTransported,
      advance,
      resolveOutcome,
      getPriorityQueue,
      getDescriptors: () => getPriorityQueue().map((entry) => ({ ...entry, kind: "triage-priority" }))
    };
  });
}

export default createRescueTriageDomainKit;
