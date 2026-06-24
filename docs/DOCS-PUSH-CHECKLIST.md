# Documentation Push Checklist

Use this checklist before pushing documentation-focused changes to `main`.

```txt
[ ] Update CHANGELOG.md.
[ ] Update docs/CHANGELOG-2026-06-DSK-COMPOSITION-UPGRADE.md if the composition story changed.
[ ] Update docs/README.md.
[ ] Update docs/IMPLEMENTATION-NARRATIVE.md if reasoning changed.
[ ] Update docs/DOCUMENTATION-BACKLOG.md.
[ ] Update docs/PROTOKIT-INVENTORY.md or note why it was not regenerated.
[ ] Add or update family overview docs.
[ ] Add or update composition kit READMEs.
[ ] Add or update compatibility notes.
[ ] Run npm run check:syntax.
[ ] Run npm run check:manifests.
[ ] Run npm test.
[ ] Run npm run check.
[ ] Verify no existing export path was removed.
[ ] Verify wildcard export remains.
[ ] Verify new docs do not claim unimplemented behavior.
[ ] Verify legacy undocumented kits warn instead of failing unless intentionally promoted.
```

## Push rule

Prefer small documentation batches that preserve source behavior. Do not combine broad documentation with runtime rewrites unless the runtime change is necessary for docs validation.
