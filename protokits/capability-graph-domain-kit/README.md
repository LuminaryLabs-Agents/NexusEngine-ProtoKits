# capability-graph-domain-kit

## Purpose

Owns the capability graph domain for domain-first composition.

It registers domain manifests as graph nodes, builds requires/provides/composes edges, finds missing requires, and discovers clusters by capability tokens.

## Public API

```txt
engine.capabilityGraph.registerDomain(manifest)
engine.capabilityGraph.registerMany(manifests)
engine.capabilityGraph.buildGraph()
engine.capabilityGraph.listByProvides(token)
engine.capabilityGraph.listByDomain(domain)
engine.capabilityGraph.findMissingRequires(id)
engine.capabilityGraph.findClusters(seedTokens)
engine.capabilityGraph.getState()
engine.capabilityGraph.reset()
```

## Boundary

Does own:

```txt
domain graph nodes
requires/provides/composes edges
missing dependency reports
capability cluster reports
```

Does not own:

```txt
installing kits
running simulation
writing files
rendering experiments
```
