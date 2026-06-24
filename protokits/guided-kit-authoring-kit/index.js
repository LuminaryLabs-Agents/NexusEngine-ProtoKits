import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const GUIDED_KIT_AUTHORING_KIT_VERSION = "0.1.0";

const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const requiredSpecFields = Object.freeze(["id", "domain", "purpose", "doesOwn", "doesNotOwn", "resources", "events", "publicApi", "requires", "provides", "tests", "docs", "promotionCriteria"]);

function createInitialState(options = {}) {
  return { version: GUIDED_KIT_AUTHORING_KIT_VERSION, specs: {}, order: [], validations: [], plans: [], requiredFields: asList(options.requiredFields ?? requiredSpecFields), lastReason: "initialized" };
}

function normalizeSpec(spec = {}, index = 0) {
  const id = idOf(spec.id ?? spec.name, `guided-kit-${index + 1}`);
  return {
    id,
    name: String(spec.name ?? id),
    domain: spec.domain == null ? null : String(spec.domain),
    scope: String(spec.scope ?? "domain-kit"),
    purpose: spec.purpose == null ? null : String(spec.purpose),
    doesOwn: asList(spec.doesOwn).map(String),
    doesNotOwn: asList(spec.doesNotOwn).map(String),
    resources: asList(spec.resources).map(String),
    events: asList(spec.events).map(String),
    systems: asList(spec.systems).map(String),
    publicApi: clone(spec.publicApi ?? {}),
    requires: asList(spec.requires).map(String),
    provides: asList(spec.provides).map(String),
    config: clone(spec.config ?? {}),
    snapshotPolicy: String(spec.snapshotPolicy ?? "serializable"),
    resetPolicy: String(spec.resetPolicy ?? "engine-reset-aware"),
    tests: asList(spec.tests).map(String),
    docs: asList(spec.docs).map(String),
    promotionCriteria: asList(spec.promotionCriteria).map(String),
    metadata: clone(spec.metadata ?? {})
  };
}

function validateSpec(spec = {}, requiredFields = requiredSpecFields) {
  const warnings = [];
  for (const field of requiredFields) {
    const value = spec[field];
    const emptyList = Array.isArray(value) && value.length === 0;
    const emptyObject = value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0;
    if (value == null || value === "" || emptyList || emptyObject) warnings.push({ type: "missing-field", field });
  }
  if (String(spec.id ?? "").includes("v3")) warnings.push({ type: "mainline-name-warning", field: "id" });
  if (spec.doesOwn?.some?.((entry) => /dom|canvas|three|webgl|fetch|localStorage/i.test(entry))) warnings.push({ type: "ownership-boundary-warning", field: "doesOwn" });
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings };
}

function planFiles(spec = {}) {
  const folder = `protokits/${idOf(spec.id, "new-kit")}`;
  return {
    kitId: spec.id,
    files: [
      `${folder}/index.js`,
      `${folder}/README.md`,
      `tests/${idOf(spec.id, "new-kit")}-smoke.test.mjs`
    ],
    exports: [`./${spec.id}`],
    docs: asList(spec.docs).length ? asList(spec.docs) : [`${folder}/README.md`]
  };
}

function checklistFor(spec = {}, validation = validateSpec(spec)) {
  return [
    { id: "domain", label: "Domain is named", ok: Boolean(spec.domain) },
    { id: "ownership", label: "Does-own and does-not-own are stated", ok: asList(spec.doesOwn).length > 0 && asList(spec.doesNotOwn).length > 0 },
    { id: "runtime-surface", label: "Resources/events/API are declared", ok: asList(spec.resources).length > 0 && asList(spec.events).length > 0 && Object.keys(spec.publicApi ?? {}).length > 0 },
    { id: "composition", label: "Requires/provides are declared", ok: asList(spec.provides).length > 0 },
    { id: "tests", label: "Headless tests are planned", ok: asList(spec.tests).length > 0 },
    { id: "docs", label: "Docs are planned", ok: asList(spec.docs).length > 0 },
    { id: "validation", label: "Spec validation passes", ok: validation.ok }
  ];
}

export function createGuidedKitAuthoringKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const GuidedKitAuthoringState = resource(options.resourceName ?? "guidedKitAuthoring.state");
  const SpecCreated = event("guidedKitAuthoring.specCreated");
  const SpecPatched = event("guidedKitAuthoring.specPatched");
  const SpecValidated = event("guidedKitAuthoring.specValidated");
  const FilesPlanned = event("guidedKitAuthoring.filesPlanned");
  const GuidedKitAuthoringReset = event("guidedKitAuthoring.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "guided-kit-authoring-kit",
    resources: { GuidedKitAuthoringState },
    events: { SpecCreated, SpecPatched, SpecValidated, FilesPlanned, GuidedKitAuthoringReset },
    provides: ["tooling:guided-kit-authoring", "kit:spec-validation", "kit:file-plan", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, GuidedKitAuthoringState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, GuidedKitAuthoringState, () => createInitialState(options));
      const publish = (next) => { world.setResource(GuidedKitAuthoringState, next); return clone(next); };
      engine[options.apiName ?? "guidedKitAuthoring"] = {
        createSpec(spec = {}) {
          const next = state();
          const normalized = normalizeSpec(spec, next.order.length);
          next.specs[normalized.id] = normalized;
          next.order = [normalized.id, ...next.order.filter((id) => id !== normalized.id)];
          next.lastReason = "spec-created";
          publish(next);
          world.emit(SpecCreated, { spec: clone(normalized) });
          return clone(normalized);
        },
        patchSpec(id, patch = {}) {
          const next = state();
          const current = next.specs[idOf(id)];
          if (!current) return null;
          const updated = normalizeSpec({ ...current, ...clone(patch), metadata: { ...current.metadata, ...(patch.metadata ?? {}) } }, next.order.length);
          next.specs[current.id] = updated;
          next.lastReason = "spec-patched";
          publish(next);
          world.emit(SpecPatched, { id: current.id, patch: clone(patch), spec: clone(updated) });
          return clone(updated);
        },
        validateSpec(id) {
          const next = state();
          const spec = next.specs[idOf(id)];
          if (!spec) return { ok: false, reason: "missing-spec", warnings: [{ type: "missing-spec", id }] };
          const report = { id: `guided-kit-validation-${next.validations.length + 1}`, specId: spec.id, ...validateSpec(spec, next.requiredFields), checklist: checklistFor(spec) };
          next.validations = [report, ...next.validations].slice(0, Number(options.validationLimit ?? 96));
          next.lastReason = report.ok ? "spec-valid" : "spec-warning";
          publish(next);
          world.emit(SpecValidated, { report: clone(report) });
          return clone(report);
        },
        planFiles(id) {
          const next = state();
          const spec = next.specs[idOf(id)];
          if (!spec) return null;
          const plan = { id: `guided-kit-file-plan-${next.plans.length + 1}`, specId: spec.id, ...planFiles(spec) };
          next.plans = [plan, ...next.plans].slice(0, Number(options.planLimit ?? 64));
          next.lastReason = "files-planned";
          publish(next);
          world.emit(FilesPlanned, { plan: clone(plan) });
          return clone(plan);
        },
        getChecklist(id) { const spec = state().specs[idOf(id)]; return spec ? clone(checklistFor(spec, validateSpec(spec, state().requiredFields))) : []; },
        getState() { return clone(state()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(GuidedKitAuthoringState, next); world.emit(GuidedKitAuthoringReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: GUIDED_KIT_AUTHORING_KIT_VERSION, domain: "guided-kit-authoring", extendsBase: "DomainServiceKit", ownsLoop: false, purpose: "Stores and validates kit specs/checklists for guided mainline kit authoring.", boundary: "Owns serializable authoring specs and reports. Does not write files or mutate repositories." }
  });
}

export default createGuidedKitAuthoringKit;
