# NexusEngine Architecture Rules

## Core

Core owns stable runtime, ECS, deterministic ticking, promoted DSK contracts, and mature reusable primitives.

## ProtoKits

ProtoKits owns reusable domain kits before they are stable enough for Core promotion. ProtoKits should prefer renderer-agnostic resources, events, snapshots, methods, descriptors, and DSK-style composition. Reusable kit implementation belongs here.

## Experiments

Experiments are thin hosts. They should compose Core + ProtoKits, keep game-specific data in presets/config, bridge browser input into kit APIs, tick the runtime, render snapshots/descriptors, and avoid owning reusable gameplay rules.

Experiments should be hardened toward a strong canonical portfolio of about 20 total experiments. This is a guiding target, not a brittle constraint. Merge overlapping routes and features when higher-level domains emerge.

## Expansion rule

When behavior appears in multiple experiments or is clearly generic, move it toward ProtoKits as a reusable domain boundary.

## Higher-domain rule

When combining existing domains, always ask whether a higher-level domain exists above them. Prefer cumulative domain expansion over one-off feature accretion.

## Pruning rule

Do not preserve V1/V2/V3 route sprawl. Fold successful variants into canonical base routes.

## Testing rule

Every meaningful kit and domain boundary should move toward headless tick smoke tests and deterministic replay.
