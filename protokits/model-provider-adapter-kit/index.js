import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const MODEL_PROVIDER_ADAPTER_KIT_VERSION = "0.1.0";

const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const tickOf = (world) => Number(world?.__nexusClock?.frame ?? 0);

function createInitialState(options = {}) {
  const providers = Object.fromEntries(asList(options.providers).map((provider, index) => normalizeProvider(provider, index)).map((provider) => [provider.id, provider]));
  return { version: MODEL_PROVIDER_ADAPTER_KIT_VERSION, status: "ready", providers, defaultProviderId: options.defaultProviderId ?? Object.keys(providers)[0] ?? null, requests: {}, requestOrder: [], responses: [], failures: [], pendingIds: [], sequence: 0, lastReason: "initialized" };
}

function normalizeProvider(provider = {}, index = 0) {
  const id = idOf(provider.id, `provider-${index + 1}`);
  return { id, label: String(provider.label ?? provider.name ?? id), mode: String(provider.mode ?? "manual"), modelIds: asList(provider.modelIds ?? provider.models).map(String), capabilities: clone(provider.capabilities ?? {}), metadata: clone(provider.metadata ?? {}) };
}

function normalizePacket(packet = {}, state = createInitialState(), options = {}) {
  const id = idOf(packet.id, `model-request-${state.sequence + 1}`);
  return { id, providerId: packet.providerId ?? state.defaultProviderId ?? options.defaultProviderId ?? "manual", modelId: packet.modelId ?? options.defaultModelId ?? null, purpose: String(packet.purpose ?? "agent-proposal"), agentId: packet.agentId == null ? null : String(packet.agentId), inputId: packet.inputId ?? null, prompt: packet.prompt == null ? null : String(packet.prompt), messages: clone(asList(packet.messages)), context: clone(packet.context ?? {}), metadata: clone(packet.metadata ?? {}) };
}

export function createModelProviderAdapterKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const ModelProviderState = resource(options.resourceName ?? "modelProvider.state");
  const ProviderRegistered = event("modelProvider.providerRegistered");
  const RequestQueued = event("modelProvider.requested");
  const ResponseSubmitted = event("modelProvider.responded");
  const RequestFailed = event("modelProvider.failed");
  const ModelProviderReset = event("modelProvider.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "model-provider-adapter-kit",
    resources: { ModelProviderState },
    events: { ProviderRegistered, RequestQueued, ResponseSubmitted, RequestFailed, ModelProviderReset },
    requires: asList(options.requires),
    provides: ["model:provider-adapter", "model:request-state", "agent:model-boundary", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, ModelProviderState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ModelProviderState, () => createInitialState(options));
      const publish = (next) => { world.setResource(ModelProviderState, next); return clone(next); };
      engine[options.apiName ?? "modelProvider"] = {
        resources: { ModelProviderState },
        events: { ProviderRegistered, RequestQueued, ResponseSubmitted, RequestFailed, ModelProviderReset },
        registerProvider(provider = {}) {
          const next = state();
          const normalized = normalizeProvider(provider, Object.keys(next.providers).length);
          next.providers[normalized.id] = normalized;
          if (!next.defaultProviderId || provider.default === true) next.defaultProviderId = normalized.id;
          next.lastReason = "provider-registered";
          publish(next);
          world.emit(ProviderRegistered, { provider: clone(normalized) });
          return clone(normalized);
        },
        request(packet = {}) {
          const next = state();
          const request = { ...normalizePacket(packet, next, options), status: "pending", requestedAtTick: tickOf(world), responseId: null, failureId: null };
          next.sequence += 1;
          next.requests[request.id] = request;
          next.requestOrder = [request.id, ...next.requestOrder.filter((id) => id !== request.id)].slice(0, Number(options.requestLimit ?? 128));
          next.pendingIds = [request.id, ...next.pendingIds.filter((id) => id !== request.id)].slice(0, Number(options.pendingLimit ?? 64));
          next.status = "pending";
          next.lastReason = "request-queued";
          publish(next);
          world.emit(RequestQueued, { request: clone(request) });
          return clone(request);
        },
        submitResponse(requestId, response = {}) {
          const next = state();
          const id = idOf(requestId);
          const request = next.requests[id];
          if (!request) return null;
          const responsePacket = { id: response.id ?? `model-response-${next.responses.length + 1}`, requestId: id, providerId: request.providerId, modelId: request.modelId, text: response.text ?? response.message ?? response.generated_text ?? null, output: clone(response.output ?? response), metadata: clone(response.metadata ?? {}), respondedAtTick: tickOf(world) };
          next.requests[id] = { ...request, status: "responded", responseId: responsePacket.id, respondedAtTick: responsePacket.respondedAtTick };
          next.responses = [responsePacket, ...next.responses].slice(0, Number(options.responseLimit ?? 128));
          next.pendingIds = next.pendingIds.filter((pendingId) => pendingId !== id);
          next.status = next.pendingIds.length ? "pending" : "ready";
          next.lastReason = "response-submitted";
          publish(next);
          world.emit(ResponseSubmitted, { requestId: id, response: clone(responsePacket) });
          return clone(responsePacket);
        },
        failRequest(requestId, reason = "failed", payload = {}) {
          const next = state();
          const id = idOf(requestId);
          const request = next.requests[id];
          if (!request) return null;
          const failure = { id: payload.id ?? `model-failure-${next.failures.length + 1}`, requestId: id, reason: String(reason), payload: clone(payload), failedAtTick: tickOf(world) };
          next.requests[id] = { ...request, status: "failed", failureId: failure.id, failedAtTick: failure.failedAtTick };
          next.failures = [failure, ...next.failures].slice(0, Number(options.failureLimit ?? 64));
          next.pendingIds = next.pendingIds.filter((pendingId) => pendingId !== id);
          next.status = next.pendingIds.length ? "pending" : "warning";
          next.lastReason = "request-failed";
          publish(next);
          world.emit(RequestFailed, { requestId: id, failure: clone(failure) });
          return clone(failure);
        },
        getRequest(requestId) { return clone(state().requests[idOf(requestId)] ?? null); },
        getPendingRequests() { const next = state(); return clone(next.pendingIds.map((id) => next.requests[id]).filter(Boolean)); },
        getLatestResponse() { return clone(state().responses[0] ?? null); },
        getState() { return clone(state()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(ModelProviderState, next); world.emit(ModelProviderReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: MODEL_PROVIDER_ADAPTER_KIT_VERSION, domain: "model-provider-adapter", extendsBase: "DomainServiceKit", ownsLoop: false, purpose: "Provider-neutral model request and response state.", boundary: "Owns provider registration and request lifecycle. Responses are packets only." }
  });
}

export default createModelProviderAdapterKit;
