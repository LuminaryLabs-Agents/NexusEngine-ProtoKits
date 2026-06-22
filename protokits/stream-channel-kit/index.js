import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const STREAM_CHANNEL_KIT_VERSION = "0.1.0";

export function normalizeStreamChannel(channel = {}) {
  const id = String(channel.id ?? channel.topic ?? "stream.channel");
  return { id, topic: channel.topic ?? id, status: channel.status ?? "idle", messages: number(channel.messages, 0), bytes: number(channel.bytes, 0), lastSequence: number(channel.lastSequence, -1), lagMs: number(channel.lagMs, 0), lastMessageAt: channel.lastMessageAt ?? null, metadata: clone(channel.metadata ?? {}) };
}

export function createStreamChannelState(options = {}) {
  const channels = Object.fromEntries((options.channels ?? []).map((ch) => { const c = normalizeStreamChannel(ch); return [c.id, c]; }));
  return { version: STREAM_CHANNEL_KIT_VERSION, channels, history: [] };
}

function stamp(world) { return number(world?.__nexusClock?.elapsed, 0); }

export function createStreamChannelKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "streamChannel.state");
  const Updated = event("streamChannel.updated");
  const initial = () => createStreamChannelState(options);
  return defineInjectedRuntimeKit(nexusRealtime, { id: options.id ?? "stream-channel-kit", resources: { State }, events: { Updated }, provides: ["stream:channels", "stream:channel-state"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const publish = (next, evt) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 96) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(evt) }); return clone(next); }; const api = { getState: state, registerChannel(channel = {}) { const next = state(); const c = normalizeStreamChannel(channel); next.channels[c.id] = c; return publish(next, { type: "register", id: c.id }); }, setStatus(id, status, payload = {}) { const next = state(); const c = next.channels[id] ?? normalizeStreamChannel({ id }); next.channels[id] = { ...c, status, metadata: { ...c.metadata, ...(payload.metadata ?? {}) } }; return publish(next, { type: "status", id, status }); }, recordMessage(id, meta = {}) { const next = state(); const c = next.channels[id] ?? normalizeStreamChannel({ id }); next.channels[id] = { ...c, status: meta.status ?? c.status, messages: c.messages + 1, bytes: c.bytes + number(meta.bytes, 0), lastSequence: number(meta.sequence, c.lastSequence), lagMs: number(meta.lagMs, c.lagMs), lastMessageAt: stamp(world) }; return publish(next, { type: "message", id, sequence: next.channels[id].lastSequence }); }, snapshot: () => clone(state()) }; engine.streamChannel = api; engine.n ??= {}; engine.n.streamChannel = api; }, metadata: { version: STREAM_CHANNEL_KIT_VERSION, purpose: "Logical stream channel status, counters, and lag descriptors." } });
}

export default createStreamChannelKit;
