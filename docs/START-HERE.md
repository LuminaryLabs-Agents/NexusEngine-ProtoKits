# Start Here: ProtoKit DSM Work

This is the first document an agent should read before creating, splitting, refining, or promoting any NexusRealtime ProtoKit.

## The one-sentence architecture

NexusRealtime ProtoKits follow **Domain Service Module** architecture: each kit defines a domain and exposes services, data contracts, events, resources, and optional child kits that make that domain usable.

```txt
DSM = architecture concept
Kit = implementation unit
```

In this repo, DSMs are built and shipped as `-kit` implementations.

## Required reading order for agents

1. `docs/START-HERE.md` — this orientation.
2. `docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md` — current mainline implementation plan for guided, agent, model, and harness kits.
3. `docs/DSM-ARCHITECTURE.md` — understand the DSM mental model.
4. `docs/DSM-KIT-NAMING.md` — use correct `-kit` implementation names.
5. `docs/DSM-AUTHORING-GUIDE.md` — learn how to build a DSM-shaped ProtoKit.
6. `docs/DSM-AGENT-WORKFLOW.md` — follow the exact implementation workflow.
7. `docs/DSM-SPLIT-RULES.md` — decide whether to create, refine, or split modules.
8. `docs/DSM-DATA-CONTRACTS.md` — keep behavior data-driven.
9. `docs/DSM-TESTING-GUIDE.md` — add headless tests and smoke checks.
10. `docs/DSM-PROMOTION-GUIDE.md` — understand the bar for promoting to stable NexusRealtime.
11. `docs/DSM-CATALOG.md` — reuse or extend existing domain/service families.
12. `docs/templates/DSM-SPEC.md` — write the spec for any significant new kit.

## Agent operating rule

Do not start by asking, "What game am I building?"

Start by asking:

- What domain is being defined by this kit?
- What services are the API that make that domain happen?
- Which smaller kits should this kit compose?
- What data configures it?
- What state, events, and snapshots must be deterministic?
- What should stay renderer-agnostic?

Games and experiments should compose kits through data. A game can validate a kit, but a game should not become the architecture unit.

## Correct naming

Use DSM language in architecture discussion.

Use `-kit` names in implementation.

```txt
Tree domain -> tree-kit -> createTreeKit()
Leaf domain -> leaf-kit -> createLeafKit()
Route domain -> route-kit -> createRouteKit()
Biome field domain -> biome-field-kit -> createBiomeFieldKit()
```

Avoid:

```txt
tree-dsm
createTreeDSM()
TreeDSM folder
```

## Safe implementation loop

1. Inspect current repo patterns and exports.
2. Identify the target domain/service family.
3. If a kit exists, refine it instead of duplicating it.
4. If the target is too large, split child kits first.
5. Write or update a DSM spec.
6. Implement the smallest useful runtime-compatible kit.
7. Keep public APIs small and idempotent.
8. Keep reusable kits free of DOM, Canvas, Three.js, browser globals, fetch, localStorage, Date.now, and unseeded random.
9. Add headless tests.
10. Update exports and docs.
11. Run the repo checks.
12. Report changed files, tests, and known follow-up gaps.

## Core vocabulary

- **DSM:** Domain Service Module architecture.
- **Kit:** the implementation unit in this repo.
- **Domain:** the meaning owned and defined by the kit.
- **Service:** the public API that makes the domain happen and lets other modules use it.
- **Child kit:** a smaller kit composed by a larger kit.
- **Data contract:** serializable configuration and authored content accepted by the kit.
- **Host:** browser/renderer/app shell that captures input and draws snapshots.
- **Runtime kit:** the NexusRealtime-compatible installation unit using resources, events, systems, requires, provides, initWorld, install, and metadata.

## Prime directive

Build reusable `-kit` architecture, not game-specific feature blobs.
