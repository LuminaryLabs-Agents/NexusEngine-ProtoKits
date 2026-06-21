# Foliage FPS Domain Stack

This stack moves reusable procedural foliage FPS behavior into ProtoKits while leaving browser rendering in NexusRealtime Experiments.

## Implemented domains

- async and Objaverse loading foundation
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
- procedural foliage composition entry point

## Renderer boundary

ProtoKits emit data and descriptors. Experiments own Three.js, Canvas, pointer lock, audio output, and the frame loop.

## Flow

```txt
async-domain-load-kit
  -> objaverse-catalog-kit
  -> terrain/world/biome kits
  -> vegetation-density-field-kit
  -> vegetation-placement-kit
  -> wind-field-kit + wind-response-kit
  -> foliage-batch-descriptor-kit / foliage-impostor-kit
  -> experiment renderer adapter
```

## Next step

Add `experiments/procedural-foliage-fps/` in NexusRealtime-Experiments and import the composition kit from the ProtoKits CDN.
