# Object Residency Kit

Object mesh readiness, fallback, failure, and cache budget state.

Services: `markLoading`, `markReady`, `markFallback`, `markFailed`, `isReady`, `get`, `releaseCold`, `summarize`, and `snapshot`.

Provides: `object:residency` and `asset:object-cache-state`.

This kit tracks readiness only. Experiments perform GLB loading and renderer upload.
