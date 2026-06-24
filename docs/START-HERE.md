# Start Here: ProtoKit DSM Work

This is the first document an agent should read before creating, splitting, refining, composing, or promoting any NexusRealtime ProtoKit.

## The one-sentence architecture

NexusRealtime ProtoKits follow **Domain Service Module** architecture: each kit defines a domain and exposes services, data contracts, events, resources, and optional child kits that make that domain usable.

```txt
DSM = architecture concept
Kit = implementation unit
Domain = boundary of meaning
DSK = installable service kit for a domain boundary
```

In this repo, DSMs are built and shipped as `-kit` implementations. New scalable composition work must be **domain-first**: every reusable logic space is classified as a scoped domain, data, sequence, adapter, harness/proof domain, mode domain, application domain, or experiment route domain before code is created.

## Required reading order for agents

1. `docs/START-HERE.md` — this orientation.
2. `docs/DOMAIN-FIRST-COMPOSITION-MASTER-PLAN.md` — current domain-first plan for self-composing scoped domains.
3. `docs/DOMAIN-SCOPE-TAXONOMY.md` — domain scope vocabulary, naming, and boundary rules.
4. `docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md` — mainline guided, agent, model, and harness kit plan.
5. `docs/DSM-ARCHITECTURE.md` — understand the DSM mental model.
6. `docs/DSM-KIT-NAMING.md` — use correct `-kit` implementation names.
7. `docs/DSM-AUTHORING-GUIDE.md` — learn how to build a DSM-shaped ProtoKit.
8. `docs/DSM-AGENT-WORKFLOW.md` — follow the exact implementation workflow.
9. `docs/DSM-SPLIT-RULES.md` — decide whether to create, refine, or split modules.
10. `docs/DSM-DATA-CONTRACTS.md` — keep behavior data-driven.
11. `docs/DSM-TESTING-GUIDE.md` — add headless tests and smoke checks.
12. `docs/DSM-PROMOTION-GUIDE.md` — understand the bar for promoting to stable NexusRealtime.
13. `docs/DSM-CATALOG.md` — reuse or extend existing domain/service families.
14. `docs/templates/DOMAIN-SPEC.md` — write a scoped domain spec for significant new domain work.
15. `docs/templates/DOMAIN-MANIFEST.md` — create machine-readable domain metadata.
16. `docs/templates/DSM-SPEC.md` — compatibility template for DSM-shaped specs.

## Agent operating rule

Do not start by asking, "What game am I building?"

Start by asking:

- What domain boundary is being defined?
- What service does this domain provide?
- What scope is this: atomic, feature, stack, mode, application, route, adapter, content, or proof?
- What other domains does it compose?
- What data configures it?
- What state, events, snapshots, and reset behavior must be deterministic?
- What should stay renderer-agnostic?

Games and experiments should compose domains through data. A game can validate a domain, but a game should not become the reusable architecture unit.

## Correct naming

Use DSM language in architecture discussion.

Use `-kit` names in implementation.

Prefer scoped domain names:

```txt
Heat pressure boundary -> heat-pressure-domain-kit -> createHeatPressureDomainKit()
Route stack boundary -> route-stack-domain-kit -> createRouteStackDomainKit()
Self-play proof boundary -> self-play-planning-domain-kit -> createSelfPlayPlanningDomainKit()
Experiment route boundary -> generated-experiment-route-domain-kit -> createGeneratedExperimentRouteDomainKit()
```

Avoid:

```txt
tree-dsm
createTreeDSM()
random-helper-kit
higher-level-composer-tool
Canvas-owned-gameplay-kit
```

## Safe implementation loop

1. Inspect current repo patterns and exports.
2. Identify the target domain/service family.
3. Classify the scope using `docs/DOMAIN-SCOPE-TAXONOMY.md`.
4. If a domain kit exists, refine it instead of duplicating it.
5. If the target is too large, split child domains first.
6. Write or update a domain spec.
7. Add or update a domain manifest.
8. Implement the smallest useful runtime-compatible domain kit.
9. Keep public APIs small and idempotent.
10. Keep reusable kits free of DOM, Canvas, Three.js, browser globals, fetch, localStorage, Date.now, and unseeded random.
11. Add headless tests.
12. Update exports and docs.
13. Run the repo checks.
14. Report changed files, tests, and known follow-up gaps.

## Core vocabulary

- **DSM:** Domain Service Module architecture.
- **Kit:** the implementation unit in this repo.
- **Domain:** the meaning owned and defined by the kit.
- **DSK:** the installable service kit for a domain boundary.
- **Service:** the public API that makes the domain happen and lets other modules use it.
- **Child domain:** a smaller domain composed by a larger domain.
- **Data contract:** serializable configuration and authored content accepted by the domain.
- **Host:** browser/renderer/app shell that captures input and draws snapshots.
- **Runtime kit:** the NexusRealtime-compatible installation unit using resources, events, systems, requires, provides, initWorld, install, and metadata.

## Prime directive

Build scoped, reusable domain architecture, not game-specific feature blobs.
