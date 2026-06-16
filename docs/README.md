# NexusRealtime ProtoKits DSM Documentation

Start at `START-HERE.md`.

## DSM docs

- `START-HERE.md` — entrypoint for agents and large upgrade passes.
- `DSM-ARCHITECTURE.md` — core Domain Service Module architecture.
- `DSM-AUTHORING-GUIDE.md` — how to design and implement DSM-shaped ProtoKits.
- `DSM-AGENT-WORKFLOW.md` — exact workflow for agents working in this repo.
- `DSM-SPLIT-RULES.md` — create/refine/split decision rules.
- `DSM-CATALOG.md` — reusable DSM family map.
- `DSM-DATA-CONTRACTS.md` — data-driven module contracts.
- `DSM-TESTING-GUIDE.md` — required tests and reliability expectations.
- `DSM-PROMOTION-GUIDE.md` — promotion gates from experiment to ProtoKit to core.

## Templates

- `templates/DSM-SPEC.md` — spec template for new or materially changed DSMs.
- `templates/DSM-IMPLEMENTATION-CHECKLIST.md` — implementation checklist.
- `templates/DSM-REVIEW-CHECKLIST.md` — review checklist.

## Core principle

A DSM defines a domain and exposes services/API that make that domain happen. Larger DSMs compose smaller DSMs recursively until the remaining parts are atomic.

Games should compose DSMs through data. Games should not define reusable architecture directly.
