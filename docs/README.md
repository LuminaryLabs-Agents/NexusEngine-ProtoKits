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

## Templates

- `templates/DSM-SPEC.md` — spec template for new or materially changed kits.
- `templates/DSM-IMPLEMENTATION-CHECKLIST.md` — implementation checklist.
- `templates/DSM-REVIEW-CHECKLIST.md` — review checklist.

## Core principle

A kit defines a domain and exposes services/API that make that domain happen. Larger kits compose smaller kits recursively until the remaining parts are atomic.

Games should compose kits through data. Games should not define reusable architecture directly.
