# DSM Data Contracts

Data contracts make DSMs scalable. Code defines reusable behavior; data defines the specific game, level, preset, theme, tuning, or content set.

## Core rule

```txt
Behavior belongs in DSM code.
Content and tuning belong in data.
```

A game should become a composition of DSMs plus data, not a custom pile of game-specific systems.

## What a data contract must define

Every significant DSM should document:

- required fields
- optional fields and defaults
- stable IDs
- units
- ranges
- seeded randomness behavior
- invalid data handling
- snapshot shape if data appears in state
- version/migration approach if data will evolve

## Data should be serializable

DSM input data should usually be JSON-compatible.

Good:

```js
{
  id: "route-main",
  points: [{ x: 0, z: 0 }, { x: 8, z: 12 }],
  width: 4,
  loop: false
}
```

Avoid:

```js
{
  onScan() {},
  mesh: new THREE.Mesh(),
  element: document.querySelector("#x")
}
```

Functions can exist in pure helpers or adapters, but stable DSM data should remain serializable when possible.

## Stable IDs

Use stable IDs for anything that may appear in resources, events, snapshots, save files, replay logs, or renderer descriptors.

Examples:

```txt
route-main
relay-01
species-pine
fog-bank-east
checkpoint-gate-a
```

## Seeded generation

If a DSM generates content, the seed must be explicit.

Good:

```js
{
  id: "forest-band-a",
  seed: "fog-forest-001",
  density: 0.65
}
```

Bad:

```js
Math.random()
Date.now()
```

## Contract examples

### RouteDSM data

```js
{
  id: "route-main",
  points: [{ x: 0, z: 0 }, { x: -8, z: 11 }, { x: 9, z: 18 }],
  curve: "catmull-rom",
  width: 4,
  sampleCount: 80,
  tags: ["main", "safe-path"]
}
```

### TerrainDSM data

```js
{
  id: "terrain-field",
  seed: "terrain-001",
  bounds: { minX: -30, maxX: 30, minZ: -10, maxZ: 60 },
  baseHeight: 0,
  noise: { amplitude: 0.4, frequency: 0.08 },
  pathCarving: [{ routeId: "route-main", width: 5, flatten: 0.75 }]
}
```

### ScatterPlacementDSM data

```js
{
  id: "forest-scatter",
  seed: "scatter-001",
  archetypes: ["tree-pine", "tree-dead-birch", "rock-small"],
  density: 0.7,
  constraints: {
    avoidRouteWidth: 4,
    minSpacing: 1.8,
    maxSlope: 0.55
  }
}
```

### TreeDSM data

```js
{
  id: "tree-pine",
  species: "pine",
  trunk: { height: [5, 9], radius: [0.18, 0.42] },
  canopy: { levels: [3, 6], radius: [1.4, 3.2] },
  leaves: { density: 0.8, colorRamp: ["#1f3a2b", "#3f6540"] }
}
```

### ScanTargetDSM data

```js
{
  id: "relay-01-scan-target",
  targetId: "relay-01",
  radius: 3.2,
  facingDotMin: 0.5,
  durationSeconds: 1.2,
  requiredAction: "scan"
}
```

## Data validation behavior

A DSM should do one of the following:

- accept valid data
- default missing optional fields
- reject invalid required fields with useful errors
- sanitize safe numeric ranges

Do not silently accept invalid IDs or invalid shapes if that could corrupt state.

## Data vs service responsibilities

Data should say:

```txt
what exists
where it exists
how dense it is
how it is tuned
what IDs it uses
```

Services should do:

```txt
sampling
validation
state transitions
event emission
snapshot generation
```

## Versioning

For larger data contracts, include:

```js
{
  version: 1,
  id: "forest-preset-a"
}
```

If the contract evolves, the DSM should either migrate old data or reject old versions clearly.

## Agent checklist

```txt
[ ] Data is serializable.
[ ] IDs are stable.
[ ] Defaults are documented.
[ ] Units are clear.
[ ] Seeds are explicit.
[ ] Invalid data behavior is defined.
[ ] Tests cover at least one valid and one invalid/defaulted contract.
```
