export const KIT_MANIFEST_DOMAIN_KIT_VERSION = "0.1.0";

export function createKitManifestDomainKit(NexusRealtime = {}, config = {}) {
  const defineResource = NexusRealtime.defineResource ?? ((name) => ({ kind: "resource", name }));
  const defineEvent = NexusRealtime.defineEvent ?? ((name) => ({ kind: "event", name }));
  const defineRuntimeKit = NexusRealtime.defineRuntimeKit ?? ((spec) => Object.freeze(spec));
  const State = defineResource(config.resourceName ?? "kitManifest.state");
  const Registered = defineEvent("kitManifest.registered");
  const Validated = defineEvent("kitManifest.validated");
  const Reset = defineEvent("kitManifest.reset");
  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const list = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
  const initial = () => ({ version: KIT_MANIFEST_DOMAIN_KIT_VERSION, manifests: {}, order: [], validations: [] });
  const normalize = (manifest = {}) => ({ id: String(manifest.id ?? "kit-manifest"), domain: manifest.domain ?? null, parentDomain: manifest.parentDomain ?? null, extendsBase: manifest.extendsBase ?? "DomainServiceKit", requires: list(manifest.requires).map(String), provides: list(manifest.provides).map(String), composes: list(manifest.composes).map(String), ownsLoop: Boolean(manifest.ownsLoop), exportPath: manifest.exportPath ?? null, sourcePath: manifest.sourcePath ?? null, testPaths: list(manifest.testPaths).map(String), status: manifest.status ?? "experimental", metadata: clone(manifest.metadata ?? {}) });
  const validate = (manifest = {}) => {
    const warnings = [];
    for (const field of ["id", "domain", "extendsBase", "provides", "exportPath", "sourcePath", "status"]) {
      const value = manifest[field];
      if (value == null || value === "" || Array.isArray(value) && value.length === 0) warnings.push({ type: "missing-field", field });
    }
    return { ok: warnings.length === 0, warningCount: warnings.length, warnings };
  };
  return defineRuntimeKit({
    id: config.kitId ?? "kit-manifest-domain-kit",
    resources: { State },
    events: { Registered, Validated, Reset },
    provides: ["kit:manifest-registry", "kit:metadata", "domain:catalog"],
    initWorld({ world }) { world.setResource(State, initial()); },
    install({ engine, world }) {
      const get = () => world.getResource(State) ?? initial();
      const set = (state) => (world.setResource(State, state), clone(state));
      engine[config.apiName ?? "kitManifest"] = {
        registerManifest(manifest = {}) { const state = get(); const normalized = normalize(manifest); state.manifests[normalized.id] = normalized; state.order = [normalized.id, ...state.order.filter((id) => id !== normalized.id)]; set(state); world.emit(Registered, { manifest: clone(normalized) }); return clone(normalized); },
        validateManifest(id) { const state = get(); const manifest = state.manifests[String(id)]; const report = manifest ? { id: `kit-manifest-validation-${state.validations.length + 1}`, manifestId: manifest.id, ...validate(manifest) } : { id: `kit-manifest-validation-${state.validations.length + 1}`, manifestId: id, ok: false, warningCount: 1, warnings: [{ type: "missing-manifest", id }] }; state.validations.unshift(report); set(state); world.emit(Validated, { report: clone(report) }); return clone(report); },
        listByDomain(domain) { return clone(Object.values(get().manifests).filter((manifest) => manifest.domain === domain || manifest.parentDomain === domain)); },
        listByProvides(token) { return clone(Object.values(get().manifests).filter((manifest) => manifest.provides.includes(token))); },
        getState() { return clone(get()); },
        reset() { const state = initial(); set(state); world.emit(Reset, { reason: "reset" }); return clone(state); }
      };
    },
    metadata: { version: KIT_MANIFEST_DOMAIN_KIT_VERSION, domain: "kit-manifest", purpose: "Machine-readable kit manifest registry." }
  });
}

export default createKitManifestDomainKit;
