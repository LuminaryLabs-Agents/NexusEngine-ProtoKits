# Domain Foundation ProtoKits

`protokits/domain-foundation/` provides the first shared domain-kit foundation for high-fidelity NexusRealtime experiments. The kits are runtime-kit compatible factories: they accept a `NexusRealtime` dependency object, define resources/events/systems with injected helpers, declare `requires` / `provides` tokens, install small public engine APIs, and keep reusable logic renderer-independent.

## Included factories

- `createTimedPressureDirectorKit`
- `createZoneFieldKit`
- `createScanSurveyKit`
- `createRouteCheckpointKit`
- `createCargoDeliveryKit`
- `createAgentGroupKit`
- `createResourcePressureKit`
- `createHazardDirectorKit`
- `createContentPresetKit`
- `createVisualFidelityMakerKit`
- `createAudioEventFeedbackMakerKit`
- `createCameraCinematicMakerKit`
- `createScenarioQaHarness`
- `createDeterministicReplayHarness`
- `createGamehostStandardKit`
- `createTokenRegistryKit`
- `createFoglineSurveyPressureBridgeKit`
- `createDomainFoundationKits`

## Import

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createTimedPressureDirectorKit,
  createZoneFieldKit,
  createScanSurveyKit,
  createFoglineSurveyPressureBridgeKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/domain-kits/index.js";

const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createTimedPressureDirectorKit(NexusRealtime),
    createZoneFieldKit(NexusRealtime),
    createScanSurveyKit(NexusRealtime),
    createFoglineSurveyPressureBridgeKit(NexusRealtime)
  ]
});
```

## Runtime rules

These kits should stay deterministic and headless:

- no DOM, Canvas, Three.js, browser globals, `fetch`, `localStorage`, `Date.now`, or unseeded `Math.random`
- public APIs emit command events and return current state
- systems consume commands on tick, write serializable resources, and emit transition/fact events
- each kit exposes `getState()`, `getSnapshot()`, and `reset()` where relevant
- renderer hosts read snapshots/descriptors only

## Token model

Representative tokens:

```txt
pressure:timed
zone:field
scan:survey
route:checkpoints
cargo:delivery
agent:groups
pressure:resource
hazard:director
content:presets
maker:visual-fidelity
maker:audio-event-feedback
maker:camera-cinematic
qa:scenario
qa:replay
qa:gamehost-standard
tooling:tokens
bridge:fogline-survey-pressure
```

## Fogline-derived survey-pressure bridge

`createFoglineSurveyPressureBridgeKit` is intentionally not generic simulation. It is a bridge example that maps reusable scan, zone, and pressure facts into a Fogline-style relay loop:

```txt
scanSurvey.completed       -> foglineSurveyPressure.relayCompleted
zoneField.thresholdReached -> foglineSurveyPressure.failed
timedPressure.expired      -> foglineSurveyPressure.failed
```

Use this pattern for experiment-specific bridges: generic kits own reusable state; bridge kits own game-specific mapping.

## Promotion notes

These are first-pass ProtoKits. They should remain in `NexusRealtime-ProtoKits` until multiple experiments prove the API surfaces, event names, reset behavior, replay behavior, and token contracts are stable.
