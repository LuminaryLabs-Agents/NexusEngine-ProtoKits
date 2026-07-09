import { createSeededRandom, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const HIGH_FIDELITY_MEADOW_KITS_VERSION = "0.0.2";

const F = (value) => Array.isArray(value) ? Object.freeze(value.map(F)) : value && typeof value === "object" ? Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, F(entry)]))) : value;
const S = (options = {}, suffix = "meadow") => createSeededRandom(`${options.seed ?? "nexus-meadow"}:${suffix}`);
const D = (id, type, data = {}) => F({ id, type, ...data });
const Sh = (id, stage, source, uniforms = {}) => F({ id, stage, language: "glsl100", source, uniforms });

function kit(nexusEngine = {}, options = {}, spec = {}, services = {}) {
  const api = Object.freeze({
    id: options.id ?? spec.id,
    version: HIGH_FIDELITY_MEADOW_KITS_VERSION,
    category: spec.category ?? "rendering-stack/high-fidelity-meadow",
    purpose: spec.purpose ?? "High fidelity meadow rendering ProtoKit.",
    requires: Object.freeze([...(options.requires ?? spec.requires ?? [])]),
    provides: Object.freeze([...(options.provides ?? spec.provides ?? [])]),
    config: F(options.config ?? {}),
    ...services
  });
  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusEngine ?? {}, {
        id: runtimeOptions.id ?? api.id,
        requires: runtimeOptions.requires ?? api.requires,
        provides: runtimeOptions.provides ?? api.provides,
        bindings: { [runtimeOptions.bindingName ?? api.id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())]: api, ...(runtimeOptions.bindings ?? {}) },
        metadata: {
          version: HIGH_FIDELITY_MEADOW_KITS_VERSION,
          category: api.category,
          purpose: api.purpose,
          rendererBoundary: "descriptor-only; host owns WebGL/Three objects",
          ...(runtimeOptions.metadata ?? {})
        }
      });
    }
  });
}

function h(x, z, options = {}) {
  const sx = number(x) * 0.035;
  const sz = number(z) * 0.035;
  const roll = Math.sin(sx * 2.3 + 0.4) * 1.4 + Math.cos(sz * 2.1 - 0.2) * 1.1;
  const detail = Math.sin((sx + sz) * 7.0) * 0.18 + Math.cos((sx - sz) * 5.4) * 0.12;
  const hollow = Math.exp(-((x + 9) ** 2 + (z - 2) ** 2) / 900) * -0.9;
  return (roll + detail + hollow) * number(options.amplitude, 1);
}

function nrm(x, z, options = {}) {
  const e = 0.55;
  const nx = h(x - e, z, options) - h(x + e, z, options);
  const ny = 2 * e;
  const nz = h(x, z - e, options) - h(x, z + e, options);
  const l = Math.hypot(nx, ny, nz) || 1;
  return F({ x: nx / l, y: ny / l, z: nz / l });
}

export const sampleMeadowTerrainHeight = (x = 0, z = 0, options = {}) => h(x, z, options);
export const sampleMeadowTerrainNormal = (x = 0, z = 0, options = {}) => nrm(x, z, options);

function disk(random, radius) {
  const a = random.range(0, Math.PI * 2);
  const r = Math.sqrt(random()) * radius;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

export function createMeadowShaderVfxKit(nexusEngine = {}, options = {}) {
  const shaders = Object.freeze([
    Sh("meadow.terrain.vertex", "vertex", `varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; uniform float uTime; void main(){ vUv=uv; vNormal=normalize(normalMatrix*normal); vec4 w=modelMatrix*vec4(position,1.0); w.y+=sin(w.x*.055+uTime*.35)*.06; vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`, { uTime: 0 }),
    Sh("meadow.terrain.fragment", "fragment", `precision highp float; varying vec3 vWorld; varying vec3 vNormal; uniform vec3 uSun; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);} void main(){float slope=1.-clamp(vNormal.y,0.,1.); float q=noise(vWorld.xz*.065)*.62+noise(vWorld.xz*.22)*.22; vec3 col=mix(vec3(.19,.31,.16),vec3(.38,.52,.24),q); col=mix(col,vec3(.78,.69,.34),smoothstep(.72,.95,q)*.22); col=mix(col,vec3(.28,.25,.18),slope*.55); float light=clamp(dot(normalize(vNormal),normalize(uSun)),0.,1.); vec3 hemi=mix(vec3(.20,.28,.34),vec3(1.,.88,.58),light); float mist=smoothstep(80.,190.,length(vWorld.xz)); gl_FragColor=vec4(mix(col*hemi*1.35,vec3(.64,.77,.73),mist*.44),1.); }`, { uSun: [0.38, 0.88, 0.22] }),
    Sh("meadow.grass.vertex", "vertex", `attribute vec3 instanceOffset; attribute vec4 instanceBlade; attribute vec3 instanceColor; varying vec3 vColor; varying float vTip; uniform float uTime; uniform vec3 uWind; void main(){float h=instanceBlade.x,yaw=instanceBlade.y,phase=instanceBlade.z,bend=instanceBlade.w; float s=sin(yaw),c=cos(yaw); vec3 p=position; vTip=clamp(p.y/max(h,.001),0.,1.); float gust=sin(uTime*1.65+phase+instanceOffset.x*.08+instanceOffset.z*.05); p.x+=(uWind.x*.6+gust*.18)*bend*vTip*vTip; p.z+=(uWind.z*.6+gust*.12)*bend*vTip*vTip; p.y*=h; p.xz=mat2(c,-s,s,c)*p.xz; vec4 w=modelMatrix*vec4(p+instanceOffset,1.); vColor=instanceColor; gl_Position=projectionMatrix*viewMatrix*w; }`, { uTime: 0, uWind: [0.45, 0, 0.2] }),
    Sh("meadow.grass.fragment", "fragment", `precision highp float; varying vec3 vColor; varying float vTip; void main(){float a=smoothstep(0.,.08,vTip)*(1.-smoothstep(.96,1.,vTip)*.08); vec3 lit=mix(vColor*.55,vColor*1.65+vec3(.09,.07,.02),vTip); gl_FragColor=vec4(lit,a); }`),
    Sh("meadow.sheepWool.vertex", "vertex", `varying vec3 vNormal; varying vec3 vWorld; uniform float uTime; void main(){vec3 p=position+normal*(.035*sin(position.x*18.+position.y*13.+uTime)); vec4 w=modelMatrix*vec4(p,1.); vWorld=w.xyz; vNormal=normalize(normalMatrix*normal); gl_Position=projectionMatrix*viewMatrix*w; }`, { uTime: 0 }),
    Sh("meadow.sheepWool.fragment", "fragment", `precision highp float; varying vec3 vNormal; varying vec3 vWorld; uniform vec3 uSun; float no(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,39.425)))*43758.5453);} void main(){float fleece=no(floor(vWorld*8.)); float light=clamp(dot(normalize(vNormal),normalize(uSun)),0.,1.); vec3 wool=mix(vec3(.62,.59,.51),vec3(1.,.96,.84),fleece*.7); gl_FragColor=vec4(wool*(.42+light*.98),1.); }`, { uSun: [0.38, 0.88, 0.22] }),
    Sh("meadow.cottage.fragment", "fragment", `precision highp float; varying vec3 vNormal; varying vec3 vWorld; uniform vec3 uBase; uniform vec3 uSun; float hash(vec2 p){return fract(sin(dot(p,vec2(269.5,183.3)))*43758.5453);} void main(){float grain=hash(floor(vWorld.xz*12.+vWorld.yy*3.)); float light=clamp(dot(normalize(vNormal),normalize(uSun)),0.,1.); vec3 col=uBase*(.74+grain*.34); gl_FragColor=vec4(col*(.45+light*.95),1.); }`, { uBase: [0.54, 0.35, 0.2], uSun: [0.38, 0.88, 0.22] }),
    Sh("meadow.pollen.vertex", "vertex", `attribute float instanceSeed; varying float vSeed; uniform float uTime; void main(){vSeed=instanceSeed; vec3 p=position; p.x+=sin(uTime*.7+instanceSeed*11.)*.6; p.y+=sin(uTime*1.3+instanceSeed*7.)*.18; vec4 w=modelMatrix*vec4(p,1.); gl_PointSize=2.+fract(instanceSeed*13.7)*3.; gl_Position=projectionMatrix*viewMatrix*w; }`, { uTime: 0 }),
    Sh("meadow.pollen.fragment", "fragment", `precision highp float; varying float vSeed; void main(){vec2 d=gl_PointCoord-.5; float a=smoothstep(.25,0.,dot(d,d)); vec3 col=mix(vec3(1.,.74,.28),vec3(.66,.9,1.),fract(vSeed*31.7)); gl_FragColor=vec4(col,a*.55); }`)
  ]);
  return kit(nexusEngine, options, { id: "meadow-shader-vfx-kit", purpose: "Descriptor-only custom GLSL shader and VFX policy for the high-fidelity meadow scene.", provides: ["shader:meadow-custom", "vfx:meadow-procedural"] }, { shaders, listShaders: () => shaders, getShader: (id) => shaders.find((s) => s.id === id) ?? null, createVfxField(config = {}) { const r = S({ seed: config.seed ?? options.seed }, "vfx"); const particles = []; const count = Math.floor(number(config.count, 900)); const radius = number(config.radius, 80); for (let i = 0; i < count; i += 1) { const p = disk(r, radius); particles.push({ id: `pollen-${i}`, x: p.x, y: r.range(.8, 7.5), z: p.z, seed: r(), size: r.range(.8, 2.4) }); } return F({ id: config.id ?? "meadow-pollen-field", type: "vfx.pollen-field", particles }); } });
}

export function createProceduralGrassKit(nexusEngine = {}, options = {}) {
  function createBladeMesh(config = {}) { const w = number(config.width, .035) * .5, ht = number(config.height, 1), b = number(config.bend, .22); return F({ id: config.id ?? "grass-blade-procedural-mesh", primitive: "triangles", positions: [-w,0,0,w,0,0,-w*.64,ht*.45,b*.25,w*.64,ht*.45,b*.25,0,ht,b], uvs: [0,0,1,0,.15,.45,.85,.45,.5,1], indices: [0,1,2,1,3,2,2,3,4], vertexCount: 5, triangleCount: 3 }); }
  function createGrassField(config = {}) { const r = S({ seed: config.seed ?? options.seed }, "grass"); const count = Math.floor(number(config.bladeCount, options.bladeCount ?? 14000)); const radius = number(config.radius, options.radius ?? 92); const terrain = config.terrain ?? { heightAt: (x,z) => h(x,z,options), normalAt: (x,z) => nrm(x,z,options) }; const bladeInstances = []; for (let i = 0; i < count; i += 1) { const p = disk(r, radius); if (!(Math.abs(p.x + 4) > 4.3 || Math.abs(p.z + 3) > 3.6) && r() < .84) continue; const tint = r.range(-.08, .09); bladeInstances.push({ id: `grass-${i}`, position: { x: p.x, y: terrain.heightAt(p.x,p.z), z: p.z }, normal: terrain.normalAt(p.x,p.z), height: r.range(.42,1.35), width: r.range(.012,.044), yaw: r.range(0,Math.PI*2), bend: r.range(.08,.42), phase: r.range(0,Math.PI*2), color: [.28+tint,.48+tint*.8,.17+tint*.2] }); } return F({ id: config.id ?? "procedural-meadow-grass-field", type: "vegetation.grass-field", bladeCount: bladeInstances.length, mesh: createBladeMesh(), bladeInstances }); }
  return kit(nexusEngine, options, { id: "procedural-grass-kit", purpose: "Generates procedural grass blade mesh and high-volume instance descriptors.", provides: ["vegetation:procedural-grass", "mesh:grass-blade"], requires: ["terrain:height-field", "shader:meadow-custom"] }, { createBladeMesh, createGrassField });
}

export function createProceduralCottageKit(nexusEngine = {}, options = {}) {
  const part = (id, kind, transform, material, extra = {}) => D(id, `cottage.${kind}`, { transform, material, ...extra });
  function createCottageDescriptor(config = {}) { const x = number(config.x, options.x ?? -7.5), z = number(config.z, options.z ?? -4.5), y = number(config.y, h(x,z,options)), yaw = number(config.yaw, options.yaw ?? -.18), base = { x, y, z, yaw }; const parts = [part("cottage-foundation","stone-foundation",{...base,y:y+.35,scale:{x:6.2,y:.7,z:5.2}},"meadow.stone.mossy"),part("cottage-wall-front","timber-wall",{...base,y:y+2,z:z-2.38,scale:{x:6,y:3,z:.24}},"meadow.cottage.plaster",{beams:7}),part("cottage-wall-back","timber-wall",{...base,y:y+2,z:z+2.38,scale:{x:6,y:3,z:.24}},"meadow.cottage.plaster",{beams:7}),part("cottage-wall-left","timber-wall",{...base,x:x-3.08,y:y+2,scale:{x:.24,y:3,z:4.9}},"meadow.cottage.plaster"),part("cottage-wall-right","timber-wall",{...base,x:x+3.08,y:y+2,scale:{x:.24,y:3,z:4.9}},"meadow.cottage.plaster"),part("cottage-roof-a","thatched-roof",{...base,y:y+4.05,z:z-.85,rotation:{x:-.72,y:yaw,z:0},scale:{x:6.9,y:.42,z:3.55}},"meadow.roof.thatch"),part("cottage-roof-b","thatched-roof",{...base,y:y+4.05,z:z+.85,rotation:{x:.72,y:yaw,z:0},scale:{x:6.9,y:.42,z:3.55}},"meadow.roof.thatch"),part("cottage-ridge","timber-beam",{...base,y:y+4.95,scale:{x:7.05,y:.24,z:.24}},"meadow.wood.dark"),part("cottage-chimney","stone-chimney",{...base,x:x+2.05,y:y+5.05,z:z+.8,scale:{x:.78,y:2.1,z:.72}},"meadow.stone.warm",{smokeEmitter:"chimney-smoke"}),part("cottage-door","arched-door",{...base,x:x-1.2,y:y+1.18,z:z-2.55,scale:{x:1.05,y:2.1,z:.18}},"meadow.wood.dark"),part("cottage-window-left","glowing-window",{...base,x:x+1.35,y:y+2.1,z:z-2.57,scale:{x:1.1,y:1,z:.08}},"meadow.window.warm"),part("cottage-window-right","glowing-window",{...base,x:x+3.15,y:y+2.1,z:z+.9,scale:{x:.08,y:1,z:1}},"meadow.window.warm")]; return F({ id: config.id ?? "procedural-cottage", type: "structure.procedural-cottage", base, parts, shader: "meadow.cottage.fragment", assetPolicy: "no-preloaded-assets" }); }
  return kit(nexusEngine, options, { id: "procedural-cottage-kit", purpose: "Produces a procedural cottage structure descriptor from primitive and generated mesh parts.", provides: ["structure:procedural-cottage", "mesh:cottage-procedural"], requires: ["terrain:height-field", "shader:meadow-custom"] }, { createCottageDescriptor });
}

export function createProceduralSheepKit(nexusEngine = {}, options = {}) {
  function createSheepDescriptor(id, config = {}) { const x = number(config.x), z = number(config.z), y = number(config.y, h(x,z,options)), yaw = number(config.yaw,0), phase = number(config.phase,0), scale = number(config.scale,1), woolShells = Math.max(4, Math.floor(number(config.woolShells,9))); const parts = [["body","ellipsoid",[1.35,.82,.88],[0,.82,0],"meadow.sheep.wool",true],["chest","ellipsoid",[.72,.78,.68],[.92,.86,0],"meadow.sheep.wool",true],["head","ellipsoid",[.48,.42,.36],[1.55,.98,0],"meadow.sheep.face",false],["earL","leaf",[.16,.08,.26],[1.6,1.12,.26],"meadow.sheep.face",false],["earR","leaf",[.16,.08,.26],[1.6,1.12,-.26],"meadow.sheep.face",false],["legFL","tapered-cylinder",[.13,.78,.13],[.66,.31,.38],"meadow.sheep.leg",false],["legFR","tapered-cylinder",[.13,.78,.13],[.66,.31,-.38],"meadow.sheep.leg",false],["legBL","tapered-cylinder",[.13,.76,.13],[-.72,.3,.36],"meadow.sheep.leg",false],["legBR","tapered-cylinder",[.13,.76,.13],[-.72,.3,-.36],"meadow.sheep.leg",false]].map(([pid,kind,sc,off,material,wool]) => ({ id:`${id}.${pid}`, kind, scale: sc.map(v => v*scale), offset: off.map(v => v*scale), material, wool })); return F({ id, type: "creature.procedural-sheep", transform: { x, y, z, yaw, scale }, phase, woolShells, shader: "meadow.sheepWool", parts, animation: { gait: "graze-and-wander", breathAmplitude: .035, headBob: .12 } }); }
  function createFlock(config = {}) { const r = S({ seed: config.seed ?? options.seed }, "sheep"); const count = Math.floor(number(config.count, options.count ?? 14)); const radius = number(config.radius, options.radius ?? 38); const flock = []; for (let i = 0; i < count; i += 1) { const p = disk(r, radius); flock.push(createSheepDescriptor(`sheep-${i}`, { x: p.x + r.range(-2,2), z: p.z + r.range(-2,2), yaw: r.range(-Math.PI,Math.PI), phase: r.range(0,Math.PI*2), scale: r.range(.84,1.14), woolShells: r.int(7,12) })); } return F({ id: config.id ?? "procedural-sheep-flock", type: "creature.flock", count: flock.length, flock }); }
  return kit(nexusEngine, options, { id: "procedural-sheep-kit", purpose: "Creates procedural sheep descriptors with wool shell layers, body parts, and grazing phases.", provides: ["creature:procedural-sheep", "animation:sheep-grazing", "fur:wool-shells"], requires: ["terrain:height-field", "shader:meadow-custom"] }, { createSheepDescriptor, createFlock });
}

export function createHighFidelityMeadowSceneKit(nexusEngine = {}, options = {}) {
  const shaderKit = createMeadowShaderVfxKit(nexusEngine, options.shader ?? options), grassKit = createProceduralGrassKit(nexusEngine, options.grass ?? options), cottageKit = createProceduralCottageKit(nexusEngine, options.cottage ?? options), sheepKit = createProceduralSheepKit(nexusEngine, options.sheep ?? options);
  function createSceneDescriptor(config = {}) { const terrain = { heightAt: (x,z) => h(x,z,options.terrain ?? options), normalAt: (x,z) => nrm(x,z,options.terrain ?? options) }; const grass = grassKit.createGrassField({ terrain, ...(config.grass ?? {}) }); const cottage = cottageKit.createCottageDescriptor(config.cottage ?? {}); const sheep = sheepKit.createFlock(config.sheep ?? {}); const vfx = shaderKit.createVfxField(config.vfx ?? {}); return F({ id: config.id ?? "high-fidelity-meadow-cottage-sheep", version: HIGH_FIDELITY_MEADOW_KITS_VERSION, type: "scene.high-fidelity-meadow", assetPolicy: "procedural-only-no-preloaded-assets", terrain: { id: "meadow-terrain-field", type: "terrain.height-field", width: number(config.width, options.width ?? 180), depth: number(config.depth, options.depth ?? 180), segments: Math.max(32, Math.floor(number(config.segments, options.segments ?? 180))) }, lighting: { sun: { direction: [.38,.88,.22], color: [1,.84,.56], intensity: 3.1 }, fog: { color: [.62,.76,.71], near: 46, far: 185, heightFalloff: .018 } }, camera: { rig: "orbit-cinematic-meadow", position: [16,10.5,21], target: [-1.5,2.2,-2.5], fov: 46, exposure: 1.1 }, materials: { terrain: "meadow.terrain.shader", grass: "meadow.grass.shader", wool: "meadow.sheepWool.shader", cottage: "meadow.cottage.shader" }, shaders: shaderKit.listShaders(), grass, cottage, sheep, vfx, performanceBudget: { targetFps: 60, maxGrassInstances: grass.bladeCount, maxSheep: sheep.count, intendedBackend: "WebGL2 or WebGL1 with instancing extension" } }); }
  return kit(nexusEngine, options, { id: "high-fidelity-meadow-scene-kit", purpose: "Composes procedural terrain, grass, cottage, sheep, shaders, VFX, lighting, and camera descriptors into a reusable scene kit.", provides: ["scene:high-fidelity-meadow", "mode:meadow-cottage-sheep", "render:procedural-webgl-scene"], requires: ["vegetation:procedural-grass", "creature:procedural-sheep", "structure:procedural-cottage", "shader:meadow-custom"] }, { shaderKit, grassKit, cottageKit, sheepKit, createSceneDescriptor });
}

export function createHighFidelityMeadowRuntimeKits(nexusEngine = {}, options = {}) { return [createMeadowShaderVfxKit(nexusEngine, options.shader ?? options).createRuntimeKit(), createProceduralGrassKit(nexusEngine, options.grass ?? options).createRuntimeKit(), createProceduralCottageKit(nexusEngine, options.cottage ?? options).createRuntimeKit(), createProceduralSheepKit(nexusEngine, options.sheep ?? options).createRuntimeKit(), createHighFidelityMeadowSceneKit(nexusEngine, options).createRuntimeKit()]; }

export const HIGH_FIDELITY_MEADOW_FACTORIES = Object.freeze({ createMeadowShaderVfxKit, createProceduralGrassKit, createProceduralCottageKit, createProceduralSheepKit, createHighFidelityMeadowSceneKit });
