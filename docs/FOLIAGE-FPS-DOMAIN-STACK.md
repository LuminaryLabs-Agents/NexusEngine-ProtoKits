# Foliage FPS Domain Stack

This stack moves reusable procedural and Objaverse-derived foliage FPS behavior into ProtoKits while leaving browser rendering in NexusEngine Experiments.

## Implemented domains

- async and Objaverse loading foundation
- object family registry
- object variant selection
- object LOD policy
- object material variation
- object grounding profiles
- semantic object mesh requests
- object residency and readiness state
- wind field
- wind response
- time of day
- procedural skybox descriptors
- procedural cloud layer descriptors
- first-person motion descriptors
- footstep feedback events
- camera shake descriptors
- vegetation density samples
- vegetation placement descriptors
- foliage impostor descriptors
- foliage batch descriptors
- procedural foliage composition entry point

## Renderer boundary

ProtoKits emit data, requests, readiness, and descriptors. Experiments own Three.js, Canvas, GLTFLoader, pointer lock, audio output, and the frame loop.

## Objaverse object flow

```txt
SharedAssets manifest
  -> objaverse-catalog-kit
  -> object-family-kit
  -> object-variant-selection-kit
  -> vegetation-placement-kit
  -> object-lod-policy-kit
  -> object-mesh-request-kit
  -> experiment GLTF loader adapter
  -> object-residency-kit / objaverse-mesh-cache-kit
  -> foliage-batch-descriptor-kit
  -> experiment renderer adapter
```

## Fallback rule

A renderer should draw a real object when `objectResidency.isReady(assetId, lod)` is true. Otherwise it should draw a procedural fallback descriptor. A world should not blank while assets stream.

## Next step

Add `experiments/procedural-foliage-fps/` in NexusEngine-Experiments, import the composition kit from the ProtoKits CDN, and connect a GLTF loader adapter to object mesh requests.
