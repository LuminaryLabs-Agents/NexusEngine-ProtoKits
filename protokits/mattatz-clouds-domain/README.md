# Mattatz Clouds Domain

Renderer-agnostic ProtoKit domain for cloud composition inspired by `mattatz/THREE.Cloud`.

The original repository is a useful seed because it models a cloud as a box-bounded, raytraced/fractal-noise volume. This domain keeps that idea as a render descriptor instead of importing Three.js directly. Runtime kits own cloud intent, weather state, density, altitude, drift, and LOD policy. Renderer hosts decide how to execute those descriptors with Three.js, WebGPU, impostors, shader planes, or another adapter.

## Domain meaning

```txt
mattatz-clouds-domain
-> cloud primitive descriptors
-> altitude layer composition
-> weather preset composition
-> cumulonimbus/storm tower intent
-> cloud lighting and wind intent
-> cloud LOD policy
-> renderer adapter contract
```

This is not a scene demo and it is not a hardcoded sky. It is a reusable cloud/weather rendering domain that scenes can consume.

## NexusEngine base it extends

This domain extends the ProtoKit rendering-descriptor pattern:

- deterministic state
- renderer-agnostic resources
- installable runtime kit API
- snapshot/reset support
- render contract output
- no DOM, Canvas, Three.js, WebGL, `Date.now`, or unseeded randomness in the kit itself

## Included kits

```txt
mattatz-clouds-domain
├─ mattatz-cloud-core-kit
├─ mattatz-cloud-layer-kit
├─ mattatz-cloud-weather-kit
├─ mattatz-cumulonimbus-kit
├─ mattatz-cloud-lighting-kit
└─ mattatz-cloud-lod-kit
```

## Kit responsibilities

### `mattatz-cloud-core-kit`

Owns the base cloud primitive descriptor:

- volume bounds
- density
- softness
- opacity
- raymarch policy
- noise seed
- scattering coefficients
- adapter hint for a `THREE.Cloud`-style box volume

### `mattatz-cloud-layer-kit`

Owns altitude-layer composition:

- low cloud layer
- mid cloud layer
- high cloud layer
- layer height and thickness
- layer coverage
- deterministic 1-20 total cloud placement
- altitude-specific drift

### `mattatz-cloud-weather-kit`

Owns named weather presets:

- `clear`
- `scattered`
- `overcast`
- `storm-front`
- `mountain-fog`
- `sunrise-haze`
- `high-windy-sky`

### `mattatz-cumulonimbus-kit`

Owns storm-tower intent:

- vertical stacked tower descriptors
- dark underside
- anvil cap
- dense core
- optional rain shaft and lightning hook descriptors

### `mattatz-cloud-lighting-kit`

Owns lighting intent:

- sun direction
- rim light
- silver lining
- sunset tint
- underside darkness
- atmospheric fade

### `mattatz-cloud-lod-kit`

Owns cloud performance policy:

- near volumetric descriptors
- mid reduced-step descriptors
- far impostor/card descriptors
- horizon cloud band descriptors
- stable cloud pooling contract

## Public API

```js
import {
  createMattatzCloudsDomainKit,
  createMattatzCloudRenderContract,
  createMattatzCloudsState
} from "@luminarylabs/nexusengine-protokits/mattatz-clouds-domain";
```

Installed engine API:

```txt
engine.mattatzClouds.getState()
engine.mattatzClouds.snapshot()
engine.mattatzClouds.reset()
engine.mattatzClouds.setWeather(name)
engine.mattatzClouds.setCloudCount(count)
engine.mattatzClouds.setWind(wind)
engine.mattatzClouds.setSun(sun)
engine.mattatzClouds.getRenderContract(time)
engine.mattatzClouds.validate()
```

## Composition rules

- Cloud kits output descriptors, not renderer objects.
- Renderer adapters may implement the descriptors with `THREE.Cloud`, shader boxes, cards, impostors, or WebGPU volumes.
- Weather presets configure kits; they do not become game-specific logic.
- Cumulonimbus is separate from layer clouds because it needs vertical structure and storm hooks.
- Cloud shadows start as descriptor/fake-mask policy, not expensive realtime volumetric shadow maps.
- A flight game may own camera and terrain; this domain owns cloud sky intent only.

## Loop policy

```txt
install kit
-> seed state
-> choose weather preset
-> generate deterministic cloud descriptors
-> renderer adapter consumes render contract
-> tick updates time externally
-> snapshot remains deterministic
```

The domain does not own the game loop. It accepts explicit time from the host or reads the Nexus clock when installed.

## Promotion path

```txt
ProtoKit descriptor domain
-> renderer adapter proof in Experiments
-> smoke validation for state/snapshot/render contract
-> Domain Service Module candidate
-> Domain Service Kit candidate
-> stable NexusEngine rendering/weather capability
```

## Status

Prototype domain folder. Ready for renderer-host composition and HTML/Three.js experiment adapters.