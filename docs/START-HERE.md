# Start Here: DSM ProtoKit Work

This is the first document an agent should read before creating, splitting, refining, or promoting any NexusRealtime ProtoKit.

## The one-sentence architecture

NexusRealtime ProtoKits are **Domain Service Modules** (DSMs): reusable modules that define a domain and expose services, data contracts, events, resources, and optional child DSMs that make that domain usable.

## Required reading order for agents

1. `docs/DSM-ARCHITECTURE.md` — understand the DSM mental model.
2. `docs/DSM-AUTHORING-GUIDE.md` — learn how to build a DSM-shaped ProtoKit.
3. `docs/DSM-AGENT-WORKFLOW.md` — follow the exact implementation workflow.
4. `docs/DSM-SPLIT-RULES.md` — decide whether to create, refine, or split modules.
5. `docs/DSM-DATA-CONTRACTS.md` — keep behavior data-driven.
6. `docs/DSM-TESTING-GUIDE.md` — add headless tests and smoke checks.
7. `docs/DSM-PROMOTION-GUIDE.md` — understand the bar for promoting to stable NexusRealtime.
8. `docs/DSM-CATALOG.md` — reuse or extend existing domain/service families.
9. `docs/templates/DSM-SPEC.md` — write the spec for any new DSM.

## Agent operating rule

Do not start by asking, "What game am I building?"

Start by asking:

- What domain is being defined by this module?
- What services are the API that make that domain happen?
- Which smaller DSMs should this module compose?
- What data configures it?
- What state, events, and snapshots must be deterministic?
- What should stay renderer-agnostic?

Games and experiments should compose DSMs through data. A game can validate a DSM, but a game should not become the architecture unit.

## Safe implementation loop

1. Inspect current repo patterns and exports.
2. Identify the target DSM or DSM family.
3. If a module exists, refine it instead of duplicating it.
4. If the target is too large, split child DSMs first.
5. Write or update a DSM spec.
6. Implement the smallest useful runtime-compatible kit.
7. Keep public APIs small and idempotent.
8. Keep reusable DSMs free of DOM, Canvas, Three.js, browser globals, fetch, localStorage, Date.now, and unseeded random.
9. Add headless tests.
10. Update exports and docs.
11. Run the repo checks.
12. Report changed files, tests, and known follow-up gaps.

## Core vocabulary

- **DSM:** Domain Service Module.
- **Domain:** the meaning owned and defined by the module.
- **Service:** the public API that makes the domain happen and lets other modules use it.
- **Child DSM:** a smaller DSM composed by a larger DSM.
- **Data contract:** serializable configuration and authored content accepted by the DSM.
- **Host:** browser/renderer/app shell that captures input and draws snapshots.
- **Runtime kit:** the NexusRealtime-compatible installation unit using resources, events, systems, requires, provides, initWorld, install, and metadata.

## Prime directive

Build reusable architecture, not game-specific feature blobs.
