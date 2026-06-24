import { assert } from "./aaa-domain-spine-smoke-harness.mjs";
import { SCENARIO_QA_HARNESS_VERSION, createScenarioQaHarness } from "../protokits/scenario-qa-harness/index.js";

assert.equal(SCENARIO_QA_HARNESS_VERSION, "0.2.0", "scenario QA harness version is exported");
assert.equal(typeof createScenarioQaHarness, "function", "scenario QA harness factory is exported");
