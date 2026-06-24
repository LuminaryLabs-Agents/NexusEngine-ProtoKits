# Domain Boundary Review Checklist

Use this checklist before merging a significant ProtoKit or promoting a domain boundary.

```txt
[ ] The kit owns exactly one reusable domain.
[ ] The kit name avoids game-specific branding unless it is a bridge, preset, demo, or deploy kit.
[ ] Requires/provides tokens are explicit.
[ ] Resources are documented.
[ ] Events are documented.
[ ] Public API is small.
[ ] State is serializable.
[ ] Reset/snapshot behavior is declared.
[ ] Renderer boundary is clean.
[ ] The kit avoids DOM, Canvas, Three.js, browser globals, asset loading, and requestAnimationFrame.
[ ] The kit outputs descriptors instead of renderer objects when presentation is needed.
[ ] Performance contract exists or is explicitly deferred.
[ ] Child kits are composed through public APIs only.
[ ] Headless tests exist or are explicitly deferred with a reason.
[ ] Known limitations and promotion criteria are documented.
```
