# project-batch-deploy-bridge

## Domain

Compatibility bridge from project batch specs to deploy manifests.

## Purpose

This bridge converts existing project batch registry entries into the deploy manifest shape without rewriting current routes or generated project hosts.

## Kit type

Bridge kit / compatibility helper.

## Public API

- `convertProjectBatchItemToDeployManifest(project)`
- `convertProjectBatchToDeployManifests(projects)`
- `createProjectBatchDeployBridge(projects)`

## Input shape

Project batch items may include `id`, `title`, `route`, `fantasy`, `verb`, `pressureLoop`, `visualIdentity`, `controls`, `kitStack`, `palette`, `entities`, `sequences`, `assetPacks`, and performance metadata.

## Output shape

A normalized deploy manifest using `deploy-manifest-kit`.

## Renderer boundary

No runtime or renderer ownership. This bridge only converts metadata.

## Compatibility

The legacy `aaa-batch-deploy-bridge` path remains available as a deprecated alias for existing consumers.

## Promotion status

Experimental compatibility bridge.
