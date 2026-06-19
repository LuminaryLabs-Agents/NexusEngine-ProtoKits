# rpg-social-fact-kit

Small RPG social-state domain for ownership, theft, suspicion, relationships, and crime facts.

## Owns

```txt
facts
ownership
stolen/returned item state
relationship values
crime reports
```

## API

```js
engine.socialFacts.setFact(fact)
engine.socialFacts.queryFacts(query)
engine.socialFacts.setOwnership(itemId, ownerId)
engine.socialFacts.markStolen(itemId, thiefId, witnessId)
engine.socialFacts.markReturned(itemId, returnerId)
engine.socialFacts.adjustRelationship(a, b, stat, amount)
engine.socialFacts.reportCrime(event)
```

## Boundary

This kit does not render and does not call models. It feeds social facts into perception and choice kits.
