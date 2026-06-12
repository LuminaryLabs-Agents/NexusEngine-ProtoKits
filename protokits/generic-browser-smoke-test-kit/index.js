import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_BROWSER_SMOKE_TEST_KIT_VERSION = "0.1.0";
export const GENERIC_BROWSER_SMOKE_TEST_KIT_DEFINITION = Object.freeze({ id: "generic-browser-smoke-test-kit", camelName: "genericBrowserSmokeTestKit", engineKey: "genericBrowserSmokeTest", category: "reliability-testing", tier: "atomic", provides: ["test:browser-smoke"], requires: ["diagnostics:health-report"], purpose: "Browser smoke-test slot for launching, waiting for frames, checking errors, and capturing screenshots." });
export function createGenericBrowserSmokeTestKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_BROWSER_SMOKE_TEST_KIT_DEFINITION, config); }
export default createGenericBrowserSmokeTestKit;
