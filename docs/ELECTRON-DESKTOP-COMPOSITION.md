# Electron Desktop Composition

Electron should be a thin host for NexusRealtime composition. It should not become a gameplay runtime.

## Desktop ownership split

```txt
Electron host
  owns windows, native menus, filesystem, auto-update, process boundaries, app settings

NexusRealtime runtime
  owns tick, resources, events, systems, kit installation, sequence execution

ProtoKit composition layer
  owns scene lifecycle, deploy registry, asset pack manifests, save deltas, performance contracts, session facades

Renderer adapter
  owns meshes, materials, cameras, audio playback, draw calls, GPU resources
```

## Boot sequence

```txt
1. Electron opens a BrowserWindow.
2. The renderer host installs a host-shell contract.
3. Deploy registry resolves the selected app/scene manifest.
4. Scene lifecycle enters the entry scene.
5. Asset-pack manifests identify lazy assets.
6. Domain kits run simulation.
7. Renderer adapter consumes descriptors.
8. Save-delta kit persists changed scene state.
```

## Rule

Do not put Electron, DOM, Canvas, Three.js, WebGPU, filesystem, or native menu ownership inside reusable domain kits. Keep those in the host or renderer adapter.
