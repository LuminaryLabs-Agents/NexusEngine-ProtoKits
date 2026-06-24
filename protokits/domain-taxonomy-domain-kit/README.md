# domain-taxonomy-domain-kit

## Purpose

Owns the taxonomy domain for domain-first ProtoKit authoring.

It classifies domain manifests, validates naming, registers scope policy, and helps agents reject non-domain blobs before code is generated.

## Public API

```txt
engine.domainTaxonomy.classify(entry)
engine.domainTaxonomy.validateName(id)
engine.domainTaxonomy.registerScope(scope)
engine.domainTaxonomy.validateScope(scopeId)
engine.domainTaxonomy.getState()
engine.domainTaxonomy.reset()
```

## Boundary

Does own:

```txt
domain scope vocabulary
domain naming policy
classification reports
scope registration
```

Does not own:

```txt
manifest storage
source scanning
composition planning
renderer code
repo writes
```
