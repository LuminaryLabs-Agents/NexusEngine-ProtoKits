# Objaverse Metadata Index Kit

Stores metadata records for curated Objaverse-derived assets.

It owns serializable records for source identifiers, tags, categories, bounds, metrics, and attribution data. It does not fetch metadata. Host/deploy adapters stream records into the kit.

## Services

```js
engine.objaverseMetadataIndex.register(record)
engine.objaverseMetadataIndex.registerMany(records)
engine.objaverseMetadataIndex.markStatus(assetId, status)
engine.objaverseMetadataIndex.get(assetId)
engine.objaverseMetadataIndex.query(filter)
engine.objaverseMetadataIndex.snapshot()
```

## Provides

```txt
objaverse:metadata-index
asset:metadata-index
asset:license-provenance
asset:metrics-index
```
