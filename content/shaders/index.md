---
title: "Shaders"
description: "GLSL, the pipeline, uniforms/varyings, lighting, SDFs, and common effects."
category: "Graphics"
tags: ["graphics", "GLSL", "lighting", "SDF"]
weight: 410
lead: "Programs that run on the GPU."
version: "GLSL · HLSL"
---
A shader is a small program executed by the graphics card: the vertex stage transforms geometry, the fragment stage paints every pixel. One language, millions of pixels in parallel.

## Quick reference {#quickref}

The ideas that cover 90% of shader work — scan a row, copy the code, keep moving.

- `Vertex stage` — Runs once per vertex; write `gl_Position` (clip space) and pass data downstream.
- `Fragment stage` — Runs once per pixel; write `out vec4 color` (or legacy `gl_FragColor`).
- `vec2 / vec3 / vec4` — 2 / 3 / 4-component float vectors: `vec3 c = vec3(1.0);`
- `uniform vs in / out` — `uniform` is constant per draw; `in`/`out` (formerly `varying`) interpolate across the triangle.
- `Swizzling` — Reorder with `.xyzw` / `.rgba` / `.stpq`: `c.rgb`, `c.zy`.
- `Lambert diffuse` — `max(dot(n, l), 0.0)` — brightness by the cosine of normal · light.
- `Blinn-Phong specular` — `pow(max(dot(n, normalize(l + v)), 0.0), shininess)` — highlight around the half-vector.
- `SDF raymarch` — Sphere: `length(p) - r`; step the ray `t += map(ro + rd * t)` until it hits.
- `Hash noise` — `fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453)` — cheap pseudo-random.

## The pipeline {#start}

Every draw call flows through fixed stages: geometry is transformed, triangles are rasterized, and each pixel is shaded.

**Vertex** (transforms points) → **Rasterizer** (fills triangles) → **Fragment** (colors pixels) → **Framebuffer** (final image)

`per-vertex` `per-primitive` `per-pixel` `massively parallel`

### 1. Vertex shader

Runs once per vertex. Transforms local position into clip space and passes data downstream.

```
gl_Position = u_proj * u_view *
              u_model * vec4(a_pos, 1.0);
```

### 2. Rasterization

Fixed function. Assembles primitives, clips, and interpolates varyings across each triangle.

```
// no code — the GPU does it.
// varyings are linearly
// interpolated per pixel.
```

### 3. Fragment shader

Runs once per pixel (fragment). Reads interpolated inputs and writes a color.

```
gl_FragColor =
  vec4(1.0, 0.5, 0.0, 1.0);
```

### 4. Output

The color is blended and written to the framebuffer, then presented to the screen.

```
// depth test & blend
// happen after the
// fragment shader runs.
```

> **KEY:** **Vertex = geometry, fragment = pixels.** You can't control the loop — the GPU schedules millions of invocations for you. Write each shader as the code for a *single* vertex or *single* pixel and let parallelism do the rest.

## GLSL syntax & types {#glsl}

GLSL is C-like, with vector and matrix types as first-class citizens and swizzle sugar on top.

| Type | Meaning | Example |
| --- | --- | --- |
| `float` | 32-bit scalar | `float t = 0.5;` |
| `int` / `bool` | integer, boolean | `bool hit = false;` |
| `vec2 / vec3 / vec4` | 2 / 3 / 4-component vector | `vec3 color = vec3(1.0);` |
| `mat2 / mat3 / mat4` | square matrices | `mat4 model = mat4(1.0);` |
| `sampler2D` | 2D texture handle | `uniform sampler2D tex;` |
| `samplerCube` | cubemap handle | `uniform samplerCube env;` |

### Swizzling

Rearrange components with `.xyzw`, `.rgba`, or `.stpq` — all three names are equivalent.

```
vec4 c = vec4(1.0, 0.0, 0.0, 1.0);
vec3 rgb = c.rgb;   // == c.xyz
vec2 st  = c.xy;
vec2 rev = c.zy;    // reorder
```

### Built-in variables

Every stage declares well-known inputs and outputs for you — but `gl_FragColor` is legacy (pre-GLSL 3.30 / ES 1.00). Modern GLSL declares its own `out vec4 fragColor;`.

```
gl_Position   // vertex OUT: clip-space
gl_FragCoord  // fragment IN: x,y + depth
gl_FragColor  // fragment OUT (legacy)
gl_PointSize  // point sprite size
```

> **⚠:** **Precision matters on mobile.** Fragment shaders must declare `precision mediump float;` (or `highp`) — GLSL ES requires it, and `highp` isn't available everywhere. Qualifiers: `lowp` (fast, low range), `mediump` (default on most phones), `highp` (full precision).

<details>
<summary>Built-in functions you'll use constantly</summary>

- `mix(a, b, t)` — Linear blend between a and b.
- `clamp(x, lo, hi)` — Clamp x into [lo, hi].
- `smoothstep(e0, e1, x)` — Smooth Hermite ramp 0 → 1.
- `step(edge, x)` — 0 below edge, 1 above.
- `length(x) / distance(a, b)` — Vector magnitude / separation.
- `normalize(x)` — Scale to unit length.
- `dot(a, b) / cross(a, b)` — Dot and cross product.
- `fract(x) / mod(x, y)` — Fractional part / modulus.

</details>

<details>
<summary>GLSL ↔ HLSL name map</summary>

| GLSL | HLSL | Notes |
| --- | --- | --- |
| `vec2 / vec3 / vec4` | `float2 / float3 / float4` | Same layout, different spelling. |
| `mat2 / mat3 / mat4` | `float2x2 / float3x3 / float4x4` | Column- vs row-major differs per API. |
| `mix(a, b, t)` | `lerp(a, b, t)` | Linear blend. |
| `fract(x)` | `frac(x)` | Fractional part. |
| `mod(x, y)` | `fmod(x, y)` | Modulus. |
| `texture(tex, uv)` | `tex.Sample(s, uv)` | Legacy HLSL: `tex2D(tex, uv)`. |
| `gl_FragCoord` | `SV_Position` | Pixel position (origin differs by API). |
| `out vec4 color` / `gl_FragColor` | `SV_Target` | Pixel-shader output. |
| `uniform` | `cbuffer` (constant buffer) | Per-draw constants from the CPU. |
| `in` / `out` | struct + semantics (`TEXCOORD0`) | Vertex→fragment data. |

</details>

## Uniforms & varyings {#uniforms}

Data enters a shader two ways: `uniform` (constant for the whole draw) and `in`/`out` (per-vertex, interpolated).

| Qualifier | Scope | Set by | Example |
| --- | --- | --- | --- |
| `uniform` | constant per draw call | CPU / JS via `glUniform*` | `uniform mat4 u_view;` |
| `attribute` / `in` | per-vertex input | CPU via vertex buffers | `in vec3 a_pos;` |
| `varying` / `out` | vertex writes, fragment reads | interpolated by rasterizer | `out vec2 v_uv;` |

### Modern syntax (GLSL 3.30+)

`attribute`/`varying` are legacy; modern GLSL uses explicit `in`/`out`.

```
// vertex shader
in  vec3 a_pos;
out vec2 v_uv;

// fragment shader
in  vec2 v_uv;
out vec4 fragColor;
```

### Interpolation

The rasterizer linearly blends each `out` value across the triangle's surface, so the fragment sees a smooth value.

```
// vertex writes per-corner
v_uv = a_uv;
// fragment reads the
// interpolated value here
```

<details>
<summary>Full vertex + fragment skeleton</summary>

#### vertex.glsl

```
uniform mat4 u_proj, u_view;
in vec3 a_pos; in vec2 a_uv;
out vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = u_proj * u_view * vec4(a_pos, 1.0);
}
```

#### fragment.glsl

```
precision mediump float;
uniform sampler2D tex;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(tex, v_uv);
}
```

</details>

## Lighting & shading {#lighting}

Realistic shading composes a few terms: ambient (constant), diffuse (Lambert), and specular (Blinn-Phong).

### Diffuse — Lambert

Brightness falls off with the cosine between the surface normal `n` and light direction `l`.

```
float ndl = max(dot(n, l), 0.0);
vec3 diffuse = baseColor * ndl;
```

### Specular — Blinn-Phong

Highlight around the half-vector `h`, sharpened by the `shininess` exponent.

```
vec3 h = normalize(l + v);
float spec =
  pow(max(dot(n, h), 0.0),
      shininess);
```

### Ambient

A constant term so shadowed areas aren't pitch black. Add it to the others.

```
vec3 ambient = ambientColor * baseColor;
vec3 final =
  ambient + diffuse + specular;
```

### Normal mapping

Perturb the normal with a texture so a flat surface appears bumpy.

```
vec3 n = texture(normalMap, v_uv).rgb;
n = normalize(n * 2.0 - 1.0); // 0..1 → -1..1
n = normalize(tbn * n);       // to world
```

### Fresnel

Surfaces reflect more at grazing angles — edges glow.

```
float fresnel =
  pow(1.0 - max(dot(v, n), 0.0), 5.0);
color += rimColor * fresnel;
```

<details>
<summary>Complete Blinn-Phong fragment shader</summary>

```
precision highp float;

uniform vec3 u_lightPos;
uniform vec3 u_viewPos;
uniform vec3 u_baseColor;
varying vec3 v_normal;
varying vec3 v_worldPos;

void main() {
  vec3 n = normalize(v_normal);
  vec3 l = normalize(u_lightPos - v_worldPos);
  vec3 v = normalize(u_viewPos - v_worldPos);
  vec3 h = normalize(l + v);

  float diffuse = max(dot(n, l), 0.0);
  float spec    = pow(max(dot(n, h), 0.0), 64.0);
  vec3  ambient = vec3(0.05) * u_baseColor;

  vec3 color = ambient + u_baseColor * diffuse
             + vec3(1.0) * spec;
  gl_FragColor = vec4(color, 1.0);
}
```

</details>

## SDFs & raymarching {#sdf}

A signed distance function returns the distance to the nearest surface. March along the ray by that distance until you hit something.

### Sphere SDF

Negative inside, positive outside, zero on the surface.

```
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
```

### Raymarching loop

Advance `t` by the distance — it's safe because `d` is a lower bound.

```
float t = 0.0;
for (int i = 0; i < 64; i++) {
  float d = map(ro + rd * t);
  if (d < 0.001) break; // hit
  t += d;
  if (t > 100.0) break; // miss
}
```

### Boolean ops

Combine shapes with min/max — the whole power of SDFs in three lines.

```
float opUnion(float a, float b)     { return min(a, b); }
float opIntersect(float a, float b) { return max(a, b); }
float opSubtract(float a, float b)  { return max(a, -b); }
```

> **✓:** **Normals come free.** Differentiate the SDF with a numerical gradient to get the surface normal: `normalize(vec3(map(p+e)-map(p-e)))` sampled along each axis. No mesh needed.

## Common effects {#effects}

Small fragment-shader post-processes that transform the final image or synthesize detail.

### Value noise

Hash coordinates into pseudo-random noise.

```
float hash(vec2 p) {
  return fract(sin(dot(p,
    vec2(12.9898, 78.233))) *
    43758.5453);
}
```

### Vignette

Darken the corners to focus the frame.

```
float vig = smoothstep(0.8, 0.3,
  distance(v_uv, vec2(0.5)));
color *= vig;
```

### Gamma correction

Convert linear light back to display space.

```
color = pow(color, vec3(1.0 / 2.2));
```

### Posterization

Quantize to a small number of color levels.

```
float levels = 6.0;
color = floor(color * levels) / levels;
```

### Dithering

Add tiny noise to hide banding in gradients.

```
color += (hash(gl_FragCoord.xy) - 0.5)
         / 255.0;
```

### UV distortion

Wobble the UVs for a ripple or heat-haze look.

```
vec2 uv = v_uv + 0.02 *
  sin(v_uv * 10.0 + u_time);
```

## GLSL in OpenGL/WebGL {#gl}

Shaders are compiled and linked into a program on the CPU side, then fed values through uniforms and attributes.

1. **Compile** — Create a shader, attach source, compile, and check `GL_COMPILE_STATUS`.
1. **Link** — Attach both stages to a program and link them into a pipeline.
1. **Use** — Make the program current — all subsequent draws run through it.
1. **Set uniforms** — Look up locations and push values every time before drawing.

### OpenGL (C)

```
GLuint vs = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vs, 1, &src, NULL);
glCompileShader(vs);

GLuint prog = glCreateProgram();
glAttachShader(prog, vs);
glAttachShader(prog, fs);
glLinkProgram(prog);
glUseProgram(prog);
```

### Uniforms & attributes

Resolve locations once, set values per draw. WebGL uses `gl.getUniformLocation`.

```
GLint uLoc = glGetUniformLocation(prog, "u_time");
glUniform1f(uLoc, t);

GLint aLoc = glGetAttribLocation(prog, "a_pos");
glEnableVertexAttribArray(aLoc);
```

- `glUniform1f(loc, x)` — Set a float uniform.
- `glUniform3f(loc, x, y, z)` — Set a vec3 uniform.
- `glUniform1i(loc, n)` — Set an int or sampler unit.
- `glUniformMatrix4fv(loc, 1, GL_FALSE, m)` — Upload a mat4 (column-major).

## Pitfalls {#gotchas}

Small behaviors that break shaders in surprising ways — and how to avoid them.

### Swizzle lvalues

Assigning to a swizzled lvalue with a repeated component is a compile error — `v.xx = vec2(1.0)` won't build.

```
v.xyz = vec3(1.0); // ok
v.x = 1.0;         // ok
v.xx = vec2(1.0);  // ✗ invalid
```

### Precision on mobile

GLSL ES fragment shaders default to no float precision; declare it or compilation fails on some drivers.

```
precision mediump float; // first line
```

### Branch divergence

The GPU runs threads in lockstep warps; an `if` executes both sides and masks, so don't put huge work in branches.

```
// prefer step/mix/select
float v = step(0.5, x);
```

### Uniforms don't persist

Values reset when you re-link the program or the context is lost — set uniforms after `glUseProgram`, every frame.

```
glUseProgram(prog);
glUniform1f(uTime, now); // each frame
```

### Coordinate spaces

Know your origin: `gl_FragCoord` is bottom-left in OpenGL but top-left in many WebGL and texture conventions.

```
// flip if needed
vec2 uv = vec2(gl_FragCoord.x,
  u_res.y - gl_FragCoord.y) / u_res;
```

### Gamma vs linear

Do lighting math in linear space and gamma-correct only at the very end — never blend in sRGB.

```
color = pow(color, vec3(1.0 / 2.2)); // last step
```

### Legacy names removed

`texture2D()`, `textureCube()`, and `gl_FragColor` are gone in GLSL 3.30+ core and ES 3.00 (WebGL 2) — use `texture()` and a declared `out vec4`.

```
// ES 1.00 / GLSL 1.20 only
gl_FragColor = texture2D(tex, uv);
// modern
fragColor = texture(tex, uv);
```

### #version must be first

The `#version` directive must be the very first line — before comments, whitespace, or `precision`. A stray blank line breaks compilation on some drivers.

```
#version 300 es   // line 1
precision highp float;
in vec2 v_uv; out vec4 color;
```
