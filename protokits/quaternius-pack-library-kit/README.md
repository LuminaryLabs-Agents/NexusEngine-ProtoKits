# Quaternius Pack Library Kit

`quaternius-pack-library-kit` is the corrected parent kit for Quaternius assets. It is not named `domain-*`; each child kit says what it actually does and ends with `-kit`.

The kit family covers pack catalog and source/license receipts, safe file indexing and runtime asset promotion, Universal Base Character recipes, hair/skin/eye/outfit/equipment choices, Universal Animation Library 1 and 2 semantic banks, rig profiles, retarget checks, root-motion policy, material atlas metadata, broader library descriptors, and Quaternius-specific WebGPU shader descriptors with inline WGSL.

## Runtime surfaces

```txt
engine.n.quaterniusPackLibrary
engine.n.quaterniusPackCatalog
engine.n.quaterniusLicenseReceipt
engine.n.quaterniusFileIndex
engine.n.quaterniusRuntimePromotion
engine.n.quaterniusBaseCharacter
engine.n.quaterniusCharacterCreator
engine.n.quaterniusOutfitBuilder
engine.n.quaterniusEquipmentBuilder
engine.n.quaterniusAnimationLibraryOne
engine.n.quaterniusAnimationLibraryTwo
engine.n.quaterniusAnimationClipIndex
engine.n.quaterniusAnimationBank
engine.n.quaterniusRigProfile
engine.n.quaterniusRigBinding
engine.n.quaterniusRetargetCheck
engine.n.quaterniusRootMotionPolicy
engine.n.quaterniusRealAssetPlaybackCheck
engine.n.quaterniusMaterialAtlas
engine.n.quaterniusPropLibrary
engine.n.quaterniusWorldPieceLibrary
engine.n.quaterniusCreatureLibrary
engine.n.quaterniusVehicleLibrary
engine.n.quaterniusWebgpuCharacterShader
engine.n.quaterniusWebgpuTerrainShader
```

## Boundary

This kit family does not own DOM, Canvas, Three.js, WebGPU device creation, GLB downloads, or binary assets. Browser hosts and import workers own those concerns. The reusable kits own descriptors, recipes, validation surfaces, and shader descriptors.
