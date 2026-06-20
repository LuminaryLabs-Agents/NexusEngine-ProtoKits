# configurable-render-layer-kit

`configurable-render-layer-kit` is the core visual style designation Domain Service Kit.

It lets objects, layers, regions, modes, scenes, and parallax depths declare simple style designations. The kit resolves those designations into renderer-ready visual style descriptors.

## Domain boundary

```txt
configurable render layer
  = render-layer style profiles, designation rules, inheritance, resolution, validation, and debug inspection.
```

## Internal service breakdown

```txt
configurable-render-layer-kit
├─ ProfileService
├─ DesignationService
├─ ResolverService
├─ InheritanceService
├─ MaterialStyleService
├─ FogStyleService
├─ LightStyleService
├─ MotionStyleService
├─ ReadabilityService
├─ TransitionService
├─ ValidationService
└─ DebugService
```

These are internal services, not separate physical kits.

## Public API

```js
engine.configurableRenderLayers.configure(config);
engine.configurableRenderLayers.registerProfile(profile);
engine.configurableRenderLayers.designate({ when: { mode: "falling" }, style: "danger-fall", priority: 80 });
engine.configurableRenderLayers.setActiveRegion("summit");
engine.configurableRenderLayers.setActiveMode("falling");
engine.configurableRenderLayers.resolve(target);
engine.configurableRenderLayers.getResolvedLayers();
engine.configurableRenderLayers.getDebugReport();
```

## Renderer boundary

This kit does not draw. It resolves visual meaning into descriptors for renderers to consume.
