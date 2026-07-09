export const OCEAN_BOAT_KIT_VERSION = "0.0.1";

const DEFAULT_WAVE_BANDS = [
  { amplitude: 0.42, length: 18.0, speed: 0.76, direction: 0.18 },
  { amplitude: 0.82, length: 42.0, speed: 0.44, direction: 1.12 },
  { amplitude: 0.24, length: 9.5, speed: 1.22, direction: -0.62 },
  { amplitude: 0.11, length: 4.4, speed: 2.05, direction: 2.46 }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function createFallbackLoop({ update, render }) {
  let running = false;
  let last = 0;

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    update(dt, now / 1000);
    render();
    requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    }
  };
}

function createOptionalCoreKit(factory, fallback) {
  if (typeof factory === "function") {
    try {
      return factory();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed.");
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed.");
  }
  return program;
}

function createOceanField(options = {}) {
  const waveBands = options.waveBands || DEFAULT_WAVE_BANDS;
  const windDirection = options.windDirection ?? 0.28;
  const swellDirection = options.swellDirection ?? 1.06;

  function sampleHeight(x, z, time = 0) {
    let height = 0;
    for (const band of waveBands) {
      const dx = Math.cos(band.direction);
      const dz = Math.sin(band.direction);
      const phase = (x * dx + z * dz) / band.length + time * band.speed;
      height += Math.sin(phase) * band.amplitude;
    }
    height += Math.sin((x * -0.033 + z * 0.047) + time * 0.31) * 0.16;
    return height;
  }

  function sampleNormal(x, z, time = 0) {
    const e = 0.6;
    const h = sampleHeight(x, z, time);
    const dx = sampleHeight(x + e, z, time) - h;
    const dz = sampleHeight(x, z + e, time) - h;
    const nx = -dx;
    const ny = e * 1.8;
    const nz = -dz;
    const len = Math.hypot(nx, ny, nz) || 1;
    return { x: nx / len, y: ny / len, z: nz / len };
  }

  function sampleSurface(x, z, time = 0) {
    const height = sampleHeight(x, z, time);
    const normal = sampleNormal(x, z, time);
    const crest = clamp((height - 0.86) / 0.68, 0, 1);
    return { height, normal, crest };
  }

  return {
    id: "ocean-field",
    waveBands,
    windDirection,
    swellDirection,
    sampleHeight,
    sampleNormal,
    sampleSurface
  };
}

function createBoatSimulation(options = {}) {
  const boat = {
    x: options.x ?? 0,
    z: options.z ?? 0,
    heading: options.heading ?? 0,
    velocity: options.velocity ?? 0,
    throttle: 0,
    pitch: 0,
    roll: 0,
    height: 0,
    rudder: 0
  };

  const tuning = {
    thrust: options.thrust ?? 16,
    reverseThrust: options.reverseThrust ?? 7,
    drag: options.drag ?? 0.88,
    turnRate: options.turnRate ?? 1.45,
    hullLength: options.hullLength ?? 5.8,
    hullWidth: options.hullWidth ?? 2.1
  };

  function update(dt, input, ocean, time) {
    const throttleTarget = clamp(input?.throttle ?? 0, -1, 1);
    const steerTarget = clamp(input?.steer ?? 0, -1, 1);
    boat.throttle = lerp(boat.throttle, throttleTarget, 1 - Math.exp(-dt * 4.5));
    boat.rudder = lerp(boat.rudder, steerTarget, 1 - Math.exp(-dt * 5.5));

    const force = boat.throttle >= 0 ? tuning.thrust : tuning.reverseThrust;
    boat.velocity += boat.throttle * force * dt;
    boat.velocity *= Math.exp(-dt * tuning.drag);
    boat.velocity = clamp(boat.velocity, -8, 22);

    const turnPower = tuning.turnRate * (0.35 + Math.abs(boat.velocity) * 0.045);
    boat.heading += boat.rudder * turnPower * dt * Math.sign(boat.velocity || 1);

    boat.x += Math.sin(boat.heading) * boat.velocity * dt;
    boat.z -= Math.cos(boat.heading) * boat.velocity * dt;

    const fx = boat.x + Math.sin(boat.heading) * tuning.hullLength;
    const fz = boat.z - Math.cos(boat.heading) * tuning.hullLength;
    const bx = boat.x - Math.sin(boat.heading) * tuning.hullLength;
    const bz = boat.z + Math.cos(boat.heading) * tuning.hullLength;
    const lx = boat.x + Math.cos(boat.heading) * tuning.hullWidth;
    const lz = boat.z + Math.sin(boat.heading) * tuning.hullWidth;
    const rx = boat.x - Math.cos(boat.heading) * tuning.hullWidth;
    const rz = boat.z - Math.sin(boat.heading) * tuning.hullWidth;

    const front = ocean.sampleHeight(fx, fz, time);
    const back = ocean.sampleHeight(bx, bz, time);
    const left = ocean.sampleHeight(lx, lz, time);
    const right = ocean.sampleHeight(rx, rz, time);
    const center = ocean.sampleHeight(boat.x, boat.z, time);

    boat.height = lerp(boat.height, center, 1 - Math.exp(-dt * 8));
    boat.pitch = lerp(boat.pitch, (front - back) * 0.12, 1 - Math.exp(-dt * 5));
    boat.roll = lerp(boat.roll, (left - right) * 0.18 + boat.rudder * 0.18, 1 - Math.exp(-dt * 5));

    return boat;
  }

  return {
    id: "boat-simulation",
    boat,
    tuning,
    update
  };
}

function createWakeSystem(options = {}) {
  const particles = [];
  const maxParticles = options.maxParticles ?? 260;

  function emit(boat, dt) {
    const speed = Math.abs(boat.velocity);
    if (speed < 2) return;

    const count = clamp(Math.floor(speed * dt * 12), 1, 8);
    for (let i = 0; i < count; i += 1) {
      if (particles.length >= maxParticles) particles.shift();
      const side = i % 2 === 0 ? -1 : 1;
      const spread = side * (0.6 + Math.random() * 0.8);
      particles.push({
        x: boat.x - Math.sin(boat.heading) * 2.8 + Math.cos(boat.heading) * spread,
        z: boat.z + Math.cos(boat.heading) * 2.8 + Math.sin(boat.heading) * spread,
        vx: -Math.sin(boat.heading) * speed * 0.18 + Math.cos(boat.heading) * spread * 0.9,
        vz: Math.cos(boat.heading) * speed * 0.18 + Math.sin(boat.heading) * spread * 0.9,
        age: 0,
        life: 1.4 + Math.random() * 1.6,
        size: 0.12 + speed * 0.018 + Math.random() * 0.2
      });
    }
  }

  function update(dt, boat) {
    emit(boat, dt);
    for (const particle of particles) {
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.z += particle.vz * dt;
      particle.vx *= Math.exp(-dt * 0.8);
      particle.vz *= Math.exp(-dt * 0.8);
    }
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      if (particles[i].age >= particles[i].life) particles.splice(i, 1);
    }
  }

  return {
    id: "wake-system",
    particles,
    update
  };
}

function createInputController(target = globalThis) {
  const keys = new Set();
  const down = (event) => keys.add(event.key.toLowerCase());
  const up = (event) => keys.delete(event.key.toLowerCase());

  target.addEventListener?.("keydown", down);
  target.addEventListener?.("keyup", up);

  function read() {
    const forward = keys.has("w") || keys.has("arrowup");
    const reverse = keys.has("s") || keys.has("arrowdown");
    const left = keys.has("a") || keys.has("arrowleft");
    const right = keys.has("d") || keys.has("arrowright");
    return {
      throttle: (forward ? 1 : 0) - (reverse ? 0.7 : 0),
      steer: (right ? 1 : 0) - (left ? 1 : 0)
    };
  }

  return {
    read,
    destroy() {
      target.removeEventListener?.("keydown", down);
      target.removeEventListener?.("keyup", up);
    }
  };
}

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec4 boat;
uniform sampler2D wakeTexture;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float wave(vec2 p) {
  float h = 0.0;
  h += sin(p.x * 0.050 + time * 0.88) * 0.34;
  h += sin((p.x * 0.026 + p.y * 0.043) + time * 0.52) * 0.72;
  h += sin((p.x * -0.086 + p.y * 0.035) + time * 1.45) * 0.18;
  h += noise(p * 0.030 + time * 0.045) * 0.36;
  return h;
}

vec3 normalAt(vec2 p) {
  float e = 0.75;
  float h = wave(p);
  return normalize(vec3(wave(p - vec2(e, 0.0)) - h, e * 1.9, wave(p - vec2(0.0, e)) - h));
}

vec3 sky(vec3 rd) {
  vec3 sunDir = normalize(vec3(0.42, 0.36, 0.84));
  float sun = max(dot(rd, sunDir), 0.0);
  vec3 col = mix(vec3(0.015, 0.046, 0.11), vec3(0.16, 0.38, 0.62), pow(max(rd.y, 0.0), 0.58));
  col += vec3(1.0, 0.70, 0.32) * pow(sun, 360.0);
  col += vec3(1.0, 0.78, 0.42) * pow(sun, 22.0) * 0.26;
  return col;
}

float capsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  vec3 cam = vec3(boat.x, 5.2, boat.y + 9.2);
  vec3 target = vec3(boat.x + sin(boat.z) * 2.2, 0.9, boat.y - cos(boat.z) * 7.0);
  vec3 ww = normalize(target - cam);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = normalize(cross(uu, ww));
  vec3 rd = normalize(uu * uv.x + vv * uv.y + ww * 1.45);

  vec3 col = sky(rd);

  if (rd.y < 0.05) {
    float dist = (0.0 - cam.y) / rd.y;
    vec3 pos = cam;
    for (int i = 0; i < 7; i++) {
      pos = cam + rd * dist;
      float h = wave(pos.xz);
      dist += (h - pos.y) / rd.y;
    }

    vec3 n = normalAt(pos.xz);
    vec3 sunDir = normalize(vec3(0.42, 0.36, 0.84));
    float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 4.0);
    float diffuse = max(dot(n, sunDir), 0.0);
    float specular = pow(max(dot(reflect(-sunDir, n), -rd), 0.0), 96.0);
    vec3 deep = mix(vec3(0.014, 0.075, 0.13), vec3(0.026, 0.24, 0.34), diffuse);
    vec3 reflected = sky(reflect(rd, n));
    col = mix(deep, reflected, 0.28 + fresnel * 0.56);
    col += vec3(1.0, 0.78, 0.46) * specular * 1.55;

    vec2 q = pos.xz - boat.xy;
    float behind = dot(q, vec2(-sin(boat.z), cos(boat.z)));
    float side = abs(dot(q, vec2(cos(boat.z), sin(boat.z))));
    float wake = smoothstep(28.0, 0.0, behind) * smoothstep(1.1 + behind * 0.12, 0.0, side) * smoothstep(0.0, 4.0, behind);
    float crest = smoothstep(0.72, 1.24, wave(pos.xz));
    col = mix(col, vec3(0.78, 0.96, 1.0), max(crest * 0.18, wake * 0.64));

    float fog = smoothstep(25.0, 128.0, length(pos.xz - cam.xz));
    col = mix(col, sky(rd), fog * 0.72);
  }

  vec2 boatUv = uv;
  boatUv.y += 0.38;
  float hull = capsule(boatUv, vec2(-0.18, -0.22), vec2(0.18, -0.22), 0.16);
  hull = min(hull, capsule(boatUv, vec2(-0.28, -0.28), vec2(0.28, -0.28), 0.075));
  float cabin = length((boatUv - vec2(0.0, -0.08)) * vec2(1.5, 2.4)) - 0.105;
  float boatMask = smoothstep(0.012, 0.0, min(hull, cabin));
  vec3 hullCol = mix(vec3(0.08, 0.13, 0.17), vec3(0.9, 0.95, 0.98), smoothstep(0.12, -0.08, boatUv.y));
  hullCol += vec3(0.15, 0.55, 0.8) * smoothstep(0.02, 0.0, cabin);
  col = mix(col, hullCol, boatMask * 0.94);

  col = pow(col, vec3(0.82));
  col *= 1.0 - smoothstep(0.55, 1.55, length(uv)) * 0.42;
  gl_FragColor = vec4(col, 1.0);
}
`;

function createWebGLRenderer(canvas, options = {}) {
  const gl = canvas.getContext("webgl", {
    antialias: options.antialias ?? true,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance"
  });

  if (!gl) {
    throw new Error("WebGL is required for the Ocean Boat Kit renderer.");
  }

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "position");
  const resolution = gl.getUniformLocation(program, "resolution");
  const time = gl.getUniformLocation(program, "time");
  const boat = gl.getUniformLocation(program, "boat");

  function resize() {
    const dpr = Math.min(options.maxDpr ?? 2, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function render(gameState) {
    resize();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, gameState.time);
    gl.uniform4f(boat, gameState.boat.x, gameState.boat.z, gameState.boat.heading, gameState.boat.velocity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    id: "ocean-webgl-renderer",
    gl,
    render,
    destroy() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    }
  };
}

export function createOceanBoatKit(nexusEngine = {}, options = {}) {
  const terrainKit = createOptionalCoreKit(nexusEngine.createTerrainKit, {
    id: "fallback-terrain-kit",
    source: "ocean-boat-kit"
  });
  const renderDescriptorKit = createOptionalCoreKit(nexusEngine.createRenderDescriptorKit, {
    id: "fallback-render-descriptor-kit",
    source: "ocean-boat-kit"
  });
  const realismKit = createOptionalCoreKit(nexusEngine.createRealismKit, {
    id: "fallback-realism-kit",
    source: "ocean-boat-kit"
  });

  function createOceanBoatGame(gameOptions = {}) {
    const canvas = gameOptions.canvas;
    if (!canvas) throw new Error("createOceanBoatGame requires a canvas.");

    const ocean = createOceanField(gameOptions.ocean);
    const boat = createBoatSimulation(gameOptions.boat);
    const wake = createWakeSystem(gameOptions.wake);
    const input = gameOptions.input || createInputController(gameOptions.inputTarget || globalThis);
    const renderer = gameOptions.renderer || createWebGLRenderer(canvas, gameOptions.rendering);

    const state = {
      time: 0,
      ocean,
      boat: boat.boat,
      wake: wake.particles,
      descriptors: {
        terrain: terrainKit,
        render: renderDescriptorKit,
        realism: realismKit
      }
    };

    function update(dt, time) {
      state.time = time;
      const controls = input.read();
      boat.update(dt, controls, ocean, time);
      wake.update(dt, boat.boat);
      gameOptions.onUpdate?.(state, dt);
    }

    function render() {
      renderer.render(state);
      gameOptions.onRender?.(state);
    }

    const loopFactory = nexusEngine.createRealtimeGame || createFallbackLoop;
    const loop = loopFactory({ update, render });

    return {
      id: "ocean-boat-game",
      state,
      ocean,
      boat,
      wake,
      renderer,
      input,
      start() {
        loop.start?.();
      },
      stop() {
        loop.stop?.();
      },
      destroy() {
        loop.stop?.();
        input.destroy?.();
        renderer.destroy?.();
      }
    };
  }

  return {
    id: "ocean-boat-kit",
    version: OCEAN_BOAT_KIT_VERSION,
    kitsUsed: [
      "createRealtimeGame",
      "createTerrainKit",
      "createRenderDescriptorKit",
      "createRealismKit"
    ],
    options,
    createOceanField,
    createBoatSimulation,
    createWakeSystem,
    createInputController,
    createWebGLRenderer,
    createOceanBoatGame
  };
}
