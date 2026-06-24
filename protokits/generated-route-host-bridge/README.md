# generated-route-host-bridge

## Domain

Compatibility bridge from generated browser routes to host shell contracts.

## Purpose

This bridge represents generated route hosts as `host-shell-contract-kit` descriptors without rewriting current generated route files.

## Kit type

Bridge kit / compatibility helper.

## Public API

- `createGeneratedRouteHostBridge(config)`
- `bridge.describe(runtime)`
- `bridge.snapshot()`

## Renderer boundary

The bridge describes host responsibilities but does not create DOM nodes, canvases, renderers, or gameplay rules.

## Compatible kits

- `host-shell-contract-kit`
- `session-facade-kit`
- `deploy-registry-kit`

## Promotion status

Experimental compatibility bridge.
