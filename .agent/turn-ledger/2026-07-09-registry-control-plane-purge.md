# Registry Control-Plane Experiment Purge

## Read-only sources

- NexusEngine-ProtoKits pre-change `9da1fdb979a878dff8f50565fec4a4952e58af5e`.
- NexusEngine-Editor `12cd5555fb6db3a389e247f14869bc9f21c417ef`.
- NexusEngine-Kits `9de5f99ed1ea61a317bb72e10eea2545bc5875c2`.
- NexusEngine core `851372d29fece5ad7d9a6253fb1a74730ae24047`.

Source repositories were inspected read-only.

## Domain graph

```text
kit-registry-domain-kit
  -> capability-graph-domain-kit
  -> composition-planning-domain-kit
  -> stable installer/source adapters
  -> NexusEngine engine.installKit()
```

## Feature union

- Repository source identity, requested ref, resolved commit, trust metadata, engine compatibility, kits, domains, and bundles.
- Kit labels/categories, IDs, kinds, statuses, domain paths, API names, factories/modules, integrity, environments, requires/provides/composes, descriptors, boundaries, source lineage, and proof.
- Strict registry, kit ID, domain-path, API-name, domain, and bundle collisions.
- Search, filter, compatibility queries, indexes, progress, versioned snapshots, exact load, and reset.
- Requires/provides/composes graph, external providers, missing dependencies, cycles, clusters, dependency closure, and deterministic topological ordering.
- Kit/domain/bundle recipe expansion, allowed-status gates, install plans, validation, suggestions, and scoring.

## Purge decision

- Canonical state owner: `kit-registry-domain-kit`.
- Separate analysis owner: `capability-graph-domain-kit`.
- Separate planning owner: `composition-planning-domain-kit`.
- `kit-registry`, `kit-manifest-domain-kit`, and `domain-manifest-registry-domain-kit` remain compatibility exports that delegate to the canonical registry.
- No fetch, GitHub, cache, module import, execution, install, filesystem, rendering, or game behavior entered these DSKs.

## Experimental proposals

- Repository-source adapter for GitHub/jsDelivr ref-to-SHA resolution.
- Integrity verifier and lockfile adapter for reproducible external registries.
- Installer transaction/preflight adapter consuming composition plans.
- Signature policy only if a real publisher workflow needs stronger provenance than pinned commits and hashes.

## Validation

- Real NexusEngine DSK installation and addressability.
- Existing domain-control, composition-planning, and pure registry compatibility smokes.
- Strict collisions, pinned-SHA validation, bundle/domain expansion, status gates, provider ordering, missing dependencies, cycles, snapshot/reset/load, and forbidden-global scans.
- 1,000-manifest registry and graph scale; batching repaired after the first test exposed per-node rebuild cost.
- Manifest, domain-boundary, and performance-contract checks pass with only pre-existing repository-wide warnings.
