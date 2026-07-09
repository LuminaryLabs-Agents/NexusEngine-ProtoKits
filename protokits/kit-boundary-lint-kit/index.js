import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const KIT_BOUNDARY_LINT_KIT_VERSION = "0.1.0";

const defaultRules = Object.freeze([
  { id: "no-document", pattern: "document\\.", message: "Reusable domain kits should not read or mutate document." },
  { id: "no-window", pattern: "window\\.", message: "Reusable domain kits should not depend on window." },
  { id: "no-canvas", pattern: "getContext\\(|HTMLCanvasElement|canvas\\.", message: "Canvas work belongs in hosts/renderers." },
  { id: "no-three", pattern: "from \\\"three|from 'three|THREE\\.", message: "Three/WebGL work belongs in renderer adapters." },
  { id: "no-fetch", pattern: "fetch\\(", message: "Provider/asset calls must stay outside deterministic gameplay systems." },
  { id: "no-local-storage", pattern: "localStorage\\.", message: "Persistent browser storage is a host concern." },
  { id: "no-date-now", pattern: "Date\\.now\\(", message: "Use runtime clock, not wall clock, for deterministic state." },
  { id: "no-random", pattern: "Math\\.random\\(", message: "Use seeded random helpers." },
  { id: "no-raf", pattern: "requestAnimationFrame\\(", message: "Frame loops belong in hosts." }
]);

function createInitialState(options = {}) {
  return { version: KIT_BOUNDARY_LINT_KIT_VERSION, rules: asList(options.rules ?? defaultRules).map((rule) => ({ ...rule, pattern: String(rule.pattern) })), reports: [], lastReport: null, lastReason: "initialized" };
}

function scanSource(path, source, rules = defaultRules, options = {}) {
  const allow = new Set(asList(options.allowRules));
  const findings = [];
  for (const rule of rules) {
    if (allow.has(rule.id)) continue;
    const regex = new RegExp(rule.pattern, "g");
    let match;
    while ((match = regex.exec(String(source ?? "")))) {
      const before = String(source ?? "").slice(0, match.index);
      findings.push({ ruleId: rule.id, path, index: match.index, line: before.split("\n").length, message: rule.message });
      if (!regex.global) break;
    }
  }
  return { ok: findings.length === 0, findingCount: findings.length, findings };
}

export function createKitBoundaryLintKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const KitBoundaryLintState = resource(options.resourceName ?? "kitBoundaryLint.state");
  const TextScanned = event("kitBoundaryLint.textScanned");
  const ManifestScanned = event("kitBoundaryLint.manifestScanned");
  const KitBoundaryLintReset = event("kitBoundaryLint.reset");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "kit-boundary-lint-kit",
    resources: { KitBoundaryLintState },
    events: { TextScanned, ManifestScanned, KitBoundaryLintReset },
    provides: ["kit:boundary-lint", "kit:renderer-boundary-report", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, KitBoundaryLintState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, KitBoundaryLintState, () => createInitialState(options));
      const publish = (next) => { world.setResource(KitBoundaryLintState, next); return clone(next); };
      const record = (report, eventDef) => {
        const next = state();
        next.reports = [report, ...next.reports].slice(0, Number(options.reportLimit ?? 128));
        next.lastReport = report;
        next.lastReason = report.ok ? "lint-pass" : "lint-warning";
        publish(next);
        world.emit(eventDef, { report: clone(report) });
        return clone(report);
      };
      engine[options.apiName ?? "kitBoundaryLint"] = {
        scanText(path, source, payload = {}) {
          const report = { id: `boundary-lint-${state().reports.length + 1}`, path: String(path ?? "source.js"), ...scanSource(String(path ?? "source.js"), String(source ?? ""), state().rules, payload) };
          return record(report, TextScanned);
        },
        scanManifest(manifest = {}) {
          const warnings = [];
          if (manifest.ownsLoop && !manifest.metadata?.loopContract) warnings.push({ ruleId: "loop-contract", message: "Loop-owning kits need explicit loop lifecycle metadata." });
          if (manifest.extendsBase && !String(manifest.extendsBase).endsWith("Kit")) warnings.push({ ruleId: "extends-base", message: "extendsBase should name a NexusEngine kit contract." });
          const report = { id: `boundary-manifest-${state().reports.length + 1}`, path: manifest.sourcePath ?? manifest.id ?? "manifest", ok: warnings.length === 0, findingCount: warnings.length, findings: warnings };
          return record(report, ManifestScanned);
        },
        getReport() { return clone(state().lastReport); },
        getState() { return clone(state()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(KitBoundaryLintState, next); world.emit(KitBoundaryLintReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: KIT_BOUNDARY_LINT_KIT_VERSION, domain: "kit-boundary-lint", extendsBase: "DomainServiceKit", ownsLoop: false, purpose: "Headless boundary lint over provided source text and manifests." }
  });
}

export default createKitBoundaryLintKit;
