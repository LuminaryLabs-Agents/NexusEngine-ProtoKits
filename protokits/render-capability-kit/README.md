# Render Capability Kit

Owns browser/device capability state for adaptive rendering.

It records Canvas, WebGL, WebGL2, WebGPU, instancing, texture, memory, DPR, and fallback information, then selects a safe profile.

This does not render anything. It only tells the visual stack what the current host can afford.
