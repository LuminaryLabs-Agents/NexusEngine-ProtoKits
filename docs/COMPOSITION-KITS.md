# Composition Kits

This document summarizes the additive composition layer introduced by the master upgrade pass.

## Purpose

Composition kits make multi-scene and multi-app experiences configurable without moving gameplay rules into hosts or one-off routes.

## New kits

```txt
domain-boundary-kit
  reusable API/resource/event/snapshot/descriptors boundary metadata

deploy-manifest-kit
  normalize and validate scene/app deploy manifests

deploy-registry-kit
  register manifests, list scenes/apps, resolve kit stacks and asset pack references

asset-pack-manifest-kit
  describe lazy-loadable asset groups without loading assets

scene-lifecycle-kit
  scene load/enter/pause/resume/exit/dispose state

scene-transition-kit
  transition/preload requests and completion state

scene-graph-domain-kit
  general scene object graph, transforms, capabilities, dirty patches

save-delta-kit
  delta-only scene persistence and merge helpers

host-shell-contract-kit
  host/HUD/frame/error/restart/debug contract descriptors

session-facade-kit
  small host-facing dispatch/snapshot/restart/smoke/validation API

kit-registry
  pure helper registry for machine-readable kit manifests

aaa-batch-deploy-bridge
  compatibility bridge from existing AAA batch specs to deploy manifests

gallery-registry-bridge
  compatibility bridge from gallery route entries to deploy manifests

generated-route-host-bridge
  compatibility bridge from generated route hosts to host-shell contracts
```

## Composition rule

```txt
Host -> contract descriptors
Deploy registry -> selected app/scene manifests
Scene lifecycle -> current scene state
Domain kits -> reusable gameplay/simulation
Scene graph -> scene objects and patches
Save delta -> changed state only
Renderer adapter -> presentation
```

## Compatibility rule

The new layer does not replace existing routes. Existing experiments may opt in through bridges while current route files continue to work.
