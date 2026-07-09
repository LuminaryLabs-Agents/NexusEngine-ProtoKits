import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const STREAM_BACKPRESSURE_KIT_VERSION = "0.1.0";

export function createStreamBackpressureState(options = {}) { return { version: STREAM_BACKPRESSURE_KIT_VERSION, limits: { messages: number(options.messages, 512), bytes: number(options.bytes, 8 * 1024 * 1024), decodeCost: number(options.decodeCost, 1000) }, queue: [], deferred: [], dropped: [], metrics: { messages: 0, bytes: 0, decodeCost: 0 } }; }
function costOf(message = {}) { return { messages: 1, bytes: number(message.bytes, JSON.stringify(message).length), decodeCost: number(message.decodeCost, 1) }; }

export function createStreamBackpressureKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "streamBackpressure.state");
  const Updated = event("streamBackpressure.updated");
  const initial = () => createStreamBackpressureState(options);
  return defineInjectedRuntimeKit(nexusEngine, { id: options.id ?? "stream-backpressure-kit", resources: { State }, events: { Updated }, provides: ["stream:backpressure", "stream:budget-policy"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const publish = (next) => { world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next); }; const api = { getState: state, measure() { return clone(state().metrics); }, allow(topic, cost = {}) { const c = { messages: number(cost.messages, 1), bytes: number(cost.bytes, 0), decodeCost: number(cost.decodeCost, 0) }; const m = state().metrics; const l = state().limits; return m.messages + c.messages <= l.messages && m.bytes + c.bytes <= l.bytes && m.decodeCost + c.decodeCost <= l.decodeCost; }, defer(message = {}) { const next = state(); next.deferred.push(clone(message)); return publish(next); }, enqueue(message = {}) { const next = state(); const c = costOf(message); if (this.allow(message.topic, c)) { next.queue.push(clone(message)); next.metrics.messages += c.messages; next.metrics.bytes += c.bytes; next.metrics.decodeCost += c.decodeCost; } else next.deferred.push(clone(message)); return publish(next); }, drain(count = 32) { const next = state(); const out = next.queue.splice(0, count); next.metrics = { messages: next.queue.length, bytes: next.queue.reduce((s, m) => s + number(m.bytes, 0), 0), decodeCost: next.queue.reduce((s, m) => s + number(m.decodeCost, 1), 0) }; publish(next); return asList(out).map(clone); }, snapshot: () => clone(state()) }; engine.streamBackpressure = api; engine.n ??= {}; engine.n.streamBackpressure = api; }, metadata: { version: STREAM_BACKPRESSURE_KIT_VERSION, purpose: "Stream queue backpressure, budget policy, defer, and drain descriptors." } });
}

export default createStreamBackpressureKit;
