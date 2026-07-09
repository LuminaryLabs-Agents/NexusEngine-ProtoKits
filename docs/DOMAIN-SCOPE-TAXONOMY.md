# Domain Scope Taxonomy

## Purpose

This document defines the domain scope taxonomy used by NexusEngine-ProtoKits.

A domain is a boundary of meaning. Scope is the size of that boundary. The boundary can be tiny, large, abstract, physical, authored, simulated, proof-oriented, or host-adapter oriented. The important question is whether the boundary owns a service responsibility.

## Scope levels

```txt
atomic-domain
  One small reusable rule or value boundary.

feature-domain
  A gameplay/system/service feature with state, events, validation, and API.

stack-domain
  A composition of related feature or atomic domains.

mode-domain
  A playable loop assembled from domains, data, and proof requirements.

application-domain
  A full app/game/workflow composition.

route-domain
  A proof or experiment route composition.

adapter-domain
  A platform/library bridge with explicit lifecycle boundaries.

content-domain
  A reusable content table, preset, catalog, or descriptor boundary.

proof-domain
  A harness, smoke, replay, capture, or readiness boundary.
```

## Naming rules

Prefer names that end in a scope-visible suffix:

```txt
*-domain-kit
*-mode-domain-kit
*-application-domain-kit
*-route-domain-kit
*-adapter-domain-kit
*-content-domain-kit
*-proof-domain-kit
```

Legacy `*-dsk` exports can remain as compatibility shims, but new implementation folders should use domain-first names.

## Domain boundary test

Before creating a domain kit, answer:

```txt
What is the boundary?
What does it own?
What APIs does it expose?
What state does it manage?
What events does it emit?
What validation does it perform?
What descriptors does it provide?
What other domains does it compose?
What NexusEngine base does it extend?
Can it be reused outside one game?
```

If the answers are clear, build a scoped domain kit.

If not, the thing is probably content data, a preset, a sequence, an adapter, a host concern, or an experiment-only implementation detail.

## Classification tree

```txt
logic-space
├─ owns reusable rules/state/API/events/validation?
│  └─ scoped domain kit
│
├─ owns authored player-facing ordering?
│  └─ sequence data or sequence-orchestration-domain-kit
│
├─ owns static descriptors/tuning/catalog data?
│  └─ content-domain-kit or plain data
│
├─ owns platform/library bridge?
│  └─ adapter-domain-kit
│
├─ owns proof/testing/reporting?
│  └─ proof-domain-kit
│
└─ owns route/game/app composition?
   └─ route-domain-kit / mode-domain-kit / application-domain-kit
```

## Default manifest fields

Every domain should eventually have:

```txt
id
domain
parentDomain
scope
extendsBase
composes
requires
provides
ownsLoop
snapshotPolicy
resetPolicy
exportPath
sourcePath
testPaths
status
```

## Forbidden drift

Do not create:

```txt
random helper kit
second ProtoKits core
DOM-coupled simulation kit
Canvas-coupled gameplay kit
Three.js-coupled gameplay kit
game-branded generic kit
composition hidden in HTML imports
```

Use manifests, capability graphs, and composition planning domains instead.
