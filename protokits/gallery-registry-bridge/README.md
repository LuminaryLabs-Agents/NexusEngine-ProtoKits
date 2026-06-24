# gallery-registry-bridge

## Domain

Compatibility bridge from gallery route entries to deploy manifests.

## Purpose

This bridge converts existing gallery/app route metadata into the new deploy manifest shape without replacing the current gallery generator or routes.

## Kit type

Bridge kit / compatibility helper.

## Public API

- `convertGalleryAppToDeployManifest(app)`
- `convertGalleryAppsToDeployManifests(apps)`
- `createGalleryRegistryBridge(apps)`

## Input shape

Existing gallery entries may include `id`, `title`, `displayTitle`, `kind`, `route`, `tab`, `kitStack`, `controls`, `tags`, `source`, and `smokeActions`.

## Output shape

A normalized deploy manifest using `deploy-manifest-kit`.

## Renderer boundary

No runtime or renderer ownership. This bridge only converts metadata.

## Promotion status

Experimental compatibility bridge.
