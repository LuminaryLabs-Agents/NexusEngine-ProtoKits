# aaa-batch-deploy-bridge

## Domain

Compatibility bridge from AAA batch game specs to deploy manifests.

## Purpose

This bridge converts existing AAA batch registry entries into the new deploy manifest shape without rewriting the current experiment routes.

## Kit type

Bridge kit / compatibility helper.

## Public API

- `convertAaaBatchGameToDeployManifest(game)`
- `convertAaaBatchGamesToDeployManifests(games)`
- `createAaaBatchDeployBridge(games)`

## Input shape

Existing AAA batch specs may include `id`, `title`, `route`, `fantasy`, `verb`, `pressureLoop`, `visualIdentity`, `controls`, `kitStack`, `palette`, and `smoke`.

## Output shape

A normalized deploy manifest using `deploy-manifest-kit`.

## Renderer boundary

No runtime or renderer ownership. This bridge only converts metadata.

## Promotion status

Experimental compatibility bridge.
