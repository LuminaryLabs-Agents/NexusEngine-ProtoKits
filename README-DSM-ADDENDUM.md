# DSM Addendum for NexusRealtime ProtoKits

This addendum complements `README.md` without replacing the existing kit inventory.

## Start here for architecture work

Read `docs/START-HERE.md` before creating, refining, splitting, or promoting ProtoKits.

## DSM Architecture

ProtoKits are built around **DSM architecture**: Domain Service Modules.

```txt
DSM = architecture concept
Kit = implementation unit
```

A ProtoKit is the implementation form of a DSM. A kit defines a domain and exposes services/API that make that domain happen.

```txt
Kit
  Domain: what this module means
  Services: the API that makes the domain happen
  Data: serializable configuration/content/tuning
  Events/resources: runtime communication and state
  Child kits: smaller modules composed recursively
```

Implementation names use normal `-kit` naming:

```txt
tree-kit -> createTreeKit()
route-kit -> createRouteKit()
biome-field-kit -> createBiomeFieldKit()
```

Do not name implementation folders `tree-dsm` or factories `createTreeDSM()`.

## Key rule

```txt
Games compose kits through data.
Games should not define reusable architecture directly.
```

## Required docs

- `docs/START-HERE.md`
- `docs/DSM-ARCHITECTURE.md`
- `docs/DSM-KIT-NAMING.md`
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

This repo is where experimental game systems become reusable kit architecture before promotion into NexusRealtime core. DSM docs give future agents and engineers a stable operating model for massive ProtoKit upgrades.
