# Objaverse Catalog Kit

Renderer-agnostic catalog for Objaverse-derived runtime assets.

This kit stores curated asset records and exposes query/pick services. It does not download Objaverse data, call `fetch`, parse meshes, or touch renderer objects.

## Services

```js
engine.objaverseCatalog.register(asset)
engine.objaverseCatalog.registerMany(assets)
engine.objaverseCatalog.get(id)
engine.objaverseCatalog.query({ kind, biome, tag, species })
engine.objaverseCatalog.pickWeighted(filter, seedOrRandom)
engine.objaverseCatalog.snapshot()
```

## Provides

```txt
objaverse:catalog
asset:catalog
objaverse:asset-query
asset:index-descriptors
```

Use this before placement/render kits so they can choose curated Objaverse-derived assets without the host owning asset-selection rules.
