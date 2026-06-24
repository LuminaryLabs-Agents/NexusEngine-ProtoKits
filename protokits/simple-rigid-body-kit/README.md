# Simple Rigid Body Kit

Descriptor-first kit for deterministic demo physics.

Responsibilities:

- body mass and collider descriptors
- velocity and impulse descriptors
- floor collision intent
- friction and restitution parameters
- release impulse integration for grabbable objects

The host may run a native physics backend later, but this kit owns the domain contract for movable objects.
