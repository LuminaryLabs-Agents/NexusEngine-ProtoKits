import {
  clamp,
  clone,
  createProductionDomainKit,
  integer,
  list,
  seededUnit,
  stableId
} from "../production-domain-kit-support.js";

export const RUMOR_PROPAGATION_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createRumorPropagationDomainKit",
  kitId: "rumor-propagation-domain-kit",
  domain: "rumor-propagation",
  domainPath: "n:knowledge:rumor-propagation",
  parentDomainPath: "n:knowledge",
  apiName: "rumorPropagation",
  schema: "nexusengine.rumor-propagation/1",
  resource: "rumorPropagation.state",
  purpose: "Track authored claims through witness lineage, credibility, configured distortion, exposure, correction, and retirement.",
  ownership: ["claim definitions", "source lineage", "recipient exposure", "credibility", "seeded distortion policy", "correction and retirement state"],
  exclusions: ["dialogue generation", "model inference", "agent choice", "relationship state", "truth adjudication", "network messaging", "UI"],
  dependencies: ["NexusEngine DomainServiceKit", "stable subject ids", "authored claims", "explicit named seed"],
  services: ["claims", "sharing", "distortion", "correction", "credibility", "retirement", "snapshots", "descriptors", "reset"],
  provides: ["knowledge:rumor-propagation", "rumor:lineage", "rumor:exposure"],
  events: ["rumor.registered", "rumor.shared", "rumor.distorted", "rumor.corrected", "rumor.retired", "rumor.commandRejected", "rumor.reset"],
  rejectedEvent: "rumor.commandRejected",
  resetEvent: "rumor.reset"
};

function normalizeClaim(input = {}, index = 0) {
  const id = stableId(input.id ?? `claim-${index + 1}`, "Claim");
  return {
    id,
    payload: clone(input.payload ?? { key: input.key ?? id }),
    credibility: clamp(input.credibility ?? 0.5),
    distortionVariants: list(input.distortionVariants).map(clone),
    allowDistortion: input.allowDistortion !== false,
    corrected: false,
    retired: false,
    metadata: clone(input.metadata ?? {})
  };
}

function createInitial(config) {
  const claims = Object.fromEntries(list(config.claims).map((entry, index) => {
    const value = normalizeClaim(entry, index);
    return [value.id, value];
  }));
  return { seed: String(config.seed ?? "rumor-propagation"), claims, exposures: {}, lineage: [], credibility: {}, tick: integer(config.initialTick) };
}

export function createRumorPropagationDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const registerClaim = (input) => {
      const value = normalizeClaim(input);
      if (read().claims[value.id]) return clone(read().claims[value.id]);
      commit({ result: { ok: true, action: "register-claim", claimId: value.id }, eventName: "rumor.registered", transform: (state) => ({ ...state, claims: { ...state.claims, [value.id]: value } }) });
      return clone(value);
    };
    const share = (command = {}) => {
      const claimId = stableId(command.claimId, "Shared claim");
      const sourceId = stableId(command.sourceId, "Rumor source");
      const recipientId = stableId(command.recipientId, "Rumor recipient");
      const claim = read().claims[claimId];
      if (!claim) return reject("unknown-claim", { claimId, sourceId, recipientId, commandId: command.commandId });
      if (claim.retired) return reject("claim-retired", { claimId, sourceId, recipientId, commandId: command.commandId });
      const roll = seededUnit(`${read().seed}:${command.commandId ?? `${claimId}:${sourceId}:${recipientId}:${read().tick}`}`);
      const distorted = claim.allowDistortion && claim.distortionVariants.length > 0 && roll < clamp(command.distortionChance ?? 0);
      const payload = distorted ? clone(claim.distortionVariants[Math.floor(roll * claim.distortionVariants.length) % claim.distortionVariants.length]) : clone(claim.payload);
      const exposureId = `${recipientId}:${claimId}`;
      const lineage = { id: String(command.commandId ?? `${claimId}:${sourceId}:${recipientId}:${read().tick}`), claimId, sourceId, recipientId, distorted, payload, tick: read().tick };
      const result = commit({
        result: { ok: true, action: "share", claimId, sourceId, recipientId, distorted },
        eventName: "rumor.shared",
        commandId: command.commandId,
        transform: (state) => ({ ...state, exposures: { ...state.exposures, [exposureId]: { id: exposureId, claimId, subjectId: recipientId, payload, sourceId, distorted, corrected: false, credibility: state.credibility[`${recipientId}:${claimId}`] ?? claim.credibility, tick: state.tick } }, lineage: [...state.lineage, lineage].slice(-512) })
      });
      if (!result.duplicate && distorted) emit("rumor.distorted", lineage);
      return result;
    };
    const correct = (command = {}) => {
      const claimId = stableId(command.claimId, "Corrected claim");
      const subjectId = stableId(command.subjectId, "Correction subject");
      const exposureId = `${subjectId}:${claimId}`;
      const exposure = read().exposures[exposureId];
      if (!exposure) return reject("unknown-exposure", { claimId, subjectId, commandId: command.commandId });
      return commit({ result: { ok: true, action: "correct", claimId, subjectId }, eventName: "rumor.corrected", commandId: command.commandId, transform: (state) => ({ ...state, exposures: { ...state.exposures, [exposureId]: { ...exposure, corrected: true, payload: clone(state.claims[claimId]?.payload ?? exposure.payload) } } }) });
    };
    const adjustCredibility = (fact = {}) => {
      const claimId = stableId(fact.claimId, "Credibility claim");
      const subjectId = stableId(fact.subjectId, "Credibility subject");
      if (!read().claims[claimId]) return reject("unknown-claim", { claimId, subjectId, commandId: fact.commandId });
      const key = `${subjectId}:${claimId}`;
      const value = clamp(fact.value ?? (read().credibility[key] ?? read().claims[claimId].credibility));
      return commit({ result: { ok: true, action: "adjust-credibility", claimId, subjectId, value }, commandId: fact.commandId, transform: (state) => ({ ...state, credibility: { ...state.credibility, [key]: value }, exposures: state.exposures[key] ? { ...state.exposures, [key]: { ...state.exposures[key], credibility: value } } : state.exposures }) });
    };
    const retire = (claimIdOrCommand, payload = {}) => {
      const command = typeof claimIdOrCommand === "object" ? claimIdOrCommand : { ...payload, claimId: claimIdOrCommand };
      const claimId = stableId(command.claimId, "Retired claim");
      const claim = read().claims[claimId];
      if (!claim) return reject("unknown-claim", { claimId, commandId: command.commandId });
      if (claim.retired) return clone(claim);
      const result = commit({ result: { ok: true, action: "retire", claimId }, eventName: "rumor.retired", commandId: command.commandId, transform: (state) => ({ ...state, claims: { ...state.claims, [claimId]: { ...claim, retired: true } } }) });
      return result.duplicate ? result : clone(read().claims[claimId]);
    };
    return {
      registerClaim,
      share,
      correct,
      adjustCredibility,
      retire,
      getExposure: (subjectId) => Object.values(read().exposures).filter((entry) => entry.subjectId === String(subjectId)).sort((a, b) => a.claimId.localeCompare(b.claimId)).map(clone),
      getDescriptors: () => Object.values(read().exposures).sort((a, b) => a.id.localeCompare(b.id)).map((entry) => ({ id: entry.id, kind: "rumor-exposure", claimId: entry.claimId, subjectId: entry.subjectId, sourceId: entry.sourceId, credibility: entry.credibility, distorted: entry.distorted, corrected: entry.corrected }))
    };
  });
}

export default createRumorPropagationDomainKit;
