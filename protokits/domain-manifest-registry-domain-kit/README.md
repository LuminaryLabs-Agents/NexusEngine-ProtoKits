# domain-manifest-registry-domain-kit

Compatibility factory for the canonical `kit-registry-domain-kit` state owner. It preserves `engine.domainManifestRegistry` queries while installing the same `engine.n.kitRegistry` service rather than a duplicate registry.

## Purpose

Owns the manifest registry domain for domain-first ProtoKit composition.

It stores scoped domain manifests, validates required metadata, and indexes domains by `domain`, `scope`, `provides`, and `requires`.

## Public API

```txt
engine.domainManifestRegistry.registerManifest(manifest)
engine.domainManifestRegistry.registerMany(manifests)
engine.domainManifestRegistry.validateManifest(idOrManifest)
engine.domainManifestRegistry.listByDomain(domain)
engine.domainManifestRegistry.listByProvides(token)
engine.domainManifestRegistry.listByScope(scope)
engine.domainManifestRegistry.getManifest(id)
engine.domainManifestRegistry.getIndexes()
engine.domainManifestRegistry.getState()
engine.domainManifestRegistry.reset()
```

## Boundary

Does own:

```txt
manifest normalization
manifest validation
manifest indexing
serializable manifest registry state
```

Does not own:

```txt
file scanning
GitHub writes
renderer code
DOM/Canvas/Three.js
network calls
```
