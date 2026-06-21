# Domain Kit Fit Audit — Aerial Canyon

## Reuse

- `foundation-kit` for seeded randomness and kit wrapper helpers.
- `biome-field-kit` for biome identity and placement rules.
- `vegetation-archetype-kit` for species tables.
- `ground-contact-kit` for slope/terrain seating.
- `vegetation-lod-kit` for near/mid/far/cull policy.
- `render-culling-system-kit`, `lod-selection-system-kit`, and `instance-batching-system-kit` for future renderer descriptor planning.

## Upgrade / add

- Add direct aerial canyon terrain/corridor/flight/combat/camera/mission kits.
- Keep renderer-specific Three.js mesh pooling in the host or a renderer adapter kit.
- Do not reintroduce self-contained gameplay kits inside HTML.
