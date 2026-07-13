# Semantic Bounded Domain Kits

Semantic bounded domains for NexusEngine games and experiments.

This package keeps **game-design meaning above implementation mechanics**:

```txt
family groups related bounded meanings
domain owns one coherent authority
services expose the meaningful parts
existing atomic kits execute reusable mechanics
product bridges coordinate multiple domains
composition roots install the game graph
read models feed hosts and renderers
```

It does not replace ECS. ECS remains the realtime data-oriented substrate inside NexusEngine. These DSKs provide the domain language, ownership, commands, events, snapshots, descriptors, and aggregate surfaces that games compose.

## Included domain families

```txt
production
  agriculture
  foraging
  crafting
  manufacturing
  processing

mobility
  traversal
  transport
  navigation

infrastructure
  construction
  utilities
  restoration

conflict
  combat
  defense
  survival

world
  environment
  ecology
  settlement

agency
  character
  interaction
  social
  agent-intelligence

knowledge
  investigation
  authoring
  model-workbench
```

Family names are catalog namespaces. They do not need executable parent kits.

## Included full DSKs

| DSK | Domain path | Runtime API |
| --- | --- | --- |
| Mobility Traversal | `n:mobility:traversal` | `engine.n.traversal` |
| Infrastructure Restoration | `n:infrastructure:restoration` | `engine.n.restoration` |
| Conflict Defense | `n:conflict:defense` | `engine.n.defense` |
| World Environment | `n:world:environment` | `engine.n.environment` |
| Agency Character | `n:agency:character` | `engine.n.character` |
| Knowledge Investigation | `n:knowledge:investigation` | `engine.n.investigation` |
| Experience Composition | `n:composition:experience` | `engine.n.experienceComposition` |

## Semantic service shapes

### Traversal

```js
engine.n.traversal.network.register(route)
engine.n.traversal.journey.begin({ id, routeId, actorId })
engine.n.traversal.passage.enter(journeyId, nodeId)
engine.n.traversal.passage.complete(journeyId, nodeId)
engine.n.traversal.progress.get(journeyId)
```

Grapples, ledges, flight gates, rails, checkpoints, and delivery stops remain route content, constraints, policies, or adapters beneath Traversal.

### Restoration

```js
engine.n.restoration.assets.register(asset)
engine.n.restoration.diagnosis.apply(assetId, diagnosis)
engine.n.restoration.planning.create(assetId, plan)
engine.n.restoration.work.contribute(planId, requirementId, amount)
engine.n.restoration.commissioning.commission(planId)
```

Pumps, relays, shelters, radios, water systems, and storm rigs use the same bounded restoration language with different data.

### Defense

`createConflictDefenseDomainKits()` preserves and installs the existing generic-defense DSK boundaries, then exposes them through a semantic aggregate:

```txt
battlefield   -> genericDefense.map
logistics     -> genericDefense.economyWallet
fortification -> genericDefense.buildPlacement
threats       -> genericDefense.waveAgentDirector
engagement    -> genericDefense.combatResolver
session       -> genericDefense.sessionFacade
descriptors   -> genericDefense.renderDescriptors
```

### Environment

Environment owns portable region and effect-field meaning. Heavy terrain arrays, foliage instances, GPU buffers, physics handles, and renderer objects remain provider-owned.

### Character

Character owns identity, roles, capabilities, conditions, control assignment, and references to other domains. Motion, physics, inventory contents, agent policy, and renderer objects remain outside the boundary.

### Investigation

Investigation owns cases, observations, evidence, hypotheses, and conclusions. Product-specific mysteries, clues, dialogue, and presentation remain data or authored content.

## Composition

`createSemanticExperienceCompositionKit()` is a composition root and read-model builder. It does not take ownership of the installed domains.

```js
const engine = createEngine({
  kits: [
    createMobilityTraversalDomainKit(NexusEngine, traversalConfig),
    createInfrastructureRestorationDomainKit(NexusEngine, restorationConfig),
    createWorldEnvironmentDomainKit(NexusEngine, environmentConfig),
    createAgencyCharacterDomainKit(NexusEngine, characterConfig),
    createKnowledgeInvestigationDomainKit(NexusEngine, investigationConfig),
    createSemanticExperienceCompositionKit(NexusEngine, {
      compositionId: "summit-relay-rescue",
      domains: [
        { id: "traversal", family: "mobility", domainPath: "n:mobility:traversal", apiName: "traversal" },
        { id: "restoration", family: "infrastructure", domainPath: "n:infrastructure:restoration", apiName: "restoration" },
        { id: "environment", family: "world", domainPath: "n:world:environment", apiName: "environment" },
        { id: "character", family: "agency", domainPath: "n:agency:character", apiName: "character" }
      ]
    })
  ]
});

engine.n.experienceComposition.validation.run();
engine.n.experienceComposition.readModel.build();
```

## Ownership rule

These DSKs own portable semantic state, services, events, snapshots, descriptors, and reset behavior.

They do not own DOM, Canvas, Three.js, WebGL, browser input listeners, GPU buffers, physics handles, asset loading, or game-specific fiction.
