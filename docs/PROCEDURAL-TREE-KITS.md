# Procedural Tree Kits

The family separates deterministic tree meaning from renderer implementation.

```txt
seed + preset
-> nexus-tree-descriptor/1
-> nexus-tree-pbr-fields/1
-> nexus-tree-lod/1
-> nexus-tree-asset/1
-> optional Three.js render asset and impostor atlas
```

The headless kits can be tested in Node. The Three.js adapter is the only module allowed to own GPU objects, Canvas surfaces, render targets, or billboard capture.