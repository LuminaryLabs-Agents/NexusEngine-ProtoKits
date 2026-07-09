export const PROTOKITS_DSK_ADAPTER_VERSION = "0.0.2";
export const PROTOKITS_DSK_STABILITY = "experimental";

const LOCAL_NEXUS_RUNTIME = Object.freeze({
  adapter: "local-protokit-fallback-runtime",
  defineResource(name, options = {}) {
    return Object.freeze({ kind: "resource", name, ...options });
  },
  defineEvent(name, options = {}) {
    return Object.freeze({ kind: "event", name, ...options });
  },
  defineRuntimeKit(config = {}) {
    return Object.freeze({ kind: "runtime-kit", ...config });
  },
  defineDomainServiceKit(config = {}) {
    const domainPath = config.domainPath ?? `n:${config.domain}`;
    const apiName = config.apiName;
    const legacyInstall = config.install;
    return Object.freeze({
      kind: "domain-service-kit",
      ...config,
      provides: Object.freeze(Array.from(new Set([domainPath, ...(config.provides ?? [])]))),
      metadata: Object.freeze({
        ...(config.metadata ?? {}),
        kind: "domain-service-kit",
        namespace: "n",
        domain: config.domain,
        domainPath,
        apiName: config.apiName,
        stability: config.stability,
        version: config.version,
        execution: Object.freeze({
          mode: "linear",
          asyncReady: config.asyncReady !== false,
          serializableState: config.serializableState !== false,
          inputs: Object.freeze([...(config.inputs ?? [])]),
          outputs: Object.freeze([...(config.outputs ?? [])]),
          snapshot: config.snapshot ?? "required",
          reset: config.reset ?? "required"
        })
      }),
      install(context) {
        context.engine.n ??= {};
        const api = typeof config.createApi === "function" ? config.createApi(context) : undefined;
        const result = legacyInstall?.(context);
        const installedApi = api ?? result ?? context.engine[apiName];
        if (installedApi !== undefined) context.engine.n[apiName] = installedApi;
        return result;
      }
    });
  },
  createRealtimeGame(config = {}) {
    return Object.freeze({ kind: "realtime-game", ...config });
  }
});

const FIRST_WAVE_DSKS = Object.freeze({
  createZoneFieldKit: {
    domain: "zone-field",
    apiName: "zoneField",
    status: "promoted-candidate"
  },
  createScanSurveyKit: {
    domain: "scan-survey",
    apiName: "scanSurvey",
    status: "promoted-candidate"
  },
  createRouteCheckpointKit: {
    domain: "route-checkpoint",
    apiName: "routeCheckpoint",
    status: "promoted-candidate"
  },
  createResourcePressureKit: {
    domain: "resource-pressure",
    apiName: "resourcePressure",
    status: "promoted-candidate"
  },
  createHazardDirectorKit: {
    domain: "hazard-director",
    apiName: "hazardDirector",
    status: "promoted-candidate"
  },
  createTokenRegistryKit: {
    domain: "token-registry",
    apiName: "tokenRegistry",
    status: "promoted-candidate"
  },
  "completion-ledger-kit": {
    domain: "completion-ledger",
    apiName: "completionLedger",
    status: "promoted-candidate"
  },
  completionLedgerKit: {
    domain: "completion-ledger",
    apiName: "completionLedger",
    status: "promoted-candidate"
  },
  createCompletionLedgerKit: {
    domain: "completion-ledger",
    apiName: "completionLedger",
    status: "promoted-candidate"
  }
});

export function isNexusRuntimeCandidate(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    (
      typeof value.defineRuntimeKit === "function" ||
      typeof value.defineDomainServiceKit === "function" ||
      typeof value.createRealtimeGame === "function"
    )
  );
}

export function normalizeProtoKitFactoryArgs(runtimeOrConfig, maybeConfig = {}) {
  if (isNexusRuntimeCandidate(runtimeOrConfig)) {
    return {
      NexusEngine: runtimeOrConfig,
      config: maybeConfig ?? {},
      mode: "injected-runtime"
    };
  }

  return {
    NexusEngine: LOCAL_NEXUS_RUNTIME,
    config: runtimeOrConfig ?? {},
    mode: "local-fallback-runtime"
  };
}

export function getFirstWaveDskSpec(key) {
  return FIRST_WAVE_DSKS[key] ?? null;
}

function resolveVersion(config, options) {
  return config.version ?? config.metadata?.version ?? options.version ?? PROTOKITS_DSK_ADAPTER_VERSION;
}

function createDskConfig(config, spec, options = {}) {
  const legacyInstall = config.install;
  const legacyId = config.id ?? `${spec.domain}-kit`;
  const apiName = options.apiName ?? spec.apiName;

  return {
    ...config,
    id: options.id ?? `n-${spec.domain}-kit`,
    domain: spec.domain,
    apiName,
    stability: config.stability ?? config.metadata?.stability ?? PROTOKITS_DSK_STABILITY,
    version: resolveVersion(config, options),
    metadata: {
      ...(config.metadata ?? {}),
      protoKitAdapter: PROTOKITS_DSK_ADAPTER_VERSION,
      protoKitLegacyId: legacyId,
      promotionStatus: spec.status,
      reset: "api.reset",
      snapshot: "api.getSnapshot"
    },
    install(context) {
      legacyInstall?.(context);
      return context.engine?.[apiName];
    }
  };
}

export function withProtoDomainServiceRuntime(NexusEngine, key, options = {}) {
  const spec = getFirstWaveDskSpec(key);
  if (!spec || typeof NexusEngine?.defineDomainServiceKit !== "function") {
    return NexusEngine;
  }

  return Object.freeze({
    ...NexusEngine,
    defineRuntimeKit(config = {}) {
      return NexusEngine.defineDomainServiceKit(createDskConfig(config, spec, options));
    }
  });
}
