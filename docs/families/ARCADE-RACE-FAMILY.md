# Arcade Race Family

## Purpose

The arcade race family supports downhill racing, kart-like pack pacing, sliding traversal, AI drivers, hazards, boosts, contact, procedural course pacing, and renderer-agnostic low-poly descriptors.

## Known kits

- `createDownhillRaceKit`
- `createSlopeTraversalKit`
- `createRacerAIKit`
- `createDifficultyCurveKit`
- `createRaceHazardKit`
- `createBoostPathKit`
- `createRacerContactKit`
- `createRacePacingKit`
- `createCourseDirectorKit`
- `createArcadeRaceVisualKit`
- `arcade-race-core`

## Recommended composition

```txt
course director
downhill race
slope traversal
difficulty curve
racer AI
race hazards
boost path
racer contact
race pacing
arcade race visual descriptors
```

## Boundary rule

A game such as a penguin racer should be a preset/theme/configuration over these generic kits, not a set of penguin-specific engine modules.

## Documentation status

Family overview added. Individual READMEs/manifests are pending.
