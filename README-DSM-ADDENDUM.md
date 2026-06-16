# DSM Addendum for NexusRealtime ProtoKits

This addendum complements `README.md` without replacing the existing kit inventory.

## Start here for architecture work

Read `docs/START-HERE.md` before creating, refining, splitting, or promoting ProtoKits.

## DSM Architecture

ProtoKits are built around **DSM architecture**: Domain Service Modules.

A DSM is a reusable module that defines a domain and exposes services/API that make that domain happen.

```txt
DSM
  Domain: what this module means
  Services: the API that makes the domain happen
  Data: serializable configuration/content/tuning
  Events/resources: runtime communication and state
  Child DSMs: smaller modules composed recursively
```

## Key rule

```txt
Games compose DSMs through data.
Games should not define reusable architecture directly.
```

## Required docs

- `docs/START-HERE.md`
- `docs/DSM-ARCHITECTURE.md`
- `docs/DSM-AUTHORING-GUIDE.md`
- `docs/DSM-AGENT-WORKFLOW.md`
- `docs/DSM-SPLIT-RULES.md`
- `docs/DSM-CATALOG.md`
- `docs/DSM-DATA-CONTRACTS.md`
- `docs/DSM-TESTING-GUIDE.md`
- `docs/DSM-PROMOTION-GUIDE.md`
- `docs/templates/DSM-SPEC.md`
- `docs/templates/DSM-IMPLEMENTATION-CHECKLIST.md`
- `docs/templates/DSM-REVIEW-CHECKLIST.md`

## Why this exists

This repo is where experimental game systems become reusable architecture before promotion into NexusRealtime core. DSM docs give future agents and engineers a stable operating model for massive ProtoKit upgrades.
