# NexusRealtime ProtoKits Docs

Start here when creating, refining, documenting, splitting, or promoting ProtoKits.

## Start here

- `START-HERE.md` — required reading order for DSM/ProtoKit work.
- `MASTER-UPGRADE-PLAN.md` — additive composition-layer upgrade plan.
- `IMPLEMENTATION-NARRATIVE.md` — chat-to-implementation record explaining why this architecture exists.
- `DECISIONS-2026-06-DSK-COMPOSITION.md` — decision records for the DSK composition upgrade.
- `CHANGELOG-2026-06-DSK-COMPOSITION-UPGRADE.md` — detailed changelog for the June 2026 composition pass.

## Architecture

- `DSM-ARCHITECTURE.md` — Domain Service Module architecture.
- `DSM-KIT-NAMING.md` — kit naming rules.
- `DSM-AUTHORING-GUIDE.md` — how to author DSM-shaped ProtoKits.
- `DSM-AGENT-WORKFLOW.md` — exact workflow for agents working in this repo.
- `DSM-SPLIT-RULES.md` — create/refine/split decision rules.
- `DSM-CATALOG.md` — reusable domain/service family map with kit implementation names.
- `DSM-DATA-CONTRACTS.md` — data-driven module contracts.
- `DSM-TESTING-GUIDE.md` — required tests and reliability expectations.
- `DSM-PROMOTION-GUIDE.md` — promotion gates from experiment to ProtoKit to core.
- `OWNERSHIP-RULES.md` — where behavior, content, assets, hosts, and renderer code belong.
- `COMPATIBILITY-GUARANTEE.md` — non-breaking rollout rules.

## Composition layer

- `COMPOSITION-KITS.md` — deploy manifests, scene lifecycle, save deltas, host contracts, session facades, scene graph, and compatibility bridges.
- `ELECTRON-DESKTOP-COMPOSITION.md` — how Electron should host the runtime without owning reusable gameplay.
- `PERFORMANCE-CONTRACTS.md` — how kits describe cost, telemetry, and degradation.
- `dsk-composition-upgrade-plan.md` — composition-first object proof upgrade plan for bounded DSK containers.
- `dsk-composition-implementation-ledger.md` — implementation ledger for the first object-proof composition pass.

## Inventory and documentation rollout

- `PROTOKIT-INVENTORY.md` — current inventory and documentation status.
- `DOCUMENTATION-BACKLOG.md` — prioritized documentation work.
- `HOW-TO-DOCUMENT-A-PROTOKIT.md` — step-by-step documentation workflow.
- `DOCS-PUSH-CHECKLIST.md` — checklist for documentation pushes.

## Families

- `families/COMPOSITION-FAMILY.md`
- `families/AERIAL-FAMILY.md`
- `families/OPEN-WORLD-FLIGHT-FAMILY.md`
- `families/ENVIRONMENT-FIDELITY-FAMILY.md`
- `families/RPG-SOCIAL-FAMILY.md`
- `families/SCOPED-RPG-FAMILY.md`
- `families/SPATIAL-AUTHORING-FAMILY.md`
- `families/GENERIC-DEFENSE-FAMILY.md`
- `families/VERTICAL-CLIMB-FAMILY.md`
- `families/ARCADE-RACE-FAMILY.md`

## Templates

- `templates/DSM-SPEC.md` — spec template for new or materially changed kits.
- `templates/DSM-IMPLEMENTATION-CHECKLIST.md` — implementation checklist.
- `templates/DSM-REVIEW-CHECKLIST.md` — review checklist.
- `templates/PROTOKIT-README.md` — README template for kit documentation.
- `templates/DOMAIN-BOUNDARY.md` — domain-boundary documentation template.
- `templates/PERFORMANCE-CONTRACT.md` — performance contract template.
- `templates/DEPLOY-KIT-MANIFEST.md` — deploy manifest template.
- `templates/DOMAIN-BOUNDARY-REVIEW.md` — boundary review checklist.

## Examples

- `examples/HOUSE-DOMAIN-BOUNDARIES.md` — demonstrates house as reusable domain boundaries instead of a one-off game object.
- `Raw_conversation_explanation.md` — raw explanation of the earlier DSK / ProtoKit architecture conversation and decisions.

## Core naming rule

```txt
DSM = architecture concept
Kit = implementation unit
```

In this repo, DSMs are built and shipped as `-kit` folders with `createXKit()` factories.

## Core principle

A kit defines a domain and exposes services/API that make that domain happen. Larger kits compose smaller kits recursively until the remaining parts are atomic.

Games should compose kits through data. Games should not define reusable architecture directly.

## Composition-first extension

For object proofs and idea-packet-driven work, prefer upgrading existing bounded containers before creating new kits.

Object-specific packets such as banana, coin, button, crate, and potion are specs/presets/proofs, not standalone kits.

## Rule of thumb

```txt
Reusable behavior -> domain kit
Reusable composition behavior -> lifecycle/session/deploy kit
Specific game setup -> deploy manifest or preset data
Specific object placement -> scene data
Heavy media -> asset pack
Authored flow -> sequence
Presentation -> renderer adapter or host
```
