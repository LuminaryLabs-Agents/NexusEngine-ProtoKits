# NexusRealtime ProtoKits DSM Documentation

Start at `START-HERE.md`.

## Core naming rule

```txt
DSM = architecture concept
Kit = implementation unit
```

In this repo, DSMs are built and shipped as `-kit` folders with `createXKit()` factories.

## DSM docs

- `START-HERE.md` — entrypoint for agents and large upgrade passes.
- `DSM-ARCHITECTURE.md` — core Domain Service Module architecture.
- `DSM-KIT-NAMING.md` — naming boundary between DSM concepts and `-kit` implementation files.
- `DSM-AUTHORING-GUIDE.md` — how to design and implement DSM-shaped ProtoKits.
- `DSM-AGENT-WORKFLOW.md` — exact workflow for agents working in this repo.
- `DSM-SPLIT-RULES.md` — create/refine/split decision rules.
- `DSM-CATALOG.md` — reusable domain/service family map with kit implementation names.
- `DSM-DATA-CONTRACTS.md` — data-driven module contracts.
- `DSM-TESTING-GUIDE.md` — required tests and reliability expectations.
- `DSM-PROMOTION-GUIDE.md` — promotion gates from experiment to ProtoKit to core.
- `DSK-FIRST-WAVE-LEDGER.md` — closed migration ledger for the first `defineDomainServiceKit()` wave.
- `dsk-composition-upgrade-plan.md` — composition-first object proof upgrade plan for bounded DSK containers.
- `dsk-composition-implementation-ledger.md` — implementation ledger for the first object-proof composition pass.
- `Raw_conversation_explanation.md` — raw explanation of the DSK / ProtoKit architecture conversation and decisions.

## Templates

- `templates/DSM-SPEC.md` — spec template for new or materially changed kits.
- `templates/DSM-IMPLEMENTATION-CHECKLIST.md` — implementation checklist.
- `templates/DSM-REVIEW-CHECKLIST.md` — review checklist.

## Core principle

A kit defines a domain and exposes services/API that make that domain happen. Larger kits compose smaller kits recursively until the remaining parts are atomic.

Games should compose kits through data. Games should not define reusable architecture directly.

## Composition-first extension

For object proofs and idea-packet-driven work, prefer upgrading existing bounded containers before creating new kits.

Object-specific packets such as banana, coin, button, crate, and potion are specs/presets/proofs, not standalone kits.
