# NexusRealtime-ProtoKits Memory

## Purpose
NexusRealtime-ProtoKits provides reusable, branded-app-neutral Domain Service Kits for NexusRealtime hosts.

## Architecture
- ProtoKits should stay generic DSKs with reusable data contracts, resources, events, and descriptors.
- Branded app presets, copy, routes, and tuning belong in Experiments or app hosts, not ProtoKits.
- Branded bird-sim presets and branded bird-sim docs/examples are intentionally absent from ProtoKits.

## Conventions
- Keep aerial, terrain, render, actor, VFX, audio, and camera kits generic and composable.
- Do not add branded bird-sim data, preset exports, or app-specific objective/challenge logic here.
- Browser-only remote URL forwarder modules are skipped by the local Node import smoke; local ProtoKit index modules should still import cleanly.
- Flight drag in `flight-motion-kit` is time-step scaled so simulation behavior is not frame-rate dependent.
