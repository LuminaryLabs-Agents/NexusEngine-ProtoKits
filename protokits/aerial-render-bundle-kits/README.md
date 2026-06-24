# aerial-render-bundle-kits

## Family boundary

This README documents the aerial render bundle family boundary. Individual kit manifests and READMEs will follow.

## Purpose

Aerial render bundle kits coordinate renderer-agnostic render descriptors, visual buckets, camera-facing hints, and host-consumable aerial presentation data.

## Ownership

These kits may define render descriptor structure and visual intent. They should not create DOM, Canvas, WebGL, or Three.js objects directly unless explicitly implemented as renderer adapters.

## Documentation status

Family stub added. Needs source-level API extraction, descriptor inventory, performance contract, and host integration examples.
