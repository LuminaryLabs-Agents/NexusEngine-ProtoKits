import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const STREAM_SUBSCRIPTION_KIT_VERSION = "0.1.0";

export function createStreamSubscriptionState(options = {}) { return { version: STREAM_SUBSCRIPTION_KIT_VERSION, subscriptions: {}, interest: clone(options.interest ?? {}), history: [] }; }
function subId(topic, filter = {}) { return `${topic}:${JSON.stringify(filter)}`; }

export function createStreamSubscriptionKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "streamSubscription.state");
  const Updated = event("streamSubscription.updated");
  const initial = () => createStreamSubscriptionState(options);
  return defineInjectedRuntimeKit(nexusRealtime, { id: options.id ?? "stream-subscription-kit", resources: { State }, events: { Updated }, provides: ["stream:subscriptions", "stream:interest-descriptors"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const publish = (next, evt) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 96) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(evt) }); return clone(next); }; const api = { getState: state, subscribe(topic, filter = {}) { const next = state(); const id = subId(topic, filter); next.subscriptions[id] = { id, topic, filter: clone(filter), status: "active" }; return publish(next, { type: "subscribe", id }); }, unsubscribe(topic, filter = {}) { const next = state(); const id = subId(topic, filter); if (next.subscriptions[id]) next.subscriptions[id].status = "inactive"; return publish(next, { type: "unsubscribe", id }); }, updateInterest(interest = {}) { const next = { ...state(), interest: { ...state().interest, ...clone(interest) } }; return publish(next, { type: "interest" }); }, listActive() { return Object.values(state().subscriptions).filter((item) => item.status === "active").map(clone); }, snapshot: () => clone(state()) }; engine.streamSubscription = api; engine.n ??= {}; engine.n.streamSubscription = api; }, metadata: { version: STREAM_SUBSCRIPTION_KIT_VERSION, purpose: "Stream topic subscriptions and world/asset interest descriptors." } });
}

export default createStreamSubscriptionKit;
