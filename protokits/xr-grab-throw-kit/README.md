# XR Grab Throw Kit

Descriptor-only kit for grabbable object behavior.

Responsibilities:

- declare grabbable objects
- define near and ray grab modes
- keep recent hand pose history
- emit hold and release descriptors
- request throw impulses
- request optional haptic feedback

The host streams normalized input frames. The kit decides what object is hovered, held, released, or thrown.
