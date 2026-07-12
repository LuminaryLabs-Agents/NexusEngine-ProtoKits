# Agriculture Domain Cutover

Date: 2026-07-12

## Goal

Create one service-driven Agriculture DSK under the non-executable `n:production` catalog family, prove it in two configurations, and prepare exact promotion into NexusEngine-Kits.

## Implemented

- Added `protokits/agriculture-domain-kit`.
- Domain path: `n:production:agriculture`.
- Services: land, soil, cultivation, water, growth, harvest, perennials, descriptors, snapshot, reset.
- Kept inventory, weather, calendar, wild resources, rendering, and persistence transport outside the boundary.
- Added tropical continuous-time and temperate day-resolved configurations.
- Added annual and perennial crop behavior.
- Added deterministic replay, snapshot round-trip, and duplicate-operation tests.
- Added a dedicated GitHub Actions validation workflow.

## Promotion decision

`agriculture-domain-kit` is approved for exact behavior promotion into `LuminaryLabs-Dev/NexusEngine-Kits` after this ProtoKit commit. The stable kit must preserve the same public API and tests and remain renderer-agnostic.

## Next ledge

Promote the exact implementation, then replace MyCozyIsland's product-specific farming DSK with tropical Agriculture configuration and an inventory transaction adapter.
