# House Domain Boundaries Example

This is a design-only example for future house-centered games. It is not an implementation requirement for the current pass.

## Principle

A specific house is content. A reusable house system is a domain.

## Possible boundaries

```txt
house-domain-kit
  owns house identity, room membership, ownership, safety, comfort, upgrade slots

room-graph-kit
  owns rooms, exits, adjacency, traversal links, active/sleeping room state

door-lock-kit
  owns doors, lock state, keys, requirements, open/close events

utility-state-kit
  owns heat, water, power, leaks, smoke, airflow, repair state

comfort-safety-kit
  owns warmth, privacy, shelter, danger exposure, resident comfort

haunting-pressure-kit
  owns haunting intensity, room memory, ghost pressure, supernatural escalation

house-render-descriptor-kit
  owns renderer-agnostic descriptors for rooms, doors, windows, damage, lights, overlays

house-session-facade-kit
  exposes small host-facing actions such as enterRoom, inspect, repair, lockDoor, rest, restart, getSnapshot

living-house-deploy-kit
  configures the above domains as a hostile shifting horror house without owning the reusable rules
```

## Deploy shape

```json
{
  "id": "living-house.entry-hall",
  "kind": "scene-deploy-kit",
  "uses": [
    "house-domain-kit",
    "room-graph-kit",
    "door-lock-kit",
    "utility-state-kit",
    "haunting-pressure-kit",
    "scene-lifecycle-kit",
    "save-delta-kit",
    "performance-budget-kit"
  ],
  "assetPacks": ["old-house-shared", "entry-hall-pack"],
  "entities": "entities.entry-hall.json",
  "sequences": "sequences.entry-hall.json",
  "performanceProfile": {
    "targetFps": 60,
    "maxActiveRooms": 4,
    "maxDynamicLights": 8,
    "maxFullSimEntities": 24
  }
}
```
