---
title: "OpenGL"
description: "Buffers, VAOs, shaders, textures, framebuffers, and the core profile."
category: "Graphics"
tags: ["graphics", "VBO", "VAO", "framebuffer"]
weight: 400
lead: "The graphics API that started it all."
version: "4.6 · final"
---
OpenGL is the cross-platform graphics API that shaped two decades of games and GPUs. The modern `core` profile throws away fixed-function state — you manage buffers, shaders, and pipeline state yourself. Spec work froze at **OpenGL 4.6** (2017); for new projects Khronos points to **Vulkan**, with **WebGPU** on the web.

## Quick reference {#quickref}

The calls that carry most OpenGL programs, in roughly the order you use them. Everything below builds on these.

- `glfwCreateWindow(…) · glfwMakeContextCurrent(win)` — open a window and make its GL context current for the calling thread
- `glGenBuffers · glBindBuffer · glBufferData` — create a VBO and upload vertex data to `GL_ARRAY_BUFFER`
- `glGenVertexArrays · glVertexAttribPointer` — bind a VAO and map attributes onto shader locations
- `glCreateShader · glCompileShader · glLinkProgram` — build a shader program from GLSL sources, then `glUseProgram`
- `glGenTextures · glTexImage2D · glActiveTexture` — create a texture, upload pixels, and bind it to a unit
- `glGenFramebuffers · glBindFramebuffer` — render off-screen; binding `0` targets the window again
- `glClearColor · glClear(GL_COLOR_BUFFER_BIT | …)` — clear the color / depth / stencil buffers each frame
- `glDrawArrays(…) · glDrawElements(…)` — issue a draw from a bound VAO — non-indexed vs indexed

## Init & context {#start}

Get a window with an OpenGL context, load the function pointers, then clear and swap every frame. GLFW is the common path; SDL2 works the same way.

### 1. Window + context

```
glfwInit();
glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
GLFWwindow* win = glfwCreateWindow(800, 600, "GL", 0, 0);
glfwMakeContextCurrent(win);
```

### 2. Load functions

```
if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    /* loader failed */
// SDL2: (GLADloadproc)SDL_GL_GetProcAddress
```

### 3. Viewport

```
glViewport(0, 0, 800, 600);
// on resize: glViewport(0, 0, w, h)
```

### 4. Clear

```
glClearColor(0.1f, 0.1f, 0.15f, 1.0f);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
```

1. **Create the context** — `glfwCreateWindow` then `glfwMakeContextCurrent` makes the window's GL context current for the calling thread.
1. **Load the entry points** — GLAD (or GLEW) fills every `gl*` symbol via the driver's `GetProcAddress`.
1. **Configure GL** — Set the viewport with `glViewport` and the clear color with `glClearColor`.
1. **Loop, clear, swap** — Each frame: `glClear`, draw, then `glfwSwapBuffers` to present.

<details>
<summary>SDL2 window instead of GLFW</summary>

#### SDL2 context

```
SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
SDL_Window* w = SDL_CreateWindow("GL", 0, 0, 800, 600, SDL_WINDOW_OPENGL);
SDL_GLContext ctx = SDL_GL_CreateContext(w);
```

#### Swap buffers

```
// GLFW
glfwSwapBuffers(win);
glfwPollEvents();

// SDL2
SDL_GL_SwapWindow(w);
```

</details>

> **4.6:** **OpenGL 4.6 is the final version.** Spec work froze in 2017 — `#version 460 core` is the newest GLSL, though `#version 330 core` below remains the common teaching baseline. Windows and Linux drivers expose 4.6, but macOS caps at **4.1 core** (deprecated since 10.14). Khronos's successor is **Vulkan**.

## Buffers & VAOs {#buffers}

A VBO holds vertex data, an EBO holds indices, and a VAO records how those buffers map onto shader inputs. Bind the VAO, then draw.

### VBO — vertex data

```
unsigned int vbo;
glGenBuffers(1, &vbo);
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(verts), verts, GL_STATIC_DRAW);
```

### VAO — layout

```
unsigned int vao;
glGenVertexArrays(1, &vao);
glBindVertexArray(vao);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE,
                      3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
```

### EBO — indices

```
unsigned int ebo;
glGenBuffers(1, &ebo);
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(idx), idx, GL_STATIC_DRAW);
```

**VBO** (vertex data) → **VAO** (attribute layout) → **Program** (vertex + fragment) → **Draw call** (glDrawElements) → **Framebuffer** (pixels)

| glVertexAttribPointer arg | Meaning | Typical value |
| --- | --- | --- |
| `index` | attribute location | `0`, `1`, `2`… |
| `size` | components per vertex | `3` for a `vec3` |
| `type` | component type | `GL_FLOAT` |
| `normalized` | map ints to [0,1] | `GL_FALSE` |
| `stride` | bytes between vertices | `sizeof(Vertex)` |
| `pointer` | byte offset of this attribute | `(void*)offsetof(Vertex, uv)` |

> **KEY:** **Unbind in the right order.** A VAO stores its `GL_ELEMENT_ARRAY_BUFFER` binding but not the `GL_ARRAY_BUFFER`. Unbind the VAO *before* unbinding the EBO, or the element binding is lost.

## Shaders {#shaders}

Compile a vertex and a fragment shader from GLSL source, link them into a program, set uniforms, then issue a draw call.

### Compile a shader

```
unsigned int vs = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vs, 1, &vsSrc, 0);
glCompileShader(vs);
// check GL_COMPILE_STATUS, read info log
```

### Link the program

```
unsigned int prog = glCreateProgram();
glAttachShader(prog, vs);
glAttachShader(prog, fs);
glLinkProgram(prog);
glUseProgram(prog);
```

### Set uniforms

```
int loc = glGetUniformLocation(prog, "uColor");
glUniform4f(loc, 1.0f, 0.5f, 0.2f, 1.0f);
```

### Draw

```
glDrawArrays(GL_TRIANGLES, 0, 36);
// or indexed:
glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, 0);
```

1. **Create** — `glCreateShader(GL_VERTEX_SHADER)` and `GL_FRAGMENT_SHADER`.
1. **Source + compile** — `glShaderSource` then `glCompileShader`. Compile status is silent — query it.
1. **Attach + link** — `glAttachShader` each stage, then `glLinkProgram` into a program.
1. **Use + draw** — `glUseProgram(prog)`, set uniforms, bind the VAO, and draw.

### Uniform setters

- `glUniform1f / 2f / 3f / 4f` — scalars and vectors.
- `glUniform1i` — int / sampler unit.
- `glUniform3fv / 4fv` — arrays of vectors.
- `glUniformMatrix4fv` — mat4 (count, transpose=false).

### GLSL core notes

```
#version 330 core
layout(location = 0) in vec3 aPos;
uniform mat4 uMVP;
out vec2 vUV;

void main() {
    gl_Position = uMVP * vec4(aPos, 1.0);
    vUV = aUV;
}
```

## Textures {#textures}

Upload image data with `glTexImage2D`, bind the texture to a unit with `glActiveTexture`, and point a sampler uniform at that unit.

### Create + upload

```
unsigned int tex;
glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, w, h, 0,
             GL_RGB, GL_UNSIGNED_BYTE, data);
```

### Filter & wrap

```
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
```

### Mipmaps

```
glGenerateMipmap(GL_TEXTURE_2D);
// uses GL_TEXTURE_MIN_FILTER mipmap modes
// GL_LINEAR_MIPMAP_LINEAR = trilinear
```

### Bind to a unit + sample

```
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, tex);
glUniform1i(glGetUniformLocation(prog, "uTex"), 0);
```

### Internal formats

`GL_RGB8` `GL_RGBA8` `GL_RGBA16F` `GL_SRGB8_ALPHA8` `GL_DEPTH24_STENCIL8`

Internal format = storage precision; the two formats in `glTexImage2D` are the source pixel layout.

| Enum | Effect |
| --- | --- |
| `GL_NEAREST` | No interpolation — crisp, blocky. |
| `GL_LINEAR` | Bilinear filtering between texels. |
| `GL_LINEAR_MIPMAP_LINEAR` | Trilinear — the usual choice for min filter. |
| `GL_REPEAT` | Tile the texture. |
| `GL_MIRRORED_REPEAT` | Tile with mirroring. |
| `GL_CLAMP_TO_EDGE` | Clamp UVs to the edge texel. |

## Framebuffers {#framebuffers}

Render into an off-screen framebuffer object (FBO) instead of the window, then sample the result — the core of post-processing, shadow maps, and picking.

### FBO + color texture

```
unsigned int fbo;
glGenFramebuffers(1, &fbo);
glBindFramebuffer(GL_FRAMEBUFFER, fbo);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                       GL_TEXTURE_2D, tex, 0);
```

### Depth / stencil

```
// renderbuffer for depth-stencil
glFramebufferRenderbuffer(GL_FRAMEBUFFER,
    GL_DEPTH_STENCIL_ATTACHMENT,
    GL_RENDERBUFFER, rbo);
```

### Check completeness

```
if (glCheckFramebufferStatus(GL_FRAMEBUFFER)
    != GL_FRAMEBUFFER_COMPLETE)
    /* incomplete — bad attachment */
```

1. **Bind the FBO** — `glBindFramebuffer(GL_FRAMEBUFFER, fbo)` redirects all drawing.
1. **Render the scene** — Draw normally — the color lands in the attached texture, depth in the renderbuffer.
1. **Back to default** — `glBindFramebuffer(GL_FRAMEBUFFER, 0)` targets the window.
1. **Sample + draw quad** — Bind the color texture and draw a fullscreen quad with a screen shader.
> **⌁:** **Post-processing = two passes.** Pass 1 renders the scene into the FBO's texture; pass 2 draws a fullscreen quad that samples that texture, applying tone mapping, blur, or vignette in the fragment shader.

## State & blending {#state}

OpenGL is a state machine: `glEnable` turns capabilities on, and they stay on until you disable them.

- **Depth test** — `GL_DEPTH_TEST` — off by default; enable for 3D depth.
- **Blend** — `GL_BLEND` — off; enable for transparency.
- **Cull face** — `GL_CULL_FACE` — off; skip backfaces with `glCullFace(GL_BACK)`.
- **Stencil** — `GL_STENCIL_TEST` — off; needs a stencil attachment.

| Capability | Enables | Note |
| --- | --- | --- |
| `GL_DEPTH_TEST` | depth comparison | needs a depth attachment |
| `GL_CULL_FACE` | backface culling | `glCullFace(GL_BACK)` |
| `GL_BLEND` | alpha blending | set factors with `glBlendFunc` |
| `GL_STENCIL_TEST` | stencil buffer ops | needs a stencil attachment |
| `GL_SCISSOR_TEST` | clip to a rectangle | `glScissor(x, y, w, h)` |

### Enable / depth / cull

```
glEnable(GL_DEPTH_TEST);
glDepthFunc(GL_LESS);      // default compare
glEnable(GL_CULL_FACE);
glCullFace(GL_BACK);
```

### Blend + clear bits

```
glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
```

## Modern techniques {#modern}

Beyond the basics: draw thousands of instances in one call, skip bindings with direct state access, and route driver errors to a callback.

### Instancing

```
glDrawArraysInstanced(GL_TRIANGLES, 0, 36, 1000);
glDrawElementsInstanced(GL_TRIANGLES, 36, GL_UNSIGNED_INT, 0, 1000);
// per-instance attribute advances once per instance:
glVertexAttribDivisor(1, 1);
```

### Direct state access (DSA)

```
glCreateBuffers(1, &vbo);
glNamedBufferData(vbo, sizeof(verts), verts, GL_STATIC_DRAW);
glTextureParameteri(tex, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
```

### Debug output

```
glEnable(GL_DEBUG_OUTPUT);
glDebugMessageCallback(msgCallback, 0);
// KHR_debug: source, type, severity
```

### Vertex layout (interleaved)

```
struct Vertex {
    float pos[3];   // offset 0
    float nrm[3];   // offset 12
    float uv[2];    // offset 24
};
// stride = sizeof(Vertex) = 32 bytes
```

<details>
<summary>Reading shader compile / link logs</summary>

#### Shader compile log

```
int ok; glGetShaderiv(vs, GL_COMPILE_STATUS, &ok);
if (!ok) {
    char log[512];
    glGetShaderInfoLog(vs, 512, 0, log);
    printf("%s\n", log);
}
```

#### Program link log

```
glGetProgramiv(prog, GL_LINK_STATUS, &ok);
if (!ok) {
    char log[512];
    glGetProgramInfoLog(prog, 512, 0, log);
    printf("%s\n", log);
}
```

</details>

## Pitfalls {#gotchas}

The mistakes that turn a black screen into an hour of debugging. Most are silent — check, don't assume.

### Core vs compatibility

The core profile removed `glBegin`/`glEnd`, `glMatrixMode`, and the fixed-function pipeline. Everything goes through VBOs, VAOs, and shaders.

```
glBegin(GL_TRIANGLES);  // not in core profile
```

### Bind before you use

Objects must be bound before configuring them. `glBufferData` targets whatever is currently bound — an unbound buffer is a silent no-op.

```
glBindBuffer(GL_ARRAY_BUFFER, vbo); // first
glBufferData(...);                   // then
```

### Texture unit confusion

`glActiveTexture` picks the unit; `glBindTexture` binds into it. The sampler uniform takes the unit index (`0`), not the texture id.

```
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, tex);
glUniform1i(uTex, 0);  // unit, not tex
```

### Attribute location mismatch

The `index` in `glVertexAttribPointer` must match the shader's `location`. Fix it in GLSL or with `glBindAttribLocation` before linking.

```
layout(location = 0) in vec3 aPos;
glVertexAttribPointer(0, 3, ...); // index 0
```

### Bottom-left origin

GL's NDC and texture coordinate origin is bottom-left; most image loaders produce top-left rows. Flip UVs or the image, or models appear upside down.

```
// top-left → bottom-left: v = 1.0f - v
```

### Shader errors are silent

Compile and link failures never throw. Always check `GL_COMPILE_STATUS` / `GL_LINK_STATUS` and print the info log, or you'll stare at a blank screen.

```
glGetShaderiv(vs, GL_COMPILE_STATUS, &ok);
```

### Mipmap completeness → black

If the min filter requests mipmaps but you never call `glGenerateMipmap`, the texture is *incomplete* and every sample comes back black. Any mipmap filter mode requires the full chain to exist.

```
glGenerateMipmap(GL_TEXTURE_2D); // required
```

### macOS is frozen at 4.1

Apple deprecated OpenGL in macOS 10.14 (Mojave); the last supported version is **4.1 core**, so 4.2+ features like compute shaders and DSA never arrive there. Target Metal, MoltenVK, or WebGPU instead.

```
glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1); // macOS
```

### Framebuffer ≠ window size

On Retina/high-DPI displays the framebuffer is larger than the window. Size the viewport from `glfwGetFramebufferSize`, not `glfwGetWindowSize`, or the scene renders into a blurry corner.

```
int fbw, fbh; glfwGetFramebufferSize(win, &fbw, &fbh);
glViewport(0, 0, fbw, fbh);
```

> **!:** **Validate during development.** A missing `glBindVertexArray` is valid state but produces nothing. Use [RenderDoc](https://renderdoc.org/) or `GL_KHR_debug` to catch invalid operations early.
