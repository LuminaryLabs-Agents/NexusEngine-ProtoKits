# Performance Contracts

Performance contracts make ProtoKits measurable without making them renderer-specific.

## Contract shape

Every significant kit manifest should describe:

```txt
scalesWith
telemetry
degradationModes
budgetInputs
budgetOutputs
```

Every deploy manifest should describe:

```txt
targetFps
maxActiveScenes
maxActiveRooms
maxDynamicLights
maxFullSimEntities
maxDescriptors
maxMemoryMb
```

## Kit-level example

```json
{
  "scalesWith": ["activePatches", "instanceCount"],
  "telemetry": ["frameMs", "activePatches", "instanceCount"],
  "degradationModes": ["lowerPatchRadius", "reduceInstances", "disableFarShadows"],
  "budgetInputs": ["performance-budget-kit"],
  "budgetOutputs": ["renderDescriptorCount"]
}
```

## Deploy-level example

```json
{
  "targetFps": 60,
  "maxActiveScenes": 1,
  "maxActiveRooms": 6,
  "maxDynamicLights": 8,
  "maxFullSimEntities": 32,
  "maxDescriptors": 1200,
  "maxMemoryMb": 1024
}
```

## Rule

A DSK should describe what it costs and how it degrades, but it should not directly reduce renderer quality by mutating renderer internals. It should emit budget descriptors and state that renderer adapters can consume.
