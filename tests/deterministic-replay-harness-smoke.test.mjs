import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createDeterministicReplayHarness } from "../protokits/deterministic-replay-harness/index.js";

const { engine, world, kit } = installKit(createDeterministicReplayHarness, { seed: "mainline" });
const report = engine.deterministicReplay.verify({ id: "proof", spec: { kit: "demo" }, descriptor: { status: "ready" }, budget: { frame: 1 } });

assert.equal(report.ok, true, "same input replay verifies");
assert.equal(engine.deterministicReplay.latestReport().id, report.id, "latest report is stored");
assert.equal(world.getEvents(kit.events.ReplayRunRecorded).length, 2, "verify records two runs");
assert.equal(world.getEvents(kit.events.ReplayCompared).length, 1, "verify emits compare event");
