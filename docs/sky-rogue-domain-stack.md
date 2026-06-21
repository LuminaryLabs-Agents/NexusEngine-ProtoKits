# Sky Rogue Domain Stack

Sky Rogue should be composed from domain kits instead of implemented as one HTML update loop.

## Target split

Runtime:
- NexusRealtime tick, events, resources, kit install order.

Domain kits:
- canyon terrain sampling
- flight corridor and safe altitude
- powered aerial flight
- vegetation placement
- procedural object descriptors
- projectile simulation
- combat rules
- encounter director
- camera rig descriptors
- mission sequence state

Renderer host:
- Three.js setup
- input adapter
- mesh/material pools
- HUD binding
- error panel
- GameHost debug bridge

## Result

The HTML hosts the game. It does not own the game.
