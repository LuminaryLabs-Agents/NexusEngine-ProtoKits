# Wind Response Kit

Renderer-agnostic wind response descriptors for foliage, clouds, and secondary motion.

## Domain

Converts a world wind sample into bend, twist, flutter, and drift descriptors.

## Services

- `engine.windResponse.foliage(instance, partName, context)`
- `engine.windResponse.cloud(cloudDescriptor, context)`
- `engine.windResponse.batch(instances, context)`
- `engine.windResponse.snapshot()`

## Provides

- `vegetation:wind-response`
- `secondary:wind-response`
- `render:foliage-animation-descriptors`
- `cloud:wind-response`

## Requires

- `weather:wind-field`

## Limitations

This kit does not mutate meshes, write shader uniforms, or own renderer objects.
