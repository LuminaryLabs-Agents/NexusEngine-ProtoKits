export const DISK_WORLD_SURFACE_VERSION = "0.1.0";
export const DISK_WORLD_SURFACE_KIND = "bounded-disk";

const clone = (value) => value == null
  ? value
  : typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

function finite(value, fallback, label) {
  const next = Number(value ?? fallback);
  if (!Number.isFinite(next)) throw new TypeError(`${label} must be finite.`);
  return next;
}

function positive(value, fallback, label) {
  const next = finite(value, fallback, label);
  if (next <= 0) throw new RangeError(`${label} must be greater than zero.`);
  return next;
}

function nonNegative(value, fallback, label) {
  const next = finite(value, fallback, label);
  if (next < 0) throw new RangeError(`${label} must be zero or greater.`);
  return next;
}

function point2(value = {}, fallback = { x: 0, z: 0 }) {
  return {
    x: finite(value.x, fallback.x, "Disk world point x"),
    z: finite(value.z, fallback.z, "Disk world point z")
  };
}

function smoothstep(edge0, edge1, value) {
  if (edge1 <= edge0) return value >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function normalizeConfig(config = {}) {
  const radius = positive(config.radius, 1000, "Disk world radius");
  const edgeBlendWidth = nonNegative(config.edgeBlendWidth, Math.min(radius * 0.05, 500), "Disk world edge blend width");
  if (edgeBlendWidth > radius) throw new RangeError("Disk world edge blend width cannot exceed radius.");
  return {
    id: String(config.id ?? "disk-world").trim() || "disk-world",
    kind: DISK_WORLD_SURFACE_KIND,
    center: point2(config.center),
    radius,
    edgeBlendWidth
  };
}

function normalizeBounds(bounds = {}) {
  const minX = finite(bounds.minX ?? bounds.min?.x, 0, "Disk bounds minX");
  const maxX = finite(bounds.maxX ?? bounds.max?.x, 0, "Disk bounds maxX");
  const minZ = finite(bounds.minZ ?? bounds.min?.z, 0, "Disk bounds minZ");
  const maxZ = finite(bounds.maxZ ?? bounds.max?.z, 0, "Disk bounds maxZ");
  if (maxX < minX || maxZ < minZ) throw new RangeError("Disk bounds must be ordered.");
  return { minX, maxX, minZ, maxZ };
}

export function createDiskWorldSurface(config = {}) {
  const initial = normalizeConfig(config);
  let descriptor = initial;

  function distanceFromCenter(point) {
    const next = point2(point);
    return Math.hypot(next.x - descriptor.center.x, next.z - descriptor.center.z);
  }

  function distanceFromEdge(point) {
    return descriptor.radius - distanceFromCenter(point);
  }

  function contains(point, margin = 0) {
    const inset = nonNegative(margin, 0, "Disk world containment margin");
    return distanceFromCenter(point) <= Math.max(0, descriptor.radius - inset);
  }

  function edgeMask(point) {
    const edgeDistance = distanceFromEdge(point);
    if (descriptor.edgeBlendWidth === 0) return edgeDistance >= 0 ? 1 : 0;
    return smoothstep(0, descriptor.edgeBlendWidth, edgeDistance);
  }

  function worldToDisk(point) {
    const next = point2(point);
    const x = (next.x - descriptor.center.x) / descriptor.radius;
    const z = (next.z - descriptor.center.z) / descriptor.radius;
    const radialDistance = Math.hypot(x, z);
    return {
      x,
      z,
      radialDistance,
      inside: radialDistance <= 1,
      edgeMask: edgeMask(next)
    };
  }

  function diskToWorld(point) {
    const next = point2(point);
    return {
      x: descriptor.center.x + next.x * descriptor.radius,
      z: descriptor.center.z + next.z * descriptor.radius
    };
  }

  function clampPoint(point, margin = 0) {
    const next = point2(point);
    const inset = nonNegative(margin, 0, "Disk world clamp margin");
    const allowedRadius = Math.max(0, descriptor.radius - inset);
    const dx = next.x - descriptor.center.x;
    const dz = next.z - descriptor.center.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= allowedRadius || distance < 1e-9) return next;
    const scale = allowedRadius / distance;
    return {
      x: descriptor.center.x + dx * scale,
      z: descriptor.center.z + dz * scale
    };
  }

  function classifyBounds(bounds) {
    const box = normalizeBounds(bounds);
    const closestX = Math.max(box.minX, Math.min(descriptor.center.x, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(descriptor.center.z, box.maxZ));
    if (Math.hypot(closestX - descriptor.center.x, closestZ - descriptor.center.z) > descriptor.radius) {
      return "outside";
    }
    const corners = [
      { x: box.minX, z: box.minZ },
      { x: box.maxX, z: box.minZ },
      { x: box.minX, z: box.maxZ },
      { x: box.maxX, z: box.maxZ }
    ];
    return corners.every((corner) => contains(corner)) ? "inside" : "intersecting";
  }

  function intersectsBounds(bounds) {
    return classifyBounds(bounds) !== "outside";
  }

  function getSnapshot() {
    return {
      version: DISK_WORLD_SURFACE_VERSION,
      status: "ready",
      descriptor: clone(descriptor)
    };
  }

  function validate() {
    const issues = [];
    if (descriptor.kind !== DISK_WORLD_SURFACE_KIND) issues.push("kind must be bounded-disk");
    if (!(descriptor.radius > 0)) issues.push("radius must be greater than zero");
    if (descriptor.edgeBlendWidth < 0 || descriptor.edgeBlendWidth > descriptor.radius) {
      issues.push("edgeBlendWidth must be between zero and radius");
    }
    return { ok: issues.length === 0, issues, descriptor: clone(descriptor) };
  }

  function configure(nextConfig = {}) {
    descriptor = normalizeConfig({
      ...descriptor,
      ...nextConfig,
      center: { ...descriptor.center, ...(nextConfig.center ?? {}) }
    });
    return getSnapshot();
  }

  function loadSnapshot(snapshot) {
    if (!snapshot || snapshot.version !== DISK_WORLD_SURFACE_VERSION || snapshot.status !== "ready") {
      throw new TypeError("Unsupported disk world surface snapshot.");
    }
    descriptor = normalizeConfig(snapshot.descriptor);
    return getSnapshot();
  }

  function reset() {
    descriptor = initial;
    return getSnapshot();
  }

  return Object.freeze({
    getDescriptor: () => clone(descriptor),
    getState: getSnapshot,
    getSnapshot,
    configure,
    contains,
    distanceFromCenter,
    distanceFromEdge,
    edgeMask,
    worldToDisk,
    diskToWorld,
    clampPoint,
    classifyBounds,
    intersectsBounds,
    validate,
    loadSnapshot,
    reset
  });
}
