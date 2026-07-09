# kit-registry

Compatibility pure-helper export for `kit-registry-domain-kit`.

The canonical state owner is now `protokits/kit-registry-domain-kit` at `engine.n.kitRegistry`. This folder retains `createKitRegistry()` and manifest normalization/query imports without owning a second registry implementation.

## Domain

Pure helper registry for kit manifests.

## Purpose

This module helps tools, docs, tests, and future Electron/browser workbenches list, query, and relate machine-readable `kit.manifest.json` records.

## Kit type

Tooling helper. It is not a runtime-installed kit in this initial pass.

## Public API

- `normalizeKitManifest(input)`
- `validateKitManifest(input)`
- `createKitRegistry(manifests)`
- `registry.findByProvide(token)`
- `registry.findByRequire(token)`
- `registry.findCompatibleKits(id)`
- `registry.listDeployKits()`
- `registry.listDomainBoundaries()`

## Renderer boundary

No runtime or renderer ownership. This is JSON-safe metadata tooling.

## Performance contract

Scales with manifest count.

## Compatible kits

- `domain-boundary-kit`
- `deploy-registry-kit`
- manifest validation scripts

## Promotion status

Experimental additive tooling module.
