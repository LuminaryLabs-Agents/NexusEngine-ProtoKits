import {
  KIT_REGISTRY_DOMAIN_KIT_VERSION,
  createKitRegistryDomainKit,
  normalizeKitManifest,
  validateKitManifest
} from "../kit-registry-domain-kit/index.js";

export const KIT_MANIFEST_DOMAIN_KIT_VERSION = KIT_REGISTRY_DOMAIN_KIT_VERSION;
export { normalizeKitManifest, validateKitManifest };

function optionsFrom(runtimeOrOptions, maybeOptions) {
  return runtimeOrOptions?.defineDomainServiceKit || runtimeOrOptions?.defineRuntimeKit
    ? maybeOptions ?? {}
    : runtimeOrOptions ?? {};
}

export function createKitManifestDomainKit(runtimeOrOptions = {}, maybeOptions = {}) {
  const options = optionsFrom(runtimeOrOptions, maybeOptions);
  return createKitRegistryDomainKit({ ...options, kitId: options.kitId ?? "kit-manifest-domain-kit" });
}

export default createKitManifestDomainKit;
