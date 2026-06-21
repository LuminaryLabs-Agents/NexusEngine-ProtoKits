# Time Of Day Kit

Deterministic cycle phase, daylight amount, and sun/moon direction descriptors.

## Services

- `engine.timeOfDay.describe()`
- `engine.timeOfDay.setTime(value)`
- `engine.timeOfDay.step(dt)`
- `engine.timeOfDay.snapshot()`

## Provides

- `time:day-night`
- `time:phase-descriptor`

## Boundary

This kit does not render sky, lights, or shaders. Renderers consume the descriptors.
