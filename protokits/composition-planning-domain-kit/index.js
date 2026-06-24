import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const COMPOSITION_PLANNING_DOMAIN_KIT_VERSION = "0.1.0";

export const manifest = Object.freeze({
  id: "composition-planning-domain-kit",
  domain: "composition-planning",
  parentDomain: "domain-control-plane",
  scope: "control-domain",
  extendsBase: "DomainServiceKit",
  composes: ["capability-graph-domain-kit"],
  requires: ["domain:capability-graph"],
  provides: ["domain:composition-planning", "domain:install-plan", "domain:dependency-gap-report"],
  ownsLoop: false,
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",
  exportPath: "./composition-planning-domain-kit",
  sourcePath: "protokits/composition-planning-domain-kit/index.js",
  testPaths: ["tests/domain-composition-planning-smoke.test.mjs"],
  status: "experimental"
});

const idOf = (value, fallback = "composition") => String(value ?? fallback).trim() || fallback;

function createInitialState(options = {}) {
  const recipes = Object.fromEntries(asList(options.recipes).map(normalizeRecipe).map((recipe) => [recipe.id, recipe]));
  return { version: COMPOSITION_PLANNING_DOMAIN_KIT_VERSION, recipes, plans: {}, validations: {}, missingReports: {}, lastReason: "initialized" };
}

export function normalizeRecipe(input = {}) {
  const id = idOf(input.id ?? input.name, "domain-composition");
  return {
    id,
    type: String(input.type ?? "stack-domain"),
    goal: String(input.goal ?? id),
    includes: asList(input.includes ?? input.domains).map(String),
    requires: asList(input.requires).map(String),
    provides: asList(input.provides).map(String),
    smoke: clone(input.smoke ?? {}),
    metadata: clone(input.metadata ?? {})
  };
}

function graphState(engine) {
  return engine.capabilityGraph?.buildGraph?.() ?? engine.capabilityGraph?.getState?.() ?? { nodes: {}, indexes: { byProvides: {} } };
}

function providersFor(graph, token) {
  return asList(graph.indexes?.byProvides?.[token]).map((id) => graph.nodes?.[id]).filter(Boolean);
}

export function createCompositionPlanningDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const CompositionPlanningState = resource(options.resourceName ?? "compositionPlanning.state");
  const CompositionRecipeRegistered = event("compositionPlanning.recipeRegistered");
  const CompositionPlanned = event("compositionPlanning.planned");
  const CompositionValidated = event("compositionPlanning.validated");
  const CompositionPlanningReset = event("compositionPlanning.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "composition-planning-domain-kit",
    resources: { CompositionPlanningState },
    events: { CompositionRecipeRegistered, CompositionPlanned, CompositionValidated, CompositionPlanningReset },
    requires: asList(options.requires),
    provides: ["domain:composition-planning", "domain:install-plan", "domain:dependency-gap-report", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, CompositionPlanningState, () => createInitialState(options)); },
    install({ engine, world }) {
      const get = () => ensureResource(world, CompositionPlanningState, () => createInitialState(options));
      const set = (next) => { world.setResource(CompositionPlanningState, next); return clone(next); };
      const resolveRecipe = (idOrRecipe) => typeof idOrRecipe === "string" ? get().recipes[idOrRecipe] : normalizeRecipe(idOrRecipe);
      engine[options.apiName ?? "compositionPlanning"] = {
        registerRecipe(input = {}) {
          const next = get();
          const recipe = normalizeRecipe(input);
          next.recipes[recipe.id] = recipe;
          next.lastReason = "recipe-registered";
          set(next);
          world.emit(CompositionRecipeRegistered, { recipe: clone(recipe) });
          return clone(recipe);
        },
        planComposition(goal = {}) {
          const recipe = this.registerRecipe(goal);
          return this.createInstallPlan(recipe.id);
        },
        createInstallPlan(idOrRecipe) {
          const recipe = resolveRecipe(idOrRecipe);
          if (!recipe) return null;
          const graph = graphState(engine);
          const install = [];
          const missing = [];
          for (const token of recipe.requires) {
            const providers = providersFor(graph, token);
            if (providers.length) for (const provider of providers) if (!install.includes(provider.id)) install.push(provider.id);
            else missing.push(token);
          }
          for (const id of recipe.includes) if (!install.includes(id)) install.push(id);
          const plan = { id: `${recipe.id}:install-plan`, recipeId: recipe.id, installOrder: install, missing, ok: missing.length === 0, provides: recipe.provides, smoke: clone(recipe.smoke) };
          const next = get();
          next.plans[recipe.id] = plan;
          next.lastReason = plan.ok ? "install-plan-ready" : "install-plan-missing-dependencies";
          set(next);
          world.emit(CompositionPlanned, { plan: clone(plan) });
          return clone(plan);
        },
        validateComposition(idOrRecipe) {
          const recipe = resolveRecipe(idOrRecipe);
          if (!recipe) return { ok: false, reason: "missing-recipe" };
          const plan = this.createInstallPlan(recipe.id);
          const graph = graphState(engine);
          const missingIncludes = recipe.includes.filter((id) => graph.nodes && Object.keys(graph.nodes).length > 0 && !graph.nodes[id]);
          const report = { id: `${recipe.id}:validation`, recipeId: recipe.id, ok: Boolean(plan?.ok) && missingIncludes.length === 0, missingRequires: plan?.missing ?? [], missingIncludes };
          const next = get();
          next.validations[recipe.id] = report;
          next.lastReason = report.ok ? "composition-valid" : "composition-warning";
          set(next);
          world.emit(CompositionValidated, { report: clone(report) });
          return clone(report);
        },
        suggestMissingDomains(idOrRecipe) {
          const recipe = resolveRecipe(idOrRecipe);
          if (!recipe) return [];
          const plan = this.createInstallPlan(recipe.id);
          const suggestions = asList(plan?.missing).map((token) => ({ token, suggestedId: `${token.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-domain-kit`, reason: "missing-provider" }));
          const next = get();
          next.missingReports[recipe.id] = suggestions;
          set(next);
          return clone(suggestions);
        },
        scoreComposition(idOrRecipe) {
          const report = this.validateComposition(idOrRecipe);
          const penalty = (report.missingRequires?.length ?? 0) + (report.missingIncludes?.length ?? 0);
          return { ...report, score: Math.max(0, 1 - penalty * 0.25) };
        },
        getState() { return clone(get()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(CompositionPlanningState, next); world.emit(CompositionPlanningReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: COMPOSITION_PLANNING_DOMAIN_KIT_VERSION, domain: "composition-planning", extendsBase: "DomainServiceKit", composes: ["capability-graph-domain-kit"], ownsLoop: false, manifest }
  });
}

export default createCompositionPlanningDomainKit;
