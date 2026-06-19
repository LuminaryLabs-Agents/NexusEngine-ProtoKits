import * as DirectNexusRealtime from "nexusrealtime";

export const PROTOKITS_DSK_ADAPTER_VERSION = "0.0.2";
export const PROTOKITS_DSK_STABILITY = "experimental";

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

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

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
      NexusRealtime: runtimeOrConfig,
      config: maybeConfig ?? {},
      mode: "injected-runtime"
    };
  }

  return {
    NexusRealtime: DirectNexusRealtime,
    config: runtimeOrConfig ?? {},
    mode: "direct-import"
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

export function withProtoDomainServiceRuntime(NexusRealtime, key, options = {}) {
  const spec = getFirstWaveDskSpec(key);
  if (!spec || typeof NexusRealtime?.defineDomainServiceKit !== "function") {
    return NexusRealtime;
  }

  return Object.freeze({
    ...NexusRealtime,
    defineRuntimeKit(config = {}) {
      return NexusRealtime.defineDomainServiceKit(createDskConfig(config, spec, options));
    }
  });
}

