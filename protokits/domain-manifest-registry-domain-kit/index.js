import {
  KIT_REGISTRY_DOMAIN_KIT_VERSION,
  createKitRegistryDomainKit,
  normalizeKitManifest,
  validateKitManifest
} from "../kit-registry-domain-kit/index.js";

export const DOMAIN_MANIFEST_REGISTRY_DOMAIN_KIT_VERSION = KIT_REGISTRY_DOMAIN_KIT_VERSION;
export const normalizeManifest = normalizeKitManifest;

export function validateDomainManifest(input = {}) {
  const report = validateKitManifest(input);
  return {
    ok: report.ok,
    warningCount: report.errors.length,
    warnings: report.errors.map((message) => ({ type: "validation-error", message })),
    manifest: report.manifest
  };
}

function optionsFrom(runtimeOrOptions, maybeOptions) {
  return runtimeOrOptions?.defineDomainServiceKit || runtimeOrOptions?.defineRuntimeKit
    ? maybeOptions ?? {}
    : runtimeOrOptions ?? {};
}

export function createDomainManifestRegistryDomainKit(runtimeOrOptions = {}, maybeOptions = {}) {
  const options = optionsFrom(runtimeOrOptions, maybeOptions);
  return createKitRegistryDomainKit({ ...options, kitId: options.kitId ?? "domain-manifest-registry-domain-kit" });
}

export default createDomainManifestRegistryDomainKit;
