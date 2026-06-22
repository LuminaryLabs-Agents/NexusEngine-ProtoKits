import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const STREAM_DELTA_APPLY_KIT_VERSION = "0.1.0";

export function createStreamDeltaApplyState() { return { version: STREAM_DELTA_APPLY_KIT_VERSION, channels: {}, applied: {}, buffered: {}, duplicates: 0, outOfOrder: 0, history: [] }; }
function key(channelId, seq) { return `${channelId}:${seq}`; }

export function createStreamDeltaApplyKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "streamDeltaApply.state");
  const Updated = event("streamDeltaApply.updated");
  const Applied = event("streamDeltaApply.applied");
  const initial = () => createStreamDeltaApplyState(options);
  return defineInjectedRuntimeKit(nexusRealtime, { id: options.id ?? "stream-delta-apply-kit", resources: { State }, events: { Updated, Applied }, provides: ["stream:delta-apply", "stream:sequence-state"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const publish = (next, evt) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 128) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(evt) }); return clone(next); }; const applyOne = (channelId, delta = {}) => { const next = state(); const seq = number(delta.seq ?? delta.sequence, (next.channels[channelId]?.lastSequence ?? -1) + 1); const k = key(channelId, seq); if (next.applied[k]) { next.duplicates += 1; return publish(next, { type: "duplicate", channelId, seq }); } const last = next.channels[channelId]?.lastSequence ?? -1; if (seq > last + 1) { next.outOfOrder += 1; next.buffered[channelId] ??= {}; next.buffered[channelId][seq] = clone(delta); return publish(next, { type: "buffered", channelId, seq }); } next.channels[channelId] = { id: channelId, lastSequence: seq }; next.applied[k] = true; world.emit?.(Applied, { channelId, delta: clone(delta), seq }); return publish(next, { type: "applied", channelId, seq }); }; const api = { getState: state, apply(channelId, delta = {}) { return applyOne(channelId, delta); }, applyBatch(channelId, deltas = []) { return asList(deltas).map((delta) => applyOne(channelId, delta)); }, getLastSequence(channelId) { return state().channels[channelId]?.lastSequence ?? -1; }, snapshot: () => clone(state()) }; engine.streamDeltaApply = api; engine.n ??= {}; engine.n.streamDeltaApply = api; }, metadata: { version: STREAM_DELTA_APPLY_KIT_VERSION, purpose: "Ordered, idempotent stream delta application state." } });
}

export default createStreamDeltaApplyKit;
