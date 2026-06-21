# Objaverse Metadata Stream Kit

Bounded metadata-stream state for curated Objaverse-derived asset records.

This kit tracks requested metadata streams, chunks, cursors, records, and failures. The host or deploy adapter performs network work and appends chunks to the kit.

## Services

- `engine.objaverseMetadataStream.requestStream({ source })`
- `engine.objaverseMetadataStream.claimNext()`
- `engine.objaverseMetadataStream.appendChunk(streamId, { records, cursor })`
- `engine.objaverseMetadataStream.completeStream(streamId)`
- `engine.objaverseMetadataStream.failStream(streamId, error)`
- `engine.objaverseMetadataStream.listRecords()`
- `engine.objaverseMetadataStream.snapshot()`

## Provides

- `objaverse:metadata-stream`
- `metadata:streaming`
- `metadata:stream-metrics`
