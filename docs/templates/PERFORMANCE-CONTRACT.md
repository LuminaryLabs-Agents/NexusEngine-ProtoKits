# <kit-name> Performance Contract

## Scales with

- active entity count
- descriptor count
- patch count

## Telemetry

- frameMs
- tickMs
- descriptorCount
- activeCount

## Budget inputs

- `performance-budget-kit`

## Budget outputs

- quality tier hint
- descriptor count
- active simulation count

## Degradation modes

- reduce active radius
- lower LOD
- sleep far entities
- cap descriptors
- defer expensive decoration

## Target profiles

```json
{
  "targetFps": 60,
  "maxDescriptors": 1000,
  "maxFullSimEntities": 32,
  "maxMemoryMb": 1024
}
```

## Notes

The kit may publish budget descriptors or telemetry, but renderer adapters own actual draw quality changes.
