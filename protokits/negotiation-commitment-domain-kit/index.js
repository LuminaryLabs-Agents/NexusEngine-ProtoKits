import {
  clone,
  createProductionDomainKit,
  integer,
  list,
  stableId
} from "../production-domain-kit-support.js";

export const NEGOTIATION_COMMITMENT_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createNegotiationCommitmentDomainKit",
  kitId: "negotiation-commitment-domain-kit",
  domain: "negotiation-commitment",
  domainPath: "n:social:negotiation-commitment",
  parentDomainPath: "n:social",
  apiName: "negotiationCommitment",
  schema: "nexusengine.negotiation-commitment/1",
  resource: "negotiationCommitment.state",
  purpose: "Deterministic offers, accepted terms, obligations, deadlines, fulfillment, breach, release, and settlement.",
  ownership: ["negotiation sessions", "offers and counteroffers", "term acceptance", "party obligations", "fulfillment and breach facts", "release and settlement history"],
  exclusions: ["dialogue generation", "agent decisions", "currency transfer", "inventory transfer", "legal enforcement", "relationship scores", "UI", "network messaging"],
  dependencies: ["NexusEngine DomainServiceKit", "stable party ids", "authored allowed term types", "explicit fulfillment facts"],
  services: ["sessions", "offers", "counteroffers", "acceptance", "obligations", "deadlines", "fulfillment", "breach", "release", "settlement", "snapshots", "descriptors", "reset"],
  provides: ["social:negotiation-commitment", "negotiation:offers", "commitment:obligations"],
  events: ["negotiation.opened", "negotiation.offerProposed", "negotiation.offerWithdrawn", "negotiation.termsAccepted", "commitment.fulfilled", "commitment.breached", "commitment.released", "negotiation.settled", "negotiation.commandRejected", "negotiation.reset"],
  rejectedEvent: "negotiation.commandRejected",
  resetEvent: "negotiation.reset"
};

function normalizeSession(input = {}, index = 0) {
  return {
    id: stableId(input.id ?? `negotiation-${index + 1}`, "Negotiation session"),
    partyIds: [...new Set(list(input.partyIds ?? input.parties).map((party) => String(party.id ?? party)))].sort(),
    allowedTermTypes: [...new Set(list(input.allowedTermTypes).map(String))].sort(),
    status: "open",
    activeOfferId: null,
    offerIds: [],
    obligationIds: [],
    metadata: clone(input.metadata ?? {})
  };
}

function normalizeOffer(input = {}, session, index = 0) {
  const id = stableId(input.id ?? `offer-${index + 1}`, "Offer");
  const proposerId = stableId(input.proposerId, "Offer proposer");
  const recipientIds = [...new Set(list(input.recipientIds).map(String))].sort();
  const terms = list(input.terms).map((term, termIndex) => ({
    id: stableId(term.id ?? `${id}:term-${termIndex + 1}`, "Offer term"),
    type: stableId(term.type, "Offer term type"),
    debtorId: stableId(term.debtorId ?? proposerId, "Term debtor"),
    creditorId: stableId(term.creditorId ?? recipientIds[0], "Term creditor"),
    payload: clone(term.payload ?? {}),
    deadlineTick: term.deadlineTick == null ? null : integer(term.deadlineTick)
  }));
  return { id, sessionId: session.id, proposerId, recipientIds, terms, status: "proposed", parentOfferId: input.parentOfferId == null ? null : String(input.parentOfferId), metadata: clone(input.metadata ?? {}) };
}

function createInitial(config) {
  const sessions = Object.fromEntries(list(config.sessions).map((entry, index) => {
    const value = normalizeSession(entry, index);
    return [value.id, value];
  }));
  return { sessions, offers: {}, obligations: {}, tick: integer(config.initialTick), settlements: [] };
}

export function createNegotiationCommitmentDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const openSession = (input) => {
      const value = normalizeSession(input);
      if (read().sessions[value.id]) return clone(read().sessions[value.id]);
      commit({ result: { ok: true, action: "open-session", sessionId: value.id }, eventName: "negotiation.opened", transform: (state) => ({ ...state, sessions: { ...state.sessions, [value.id]: value } }) });
      return clone(value);
    };
    const propose = (command = {}) => {
      const sessionId = stableId(command.sessionId, "Offer session");
      const session = read().sessions[sessionId];
      if (!session) return reject("unknown-session", { sessionId, commandId: command.commandId });
      if (session.status !== "open") return reject("session-not-open", { sessionId, status: session.status, commandId: command.commandId });
      const offer = normalizeOffer(command, session, session.offerIds.length);
      if (!session.partyIds.includes(offer.proposerId) || offer.recipientIds.some((partyId) => !session.partyIds.includes(partyId))) return reject("offer-party-not-in-session", { sessionId, offerId: offer.id, commandId: command.commandId });
      const disallowed = offer.terms.find((term) => session.allowedTermTypes.length > 0 && !session.allowedTermTypes.includes(term.type));
      if (disallowed) return reject("term-type-not-allowed", { sessionId, offerId: offer.id, termType: disallowed.type, commandId: command.commandId });
      return commit({ result: { ok: true, action: "propose", sessionId, offerId: offer.id }, eventName: "negotiation.offerProposed", commandId: command.commandId, transform: (state) => ({ ...state, offers: { ...state.offers, [offer.id]: offer }, sessions: { ...state.sessions, [sessionId]: { ...session, activeOfferId: offer.id, offerIds: [...session.offerIds, offer.id] } } }) });
    };
    const counter = (command = {}) => {
      const parentOfferId = stableId(command.parentOfferId, "Countered offer");
      const parent = read().offers[parentOfferId];
      if (!parent) return reject("unknown-offer", { offerId: parentOfferId, commandId: command.commandId });
      const result = propose({ ...command, sessionId: parent.sessionId, parentOfferId });
      if (result.ok && !result.duplicate) commit({ result: { ok: true, action: "mark-offer-countered", offerId: parentOfferId }, transform: (state) => ({ ...state, offers: { ...state.offers, [parentOfferId]: { ...state.offers[parentOfferId], status: "countered" } } }) });
      return result;
    };
    const withdraw = (command = {}) => {
      const offerId = stableId(command.offerId, "Withdrawn offer");
      const offer = read().offers[offerId];
      if (!offer) return reject("unknown-offer", { offerId, commandId: command.commandId });
      if (["accepted", "withdrawn"].includes(offer.status)) return reject("offer-terminal", { offerId, status: offer.status, commandId: command.commandId });
      return commit({ result: { ok: true, action: "withdraw", offerId, sessionId: offer.sessionId }, eventName: "negotiation.offerWithdrawn", commandId: command.commandId, transform: (state) => ({ ...state, offers: { ...state.offers, [offerId]: { ...offer, status: "withdrawn" } }, sessions: { ...state.sessions, [offer.sessionId]: { ...state.sessions[offer.sessionId], activeOfferId: state.sessions[offer.sessionId].activeOfferId === offerId ? null : state.sessions[offer.sessionId].activeOfferId } } }) });
    };
    const accept = (command = {}) => {
      const offerId = stableId(command.offerId, "Accepted offer");
      const offer = read().offers[offerId];
      if (!offer) return reject("unknown-offer", { offerId, commandId: command.commandId });
      if (offer.status !== "proposed") return reject("offer-not-active", { offerId, status: offer.status, commandId: command.commandId });
      const session = read().sessions[offer.sessionId];
      const acceptingPartyId = stableId(command.partyId, "Accepting party");
      if (!session.partyIds.includes(acceptingPartyId)) return reject("party-not-in-session", { offerId, acceptingPartyId, commandId: command.commandId });
      const obligations = Object.fromEntries(offer.terms.map((term) => [term.id, { id: term.id, sessionId: session.id, offerId, type: term.type, debtorId: term.debtorId, creditorId: term.creditorId, payload: clone(term.payload), deadlineTick: term.deadlineTick, status: "active", resolutionTick: null }]));
      return commit({ result: { ok: true, action: "accept", offerId, sessionId: session.id, acceptingPartyId, obligationIds: Object.keys(obligations) }, eventName: "negotiation.termsAccepted", commandId: command.commandId, transform: (state) => ({ ...state, offers: { ...state.offers, [offerId]: { ...offer, status: "accepted", acceptedBy: acceptingPartyId } }, obligations: { ...state.obligations, ...obligations }, sessions: { ...state.sessions, [session.id]: { ...session, status: "committed", activeOfferId: offerId, obligationIds: Object.keys(obligations) } } }) });
    };
    const resolveObligation = (fact, status, eventName) => {
      const obligationId = stableId(fact.obligationId, "Obligation");
      const obligation = read().obligations[obligationId];
      if (!obligation) return reject("unknown-obligation", { obligationId, commandId: fact.commandId });
      if (obligation.status !== "active") return reject("obligation-terminal", { obligationId, status: obligation.status, commandId: fact.commandId });
      return commit({ result: { ok: true, action: status, obligationId, sessionId: obligation.sessionId }, eventName, commandId: fact.commandId, transform: (state) => ({ ...state, obligations: { ...state.obligations, [obligationId]: { ...obligation, status, resolutionTick: state.tick, evidence: clone(fact.evidence ?? null) } } }) });
    };
    const release = (command = {}) => resolveObligation(command, "released", "commitment.released");
    const advance = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      const breached = [];
      let state = clone(read());
      state.tick += count;
      for (const obligationId of Object.keys(state.obligations).sort()) {
        const obligation = state.obligations[obligationId];
        if (obligation.status === "active" && obligation.deadlineTick != null && state.tick > obligation.deadlineTick) {
          state.obligations[obligationId] = { ...obligation, status: "breached", resolutionTick: state.tick, evidence: { reason: "deadline-expired" } };
          breached.push({ obligationId, sessionId: obligation.sessionId, tick: state.tick, reason: "deadline-expired" });
        }
      }
      commit({ result: { ok: true, action: "advance", ticks: count, tick: state.tick, breachCount: breached.length }, transform: () => state });
      for (const event of breached) emit("commitment.breached", event);
      return clone(read());
    };
    const settle = (command = {}) => {
      const sessionId = stableId(command.sessionId, "Settlement session");
      const session = read().sessions[sessionId];
      if (!session) return reject("unknown-session", { sessionId, commandId: command.commandId });
      const obligations = session.obligationIds.map((id) => read().obligations[id]).filter(Boolean);
      if (obligations.some((entry) => entry.status === "active")) return reject("active-obligations-remain", { sessionId, commandId: command.commandId });
      const outcome = obligations.some((entry) => entry.status === "breached") ? "settled-with-breach" : "settled";
      return commit({ result: { ok: true, action: "settle", sessionId, outcome }, eventName: "negotiation.settled", commandId: command.commandId, transform: (state) => ({ ...state, sessions: { ...state.sessions, [sessionId]: { ...session, status: outcome } }, settlements: [...state.settlements, { sessionId, outcome, tick: state.tick }].slice(-256) }) });
    };
    return {
      openSession,
      propose,
      counter,
      withdraw,
      accept,
      recordFulfillment: (fact) => resolveObligation(fact, "fulfilled", "commitment.fulfilled"),
      recordBreach: (fact) => resolveObligation(fact, "breached", "commitment.breached"),
      release,
      advance,
      settle,
      getDescriptors: () => Object.values(read().obligations).sort((a, b) => a.id.localeCompare(b.id)).map((value) => ({ id: value.id, kind: "negotiated-obligation", sessionId: value.sessionId, type: value.type, debtorId: value.debtorId, creditorId: value.creditorId, status: value.status, deadlineTick: value.deadlineTick }))
    };
  });
}

export default createNegotiationCommitmentDomainKit;
