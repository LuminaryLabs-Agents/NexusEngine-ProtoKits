# perception-kit

Filters world state into what an agent can see before a model or script ranks actions.

## Owns

```txt
visible entities
observable facts
agent observations
hidden-state filtering
range checks
```

## API

```js
engine.perception.registerEntity(entity)
engine.perception.setEntity(entityId, patch)
engine.perception.recordFact(fact)
engine.perception.observe(agentId)
engine.perception.getVisible(agentId)
engine.perception.getObservation(agentId)
```

## Boundary

This kit does not choose actions and does not mutate gameplay outcomes. It only builds observation packets.
