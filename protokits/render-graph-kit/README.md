# Render Graph Kit

Owns backend-neutral render pass descriptors.

It describes pass order such as depth, opaque, terrain, vegetation, water, particles, lighting, fog, postprocess, and UI composite. Canvas, WebGL, and WebGPU adapters decide how much of the graph they can honor.
