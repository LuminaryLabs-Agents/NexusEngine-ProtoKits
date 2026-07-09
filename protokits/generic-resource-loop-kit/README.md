# generic-resource-loop-kit

Generic deterministic resource meters for NexusEngine hosts.

The kit owns reusable resource state: value, min/max, passive rate, lock state, empty/full flags, threshold crossings, recent changes, and reset. It does not know game names, branded routes, DOM, Canvas, Three.js, or app copy.

Use it for stamina, oxygen, oil, charge, hull, ink, tether tension, corruption, debt, or similar meters that should stay out of renderer callbacks.
