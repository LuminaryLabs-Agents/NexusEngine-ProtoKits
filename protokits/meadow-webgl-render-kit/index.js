export const MEADOW_WEBGL_RENDER_KIT_VERSION = "0.1.0";

const TAU = Math.PI * 2;

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, number(value, min)));
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function hexToRgb(hex, fallback = "#ffffff") {
  const source = /^#[0-9a-f]{6}$/i.test(String(hex)) ? String(hex).slice(1) : String(fallback).slice(1);
  return [0, 2, 4].map((offset) => parseInt(source.slice(offset, offset + 2), 16) / 255);
}

function colorToRgb(value, fallback = "#ffffff") {
  if (String(value).startsWith("#")) return hexToRgb(value, fallback);
  const match = String(value ?? "").match(/rgba?\(([^)]+)\)/);
  if (!match) return hexToRgb(fallback);
  return match[1].split(",").slice(0, 3).map((part) => clamp(Number(part.trim()) / 255, 0, 1));
}

function v3(x = 0, y = 0, z = 0) {
  return [number(x), number(y), number(z)];
}

function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function mul(a, scalar) { return [a[0] * scalar, a[1] * scalar, a[2] * scalar]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

function normalize(value, fallback = [0, 1, 0]) {
  const len = Math.hypot(value[0], value[1], value[2]);
  return len > 0.000001 ? [value[0] / len, value[1] / len, value[2] / len] : fallback;
}

function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan((fov * Math.PI / 180) / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, (2 * far * near) * nf, 0];
}

function lookAt(eye, center, up) {
  const z = normalize(sub(eye, center), [0, 0, 1]);
  const x = normalize(cross(up, z), [1, 0, 0]);
  const y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 4; col += 1) for (let k = 0; k < 4; k += 1) out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
  return out;
}

function hashUnit(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

function createMesh() {
  const positions = [];
  const normals = [];
  const colors = [];
  const outlines = [];
  function vertex(p, normal, color, outline) { positions.push(...p); normals.push(...normal); colors.push(...color); outlines.push(outline); }
  function tri(a, b, c, color, outline = 1, normalsOverride = null) {
    const normal = normalize(cross(sub(b, a), sub(c, a)));
    vertex(a, normalsOverride?.[0] ?? normal, color, outline);
    vertex(b, normalsOverride?.[1] ?? normal, color, outline);
    vertex(c, normalsOverride?.[2] ?? normal, color, outline);
  }
  function quad(a, b, c, d, color, outline = 1, normalsOverride = null) {
    tri(a, b, c, color, outline, normalsOverride ? [normalsOverride[0], normalsOverride[1], normalsOverride[2]] : null);
    tri(a, c, d, color, outline, normalsOverride ? [normalsOverride[0], normalsOverride[2], normalsOverride[3]] : null);
  }
  function ellipsoid(cx, cy, cz, rx, ry, rz, color, segments = 16, outline = 1) {
    const rings = Math.max(4, Math.floor(segments / 2));
    for (let y = 0; y < rings; y += 1) {
      const v0 = y / rings * Math.PI;
      const v1 = (y + 1) / rings * Math.PI;
      for (let x = 0; x < segments; x += 1) {
        const u0 = x / segments * TAU;
        const u1 = (x + 1) / segments * TAU;
        const p = (u, v) => v3(cx + Math.cos(u) * Math.sin(v) * rx, cy + Math.cos(v) * ry, cz + Math.sin(u) * Math.sin(v) * rz);
        const n = (u, v) => normalize([Math.cos(u) * Math.sin(v) / Math.max(0.0001, rx), Math.cos(v) / Math.max(0.0001, ry), Math.sin(u) * Math.sin(v) / Math.max(0.0001, rz)]);
        quad(p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1), color, outline, [n(u0, v0), n(u1, v0), n(u1, v1), n(u0, v1)]);
      }
    }
  }
  function tubeBetween(a, b, radiusA, radiusB, color, segments = 12, outline = 1) {
    const start = Array.isArray(a) ? a : v3(a.x, a.y, a.z);
    const end = Array.isArray(b) ? b : v3(b.x, b.y, b.z);
    const axis = normalize(sub(end, start), [0, 1, 0]);
    const ref = Math.abs(axis[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
    const side = normalize(cross(axis, ref), [1, 0, 0]);
    const up = normalize(cross(side, axis), [0, 0, 1]);
    for (let i = 0; i < segments; i += 1) {
      const a0 = i / segments * TAU;
      const a1 = (i + 1) / segments * TAU;
      const radial0 = normalize(add(mul(side, Math.cos(a0)), mul(up, Math.sin(a0))), side);
      const radial1 = normalize(add(mul(side, Math.cos(a1)), mul(up, Math.sin(a1))), side);
      const p0 = add(start, mul(radial0, radiusA));
      const p1 = add(start, mul(radial1, radiusA));
      const p2 = add(end, mul(radial1, radiusB));
      const p3 = add(end, mul(radial0, radiusB));
      quad(p0, p1, p2, p3, color, outline, [radial0, radial1, radial1, radial0]);
    }
  }
  function pathRibbon(points, width, y, color, outline = 0.16) {
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len * width;
      const nz = dx / len * width;
      quad(v3(a.x - nx, y, a.z - nz), v3(a.x + nx, y, a.z + nz), v3(b.x + nx, y, b.z + nz), v3(b.x - nx, y, b.z - nz), color, outline, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
  }
  return { positions, normals, colors, outlines, tri, quad, ellipsoid, tubeBetween, pathRibbon };
}

function drawGround(mesh, plan) {
  const area = plan.area;
  const color = hexToRgb(plan.style.materials.grass.base);
  const x0 = area.anchor.x - area.width * 0.86;
  const x1 = area.anchor.x + area.width * 0.86;
  const z0 = area.anchor.z - area.depth * 0.72;
  const z1 = area.anchor.z + area.depth * 0.72;
  mesh.quad(v3(x0, area.anchor.y - 0.08, z1), v3(x1, area.anchor.y - 0.08, z1), v3(x1, area.anchor.y - 0.08, z0), v3(x0, area.anchor.y - 0.08, z0), color, 0, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
}

function drawAtmosphere(mesh, atmosphere, plan) {
  if (!atmosphere?.enabled) return;
  const area = plan.area;
  mesh.quad(v3(area.anchor.x - area.width, area.anchor.y - 0.02, area.anchor.z + area.depth * 0.35), v3(area.anchor.x + area.width, area.anchor.y - 0.02, area.anchor.z + area.depth * 0.35), v3(area.anchor.x + area.width, area.anchor.y + 3.2, area.anchor.z + area.depth * 0.62), v3(area.anchor.x - area.width, area.anchor.y + 3.2, area.anchor.z + area.depth * 0.62), colorToRgb(atmosphere.ground?.far, "#b4b978"), 0);
  for (const [index, hill] of (atmosphere.hills ?? []).entries()) {
    const y = area.anchor.y + 3 + (1 - number(hill.y, 0.4)) * 16;
    const color = colorToRgb(hill.color, "#7d8d62");
    const zNear = area.anchor.z + area.depth * (0.38 + index * 0.06);
    const zFar = area.anchor.z + area.depth * (0.58 + index * 0.07);
    const segments = 24;
    for (let segment = 0; segment < segments; segment += 1) {
      const x0 = area.anchor.x - area.width + segment / segments * area.width * 2;
      const x1 = area.anchor.x - area.width + (segment + 1) / segments * area.width * 2;
      const wave0 = Math.sin(segment * 0.82 + y) * 1.8 + Math.sin(segment * 0.31) * 0.9;
      const wave1 = Math.sin((segment + 1) * 0.82 + y) * 1.8 + Math.sin((segment + 1) * 0.31) * 0.9;
      mesh.quad(v3(x0, area.anchor.y - 0.03, zNear), v3(x1, area.anchor.y - 0.03, zNear), v3(x1, y * 0.62 + wave1, zFar), v3(x0, y * 0.62 + wave0, zFar), color, 0);
    }
  }
  const sun = atmosphere.sun;
  mesh.ellipsoid(sun.position.x, sun.position.y, sun.position.z, sun.radius, sun.radius, sun.radius * 0.22, colorToRgb(sun.color, "#ffd27a"), 18, 0);
  for (const cloud of atmosphere.clouds ?? []) {
    const cx = area.anchor.x + (number(cloud.x, 0.5) - 0.5) * area.width;
    const cy = area.anchor.y + 21 + (1 - number(cloud.y, 0.2)) * 16;
    const cz = area.anchor.z + area.depth * 0.55 + number(cloud.scale, 1) * 3;
    for (let i = 0; i < 4; i += 1) {
      const scale = number(cloud.scale, 1);
      mesh.ellipsoid(cx + (i - 1.5) * 2.4 * scale, cy + Math.sin(i) * 0.5, cz, 2.2 * scale, 0.72 * scale, 0.44 * scale, hexToRgb("#fff2ce"), 10, 0.08);
    }
  }
}

function drawPath(mesh, object, plan) {
  const mats = plan.style.materials.path;
  mesh.pathRibbon(object.points, object.width * 0.58, plan.area.anchor.y + 0.035, hexToRgb(mats.shade), 0.12);
  mesh.pathRibbon(object.points, object.width * 0.46, plan.area.anchor.y + 0.045, hexToRgb(mats.base), 0.08);
  for (let i = 0; i < object.pebbleCount; i += 1) {
    const t = hashUnit(`${plan.seed}:pebble:${i}`);
    const p = object.points[Math.floor(t * object.points.length)] ?? object.points[0];
    const x = p.x + (hashUnit(`${i}:x`) - 0.5) * object.width;
    const z = p.z + (hashUnit(`${i}:z`) - 0.5) * object.width * 1.6;
    const s = 0.045 + hashUnit(`${i}:s`) * 0.08;
    mesh.ellipsoid(x, plan.area.anchor.y + 0.09, z, s * 1.6, s * 0.65, s * 1.1, hexToRgb(plan.style.materials.rock.highlight), 8, 0.18);
  }
}

function drawGrass(mesh, object, plan) {
  const pos = object.position;
  const wind = plan.wind?.enabled ? number(plan.wind.strength, 0.3) : 0;
  const phase = hashUnit(object.id) * TAU;
  const sway = Math.sin(number(plan.time, 0) * 1.35 + phase) * wind * number(object.sway, 0.5);
  const angle = number(object.rotation, 0);
  const side = [Math.cos(angle) * object.width, 0, Math.sin(angle) * object.width];
  const bend = [Math.cos(angle + Math.PI / 2) * (number(object.lean, 0) + sway) * 0.38, 0, Math.sin(angle + Math.PI / 2) * (number(object.lean, 0) + sway) * 0.38];
  const base = v3(pos.x, pos.y, pos.z);
  const mid = add(base, [bend[0] * 0.38, object.height * 0.56, bend[2] * 0.38]);
  const tip = add(base, [bend[0], object.height, bend[2]]);
  const color = colorToRgb(object.color, plan.style.materials.grass.base);
  mesh.quad(sub(base, side), add(base, side), add(mid, mul(side, 0.58)), sub(mid, mul(side, 0.58)), color, 0.1);
  mesh.tri(sub(mid, mul(side, 0.58)), add(mid, mul(side, 0.58)), tip, color, 0.14);
}

function drawFlower(mesh, object, plan) {
  const p = object.position;
  const s = number(object.scale, 1) * 0.16;
  mesh.tubeBetween(v3(p.x, p.y, p.z), v3(p.x + Math.sin(object.rotation) * s * 0.25, p.y + s * 3.2, p.z + Math.cos(object.rotation) * s * 0.25), s * 0.12, s * 0.08, hexToRgb(plan.style.materials.grass.shade), 8, 0.25);
  const cy = p.y + s * 3.25;
  mesh.ellipsoid(p.x, cy, p.z, s * 0.28, s * 0.28, s * 0.28, colorToRgb(object.accent, plan.style.materials.flower.highlight), 10, 0.35);
  for (let i = 0; i < 6; i += 1) {
    const a = object.rotation + i / 6 * TAU;
    mesh.ellipsoid(p.x + Math.cos(a) * s * 0.58, cy, p.z + Math.sin(a) * s * 0.58, s * 0.42, s * 0.16, s * 0.24, colorToRgb(object.color, plan.style.materials.flower.base), 8, 0.35);
  }
}

function drawRock(mesh, object, plan) {
  const p = object.position;
  const s = number(object.scale, 1);
  mesh.ellipsoid(p.x, p.y + 0.18 * s, p.z, 0.62 * s, 0.3 * s, 0.44 * s, colorToRgb(object.color, plan.style.materials.rock.base), 14, 0.45);
  mesh.ellipsoid(p.x + 0.18 * s, p.y + 0.23 * s, p.z - 0.08 * s, 0.34 * s, 0.2 * s, 0.28 * s, colorToRgb(object.accent, plan.style.materials.rock.highlight), 10, 0.25);
}

function drawMushroom(mesh, object, plan) {
  const p = object.position;
  const s = number(object.scale, 1);
  mesh.tubeBetween(v3(p.x, p.y, p.z), v3(p.x, p.y + 0.58 * s, p.z), 0.08 * s, 0.11 * s, hexToRgb(plan.style.materials.mushroom.highlight), 10, 0.34);
  mesh.ellipsoid(p.x, p.y + 0.58 * s, p.z, 0.36 * s, 0.16 * s, 0.32 * s, colorToRgb(object.color, plan.style.materials.mushroom.base), 14, 0.5);
}

function drawTreeLineTree(mesh, object, plan) {
  const p = object.position;
  const s = number(object.scale, 1);
  mesh.tubeBetween(v3(p.x, p.y, p.z), v3(p.x, p.y + 2.3 * s, p.z), 0.14 * s, 0.1 * s, hexToRgb(plan.style.materials.bark.shade), 8, 0.34);
  mesh.ellipsoid(p.x, p.y + 3.1 * s, p.z, 1.1 * s, 1.9 * s, 0.9 * s, colorToRgb(object.color, plan.style.materials.leaf.shade), 10, 0.42);
}

function drawFocalTree(mesh, object, plan) {
  const p = object.position;
  const mats = plan.style.materials;
  const wind = plan.wind?.enabled ? number(plan.wind.strength, 0.3) * number(object.sway, 0.36) : 0;
  mesh.ellipsoid(p.x - 2.4, p.y + 0.02, p.z - 1.2, object.shadowRadius, 0.05, object.shadowRadius * 0.45, colorToRgb("rgba(24,27,14,.28)", "#1f2917"), 14, 0);
  mesh.tubeBetween(v3(p.x, p.y, p.z), v3(p.x, p.y + object.trunkHeight, p.z), object.trunkRadius, object.trunkRadius * 0.64, hexToRgb(mats.bark.base), 18, 0.75);
  for (let i = 0; i < object.rootCount; i += 1) {
    const a = i / object.rootCount * TAU;
    const end = v3(p.x + Math.cos(a) * (1.8 + hashUnit(`${object.id}:root:${i}`) * 1.5), p.y + 0.08, p.z + Math.sin(a) * (1 + hashUnit(`${i}:rz`) * 0.9));
    mesh.tubeBetween(v3(p.x, p.y + 0.16, p.z), end, 0.34, 0.1, hexToRgb(mats.bark.shade), 9, 0.78);
  }
  for (let i = 0; i < object.branchCount; i += 1) {
    const side = i % 2 ? 1 : -1;
    const h = p.y + object.trunkHeight * (0.48 + i / object.branchCount * 0.42);
    const angle = side * (0.45 + i * 0.19);
    const start = v3(p.x, h, p.z + Math.sin(i) * 0.42);
    const end = v3(p.x + Math.cos(angle) * (2.4 + i * 0.06), h + 0.85 + hashUnit(`${i}:bh`) * 1.2, p.z + Math.sin(angle) * (1.8 + i * 0.04));
    mesh.tubeBetween(start, end, 0.24, 0.08, hexToRgb(mats.bark.shade), 9, 0.68);
  }
  for (let i = 0; i < object.canopyLobeCount; i += 1) {
    const layer = i % 5;
    const a = i / object.canopyLobeCount * TAU + layer * 0.33;
    const r = object.canopyRadius * (0.22 + layer * 0.045);
    const sway = Math.sin(number(plan.time, 0) * 0.9 + i * 0.61) * wind;
    const x = p.x + Math.cos(a) * r * 1.08 + sway;
    const y = p.y + object.trunkHeight + 1.8 + Math.sin(i) * 0.72 + layer * 0.34;
    const z = p.z + Math.sin(a) * r * 0.72;
    const color = i % 5 === 0 ? mats.leaf.highlight : i % 3 === 0 ? mats.leaf.shade : mats.leaf.base;
    mesh.ellipsoid(x, y, z, 2.25 + layer * 0.52 + (i % 3) * 0.18, 1.35 + layer * 0.28, 1.95 + layer * 0.32, hexToRgb(color), 14, 0.78);
  }
}

function buildMesh(plan) {
  const mesh = createMesh();
  drawGround(mesh, plan);
  for (const object of plan.objects ?? []) {
    if (object.type === "atmosphere") drawAtmosphere(mesh, object, plan);
    if (object.type === "path") drawPath(mesh, object, plan);
    if (object.type === "grass-blade") drawGrass(mesh, object, plan);
    if (object.type === "wildflower") drawFlower(mesh, object, plan);
    if (object.type === "rock") drawRock(mesh, object, plan);
    if (object.type === "mushroom") drawMushroom(mesh, object, plan);
    if (object.type === "tree-line-tree") drawTreeLineTree(mesh, object, plan);
    if (object.type === "focal-tree") drawFocalTree(mesh, object, plan);
  }
  return mesh;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    attribute float aOutline;
    uniform mat4 uViewProjection;
    uniform float uOutlinePass;
    uniform float uOutlineWidth;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying float vOutlinePass;
    varying float vOutlineWeight;
    varying float vDepth;
    void main() {
      vec3 outlinePosition = aPosition + normalize(aNormal) * aOutline * uOutlineWidth * uOutlinePass;
      vec4 clip = uViewProjection * vec4(outlinePosition, 1.0);
      gl_Position = clip;
      vNormal = aNormal;
      vColor = aColor;
      vOutlinePass = uOutlinePass;
      vOutlineWeight = aOutline;
      vDepth = clip.z / clip.w;
    }
  `);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying float vOutlinePass;
    varying float vOutlineWeight;
    varying float vDepth;
    uniform vec3 uLightDirection;
    uniform vec3 uRimColor;
    uniform vec3 uOutlineColor;
    uniform float uRimStrength;
    void main() {
      if (vOutlinePass > 0.5) {
        if (vOutlineWeight < 0.05) discard;
        gl_FragColor = vec4(uOutlineColor, 1.0);
        return;
      }
      vec3 n = normalize(vNormal);
      float light = dot(n, normalize(uLightDirection)) * 0.5 + 0.5;
      float band = light < 0.2 ? 0.42 : light < 0.48 ? 0.72 : light < 0.74 ? 0.98 : 1.22;
      if (vOutlineWeight < 0.05) band = max(band, 0.9);
      float rim = smoothstep(0.24, 0.92, 1.0 - abs(n.z)) * uRimStrength;
      vec3 fog = vec3(0.92, 0.78, 0.48);
      float depthFog = clamp((vDepth + 0.08) * 0.3, 0.0, 0.38);
      gl_FragColor = vec4(mix(vColor * band + uRimColor * rim, fog, depthFog), 1.0);
    }
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

function upload(gl, attribute, size, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
  return buffer;
}

export function createMeadowWebglRenderer(config = {}) {
  const canvas = config.canvas;
  if (!canvas) throw new Error("createMeadowWebglRenderKit requires a canvas.");
  const gl = canvas.getContext("webgl", { antialias: config.antialias !== false, alpha: false });
  if (!gl) throw new Error("WebGL is required for meadow-webgl-render-kit.");
  const program = createProgram(gl);
  let snapshot = { id: "meadow-webgl-render-kit", version: MEADOW_WEBGL_RENDER_KIT_VERSION, vertexCount: 0, objectCount: 0 };
  let buffers = [];

  function disposeBuffers() {
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    buffers = [];
  }

  function resize() {
    const ratio = globalThis.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor((canvas.clientWidth || globalThis.innerWidth || 1) * ratio));
    const height = Math.max(1, Math.floor((canvas.clientHeight || globalThis.innerHeight || 1) * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function render(renderPlan) {
    resize();
    disposeBuffers();
    const plan = renderPlan ?? {};
    const mesh = buildMesh(plan);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...hexToRgb(plan.style?.materials?.sky?.base ?? "#7fb2dc"), 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const normalLocation = gl.getAttribLocation(program, "aNormal");
    const colorLocation = gl.getAttribLocation(program, "aColor");
    const outlineLocation = gl.getAttribLocation(program, "aOutline");
    buffers.push(upload(gl, positionLocation, 3, mesh.positions));
    buffers.push(upload(gl, normalLocation, 3, mesh.normals));
    buffers.push(upload(gl, colorLocation, 3, mesh.colors));
    buffers.push(upload(gl, outlineLocation, 1, mesh.outlines));
    const style = plan.style ?? {};
    const camera = style.camera ?? {};
    const position = camera.position ?? { x: 0, y: 5.4, z: -52 };
    const target = camera.target ?? { x: 0, y: 5.2, z: 24 };
    const view = lookAt([position.x, position.y, position.z], [target.x, target.y, target.z], [0, 1, 0]);
    const projection = perspective(number(camera.fov, 46), canvas.width / canvas.height, number(camera.near, 0.1), number(camera.far, 170));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uViewProjection"), false, new Float32Array(multiply(projection, view)));
    gl.uniform3fv(gl.getUniformLocation(program, "uLightDirection"), new Float32Array([number(style.light?.direction?.x, -0.48), number(style.light?.direction?.y, 0.82), number(style.light?.direction?.z, -0.3)]));
    gl.uniform3fv(gl.getUniformLocation(program, "uRimColor"), new Float32Array(hexToRgb(style.light?.rimColor ?? "#ffd37a")));
    gl.uniform3fv(gl.getUniformLocation(program, "uOutlineColor"), new Float32Array(hexToRgb(style.light?.outlineColor ?? "#10170d")));
    gl.uniform1f(gl.getUniformLocation(program, "uRimStrength"), number(style.light?.rimStrength, 0.38));
    gl.uniform1f(gl.getUniformLocation(program, "uOutlineWidth"), number(style.light?.outlineWidth, 0.18));
    const vertexCount = mesh.positions.length / 3;
    gl.uniform1f(gl.getUniformLocation(program, "uOutlinePass"), 1);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    gl.disable(gl.CULL_FACE);
    gl.uniform1f(gl.getUniformLocation(program, "uOutlinePass"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    snapshot = Object.freeze({ id: "meadow-webgl-render-kit", version: MEADOW_WEBGL_RENDER_KIT_VERSION, vertexCount, objectCount: plan.objects?.length ?? 0, planId: plan.id ?? null, validation: clone(plan.validation ?? null) });
    return snapshot;
  }

  return Object.freeze({ id: "meadow-webgl-render-kit", version: MEADOW_WEBGL_RENDER_KIT_VERSION, render, resize, dispose: disposeBuffers, getSnapshot: () => snapshot, snapshot: () => snapshot });
}

export function createMeadowWebglRenderKit(runtimeOrConfig = {}, maybeConfig = {}) {
  const isRuntimeFirst = runtimeOrConfig && typeof runtimeOrConfig === "object" && (typeof runtimeOrConfig.defineRuntimeKit === "function" || typeof runtimeOrConfig.defineDomainServiceKit === "function");
  const NexusRealtime = isRuntimeFirst ? runtimeOrConfig : null;
  const config = isRuntimeFirst ? maybeConfig : runtimeOrConfig;
  const api = config?.canvas ? createMeadowWebglRenderer(config) : Object.freeze({ id: "meadow-webgl-render-kit", version: MEADOW_WEBGL_RENDER_KIT_VERSION });
  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      const id = runtimeOptions.id ?? "meadow-webgl-render-kit";
      const provides = runtimeOptions.provides ?? ["renderer:meadow-webgl", "adapter:webgl-render-plan"];
      if (typeof NexusRealtime?.defineRuntimeKit === "function") {
        return NexusRealtime.defineRuntimeKit({ id, provides, metadata: { version: MEADOW_WEBGL_RENDER_KIT_VERSION, domain: "meadow-webgl-render", rendererAdapter: true, ...(runtimeOptions.metadata ?? {}) }, install({ engine }) { engine.meadowWebglRender = api; } });
      }
      return Object.freeze({ id, provides, metadata: { version: MEADOW_WEBGL_RENDER_KIT_VERSION, domain: "meadow-webgl-render", rendererAdapter: true }, install({ engine }) { engine.meadowWebglRender = api; } });
    }
  });
}

export default createMeadowWebglRenderKit;
