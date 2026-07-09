# Stereoscopic Render Domain Kit

## Purpose

`stereoscopic-render-domain-kit` is the first XR rendering ProtoKit for converting a host camera or headset pose into deterministic left/right eye render descriptors.

It is deliberately renderer-agnostic.

It does **not** create:

```txt
XRSession
XrSession
XRFrame
XrSwapchain
WebGL framebuffer
Vulkan image
Three.js camera
Canvas object
DOM node
```

It only owns the stereo view state that a WebXR, OpenXR, Three.js, WebGL, Vulkan, or native renderer can consume.

## Boundary

```txt
Input:
  host camera snapshot
  or normalized headset pose

Kit-owned output:
  left eye descriptor
  right eye descriptor
  IPD offset
  viewport layout
  projection center offset
  render target layer descriptor
  stereo debug metadata

Host-owned output:
  real XR session
  real swapchain
  real projection matrix
  real draw calls
  real submit/present
```

## Import

```js
import { createStereoscopicRenderDomainKit } from "@luminarylabs/nexusengine-protokits/stereoscopic-render-domain-kit";
```

CDN:

```js
import { createStereoscopicRenderDomainKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/stereoscopic-render-domain-kit/index.js";
```

## Install

```js
const engine = NexusEngine.createRealtimeGame({
  kits: [
    createStereoscopicRenderDomainKit(NexusEngine, {
      interpupillaryDistance: 0.064,
      fovDegrees: 70,
      near: 0.05,
      far: 1000,
      textureLayout: "array-layer"
    })
  ]
});
```

## Public Engine API

```js
engine.stereoscopicRender.updateFromCamera(camera, dt, config);
engine.stereoscopicRender.submitHeadPose(pose, dt);
engine.stereoscopicRender.configure(config);
engine.stereoscopicRender.getState();
engine.stereoscopicRender.getStereoSnapshot();
engine.stereoscopicRender.reset();
```

## Camera Input Shape

```js
engine.stereoscopicRender.updateFromCamera({
  position: { x: 0, y: 1.6, z: 0 },
  forward: { x: 0, y: 0, z: -1 },
  up: { x: 0, y: 1, z: 0 },
  fovDegrees: 70,
  aspect: 1,
  near: 0.05,
  far: 1000,
  referenceSpace: "local-floor"
});
```

It also accepts camera snapshots that expose `lookAt` instead of `forward`.

## State Output Shape

```js
{
  status: "stereo-ready",
  headset: {
    position,
    forward,
    right,
    up
  },
  eyes: {
    left: {
      position,
      orientation,
      projection,
      viewport,
      renderTarget
    },
    right: {
      position,
      orientation,
      projection,
      viewport,
      renderTarget
    }
  },
  views: [left, right]
}
```

## Resources

```txt
stereoscopicRender.state
```

## Events

```txt
stereoscopicRender.requested
stereoscopicRender.updated
stereoscopicRender.configured
```

## Provides

```txt
render:stereoscopic-views
xr:stereo-render-state
xr:eye-view-descriptors
```

## Requires

```txt
camera:state
```

A host may satisfy this with an existing camera kit, a WebXR pose adapter, or an OpenXR bridge.

## Recommended Composition

```txt
xr-session-adapter-kit
  owns XR session lifecycle descriptors

xr-swapchain-adapter-kit
  owns swapchain/image descriptors

stereoscopic-render-domain-kit
  owns left/right eye view descriptors

xr-frame-submit-adapter-kit
  owns actual submit/present bridge
```

## Headless Tests

The helper `computeStereoscopicRenderSnapshot()` can run without DOM, Canvas, WebXR, OpenXR, Three.js, or a browser.

## Known Limitations

```txt
No real XR runtime session.
No real swapchain allocation.
No real projection matrix generation.
No platform-specific late latching.
No renderer object mutation.
```

Those belong in separate adapter/system kits.

## Promotion Criteria

Promote only after:

```txt
left/right descriptor contract is stable
WebXR host consumes it
OpenXR/native host consumes it
headless tests cover descriptor invariants
renderer hosts prove it without kit changes
swapchain/session concerns remain outside the kit
```
