import assert from "node:assert/strict";
import { createGenericParticleBackgroundKit, createParticleBackgroundDescriptor, particleBackgroundPresets } from "../index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); }, clearAllEvents() { events.clear(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); world.clearAllEvents(); return world; } }; for (const kit of kits) { kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(entry); kit.install?.({ engine, world, kit }); } return engine; }

const descriptor = createParticleBackgroundDescriptor({ preset: "nexusGallery" });
assert.equal(descriptor.presetId, particleBackgroundPresets.nexusGallery.id);
assert.ok(descriptor.layers.length >= 2);
assert.ok(descriptor.uniforms.totalParticles > 0);

const engine = createEngine([createGenericParticleBackgroundKit(Nexus, { preset: "starfield" })]);
assert.equal(engine.particleBackground.getDescriptor().presetId, "starfield");
engine.particleBackground.setPreset("fogDust");
engine.tick(1 / 60);
assert.equal(engine.particleBackground.getDescriptor().presetId, "fog-dust");
engine.particleBackground.setEnabled(false);
engine.particleBackground.pulse({ id: "hit", intensity: 2, duration: 0.5, color: [1, 0.5, 0.25] });
engine.tick(1 / 60);
assert.equal(engine.particleBackground.getDescriptor().enabled, false);
assert.equal(engine.particleBackground.getState().pulses.length, 1);
assert.deepEqual(JSON.parse(JSON.stringify(engine.particleBackground.getState())), engine.particleBackground.getState());
console.log("generic particle background kit tests passed");
