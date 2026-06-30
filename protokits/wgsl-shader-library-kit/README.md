# WGSL Shader Library Kit

`wgsl-shader-library-kit` stores inline WGSL shader descriptors and validation utilities. It validates source presence, entrypoint names, and `@group/@binding` descriptor coverage.

It does not create a GPU device. `webgpu-render-kit` and browser hosts own device/canvas behavior.
