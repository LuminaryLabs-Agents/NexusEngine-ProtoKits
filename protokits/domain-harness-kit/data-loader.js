export function loadHarnessData(data) {
  if (!data || !Array.isArray(data.services)) throw new Error("Harness data must include a services array.");
  return data;
}
