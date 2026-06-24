# domain-inventory-domain-kit

## Purpose

Owns the inventory domain for discovered ProtoKit/domain surfaces.

It stores discovery entries produced by scripts or agent workflows, summarizes coverage, and reports missing index files, READMEs, manifests, factories, and version constants.

## Public API

```txt
engine.domainInventory.registerEntry(entry)
engine.domainInventory.registerMany(entries)
engine.domainInventory.summarize()
engine.domainInventory.listMissing(field)
engine.domainInventory.listByStatus(status)
engine.domainInventory.getEntry(id)
engine.domainInventory.getState()
engine.domainInventory.reset()
```

## Boundary

Does own:

```txt
discovered domain entry state
coverage summary
missing-field reports
inventory snapshots
```

Does not own:

```txt
filesystem scanning
source parsing
composition planning
browser smoke
repo writes
```
