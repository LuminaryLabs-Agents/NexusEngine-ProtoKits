import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const STREAM_SESSION_KIT_VERSION = "0.1.0";

export function createStreamSessionState(options = {}) {
  return { version: STREAM_SESSION_KIT_VERSION, sessionId: options.sessionId ?? null, status: "closed", schemaVersion: options.schemaVersion ?? 1, connectedAt: null, disconnectedAt: null, lastHeartbeatAt: null, latencyMs: 0, reconnects: 0, descriptor: clone(options.descriptor ?? {}), history: [] };
}

function stamp(world) { return number(world?.__nexusClock?.elapsed, 0); }

export function createStreamSessionKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "streamSession.state");
  const Updated = event("streamSession.updated");
  const initial = () => createStreamSessionState(options);
  return defineInjectedRuntimeKit(nexusRealtime, { id: options.id ?? "stream-session-kit", resources: { State }, events: { Updated }, provides: ["stream:session", "stream:connection-state", "stream:heartbeat"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const publish = (next, evt) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 64) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(evt) }); return clone(next); }; const api = { getState: state, open(descriptor = {}) { return publish({ ...state(), status: "opening", sessionId: descriptor.sessionId ?? state().sessionId ?? `stream-${Math.round(stamp(world) * 1000)}`, descriptor: clone(descriptor) }, { type: "open" }); }, markConnected(payload = {}) { return publish({ ...state(), status: "connected", connectedAt: stamp(world), descriptor: { ...state().descriptor, ...payload } }, { type: "connected" }); }, markDisconnected(reason = "disconnected") { return publish({ ...state(), status: "disconnected", disconnectedAt: stamp(world), reconnects: state().reconnects + 1 }, { type: "disconnected", reason }); }, heartbeat(payload = {}) { return publish({ ...state(), lastHeartbeatAt: stamp(world), latencyMs: number(payload.latencyMs, state().latencyMs) }, { type: "heartbeat" }); }, snapshot: () => clone(state()) }; engine.streamSession = api; engine.n ??= {}; engine.n.streamSession = api; }, metadata: { version: STREAM_SESSION_KIT_VERSION, purpose: "Renderer-agnostic stream session state and heartbeat descriptors." } });
}

export default createStreamSessionKit;
