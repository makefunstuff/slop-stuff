---
title: "WebGPU"
description: "Devices, pipelines, buffers, WGSL shaders, and the render/compute pipeline."
category: "Graphics"
tags: ["graphics", "WGSL", "pipeline", "compute"]
weight: 420
lead: "The GPU API of the future."
version: "modern GPU API"
---
WebGPU gives the web low-level, modern access to the GPU: explicit devices, pipelines, buffers, and WGSL shaders — for rendering and compute that runs everywhere.

## Quick reference {#quickref}

The ten calls that carry most WebGPU programs, in roughly the order you use them. Everything else on this page builds on these.

- `navigator.gpu.requestAdapter()` — pick a physical GPU (async — null if WebGPU is unavailable)
- `adapter.requestDevice()` — open a logical device + its queue (async)
- `device.createShaderModule({ code })` — compile a WGSL string into a shader module
- `device.createRenderPipeline({ … })` — immutable render pipeline: shaders + vertex layout + targets
- `device.createComputePipeline({ … })` — immutable compute pipeline
- `device.createBindGroup({ layout, entries })` — attach buffers/textures to a bind group layout
- `device.queue.writeBuffer(buf, 0, data)` — upload data straight into a buffer
- `encoder.beginRenderPass({ … })` — open a render pass over a canvas view
- `pass.draw(n) · pass.dispatchWorkgroups(k)` — issue a draw / launch k compute workgroups
- `device.queue.submit([enc.finish()])` — execute the recorded command buffer

## The model {#start}

Everything starts with an adapter and a device. You record work into a command encoder, submit it to the queue, and the GPU runs it through a pipeline.

**Adapter** (navigator.gpu.requestAdapter()) → **Device** (adapter.requestDevice()) → **Queue** (device.queue) → **Encoder** (createCommandEncoder()) → **Pipeline** (render · compute)

### 1. Adapter

```
const adapter = await navigator.gpu.requestAdapter();
```

### 2. Device

```
const device = await adapter.requestDevice();
```

### 3. Encoder

```
const enc = device.createCommandEncoder();
```

### 4. Submit

```
device.queue.submit([enc.finish()]);
```

> **KEY:** **Everything is explicit.** The adapter picks a physical GPU, the device is a logical connection to it, the queue submits finished command buffers, and a pipeline fixes the shaders + state for a whole pass. There is no implicit global state.

## WGSL shaders {#wgsl}

WGSL is WebGPU's shading language. Shaders are strings compiled at pipeline-creation time; attributes start with `@`.

`@vertex` `@fragment` `@compute` `@group(0)` `@binding(0)` `@location(0)` `@builtin(position)` `@workgroup_size(64)`

### Minimal triangle shader

```
@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
  return vec4f(0.0, 0.0, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
```

### Structs & functions

```
struct VertexOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) color: vec4<f32>,
}

fn pow2(x: f32) -> f32 {
  return x * x;
}
```

| Builtin | Stage | Meaning |
| --- | --- | --- |
| `@builtin(position)` | vertex out / fragment in | clip-space position (vertex) / pixel coordinate (fragment) |
| `@builtin(vertex_index)` | vertex | index into the vertex buffer |
| `@builtin(instance_index)` | vertex | current instance number |
| `@builtin(front_facing)` | fragment | true if the fragment is on a front-facing triangle |
| `@builtin(global_invocation_id)` | compute | global thread id |
| `@builtin(local_invocation_id)` | compute | thread id within a workgroup |
| `@builtin(local_invocation_index)` | compute | linear (flat) index within a workgroup |
| `@builtin(workgroup_id)` | compute | which workgroup this thread belongs to |

## Render pipeline {#pipeline}

One descriptor bundles the WGSL module, vertex buffer layout, primitive topology, and color target format into an immutable `GPURenderPipeline`.

### Pipeline descriptor

```
const pipeline = device.createRenderPipeline({
  layout: "auto",
  vertex: {
    module, entryPoint: "vs_main",
    buffers: [{
      arrayStride: 12,
      attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
    }]
  },
  fragment: {
    module, entryPoint: "fs_main",
    targets: [{ format: presentationFormat }]
  },
  primitive: { topology: "triangle-list" }
});
```

### Render pass

```
const pass = encoder.beginRenderPass({
  colorAttachments: [{
    view: ctx.getCurrentTexture().createView(),
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
    loadOp: "clear", storeOp: "store"
  }]
});
pass.setPipeline(pipeline);
pass.draw(3);            // 3 vertices → 1 triangle
pass.end();
```

> **⌁:** `layout: "auto"` infers the pipeline layout from the shaders' `@group`/`@binding`. For explicit control, create a `GPUPipelineLayout` from the same `GPUBindGroupLayout` objects you use for your bind groups.

## Buffers & bind groups {#buffers}

GPU data lives in `GPUBuffer` objects. Shaders reach them through bind groups, described by a bind group layout.

### Create a buffer

```
const buf = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM
    | GPUBufferUsage.COPY_DST
});
device.queue.writeBuffer(buf, 0,
  new Float32Array([1, 0, 0, 0]));
```

### Bind group layout

```
const bgl = device.createBindGroupLayout({
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX
      | GPUShaderStage.FRAGMENT,
    buffer: { type: "uniform" }
  }]
});
```

### Bind group

```
const group = device.createBindGroup({
  layout: bgl,
  entries: [{ binding: 0,
    resource: { buffer: buf } }]
});
pass.setBindGroup(0, group);
```

| Buffer role | Bind type | Notes |
| --- | --- | --- |
| Uniform | `"uniform"` | small, read-only, same value for every invocation |
| Storage | `"storage"` | large read/write, array-style, needs `STORAGE` usage |
| Read-only storage | `"read-only-storage"` | storage declared `read` in WGSL |
| Vertex | pipeline `vertex.buffers` | set with `setVertexBuffer`, not a bind group |
| Index | `setIndexBuffer` | `uint16` or `uint32` indices |

## Compute shaders {#compute}

Compute dispatches a grid of threads that read and write storage buffers — no render pass, no color target.

### Compute shader

```
@group(0) @binding(0)
var<storage, read_write> data: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  data[id.x] *= 2.0;
}
```

### Dispatch it

```
const cp = device.createComputePipeline({
  layout: "auto",
  compute: { module, entryPoint: "main" }
});
const pass = encoder.beginComputePass();
pass.setPipeline(cp);
pass.setBindGroup(0, group);
pass.dispatchWorkgroups(Math.ceil(n / 64));
pass.end();
device.queue.submit([encoder.finish()]);
```

> **✓:** **Workgroups:** `@workgroup_size(64)` fixes the threads per workgroup, `dispatchWorkgroups(k)` launches `k` workgroups, and each thread identifies itself via `@builtin(global_invocation_id)` — roughly `workgroup_id * 64 + local_invocation_id`.

## Drawing {#render}

Rendering means configuring a canvas, opening a render pass, binding a pipeline, and issuing draw calls.

1. #### Get the context

```
const ctx = canvas.getContext("webgpu");
```
1. #### Configure the canvas

```
ctx.configure({
  device,
  format: navigator.gpu.getPreferredCanvasFormat(),
  alphaMode: "opaque"
});
```
1. #### Grab the frame

```
const view = ctx.getCurrentTexture().createView();
```
1. #### Begin the render pass

```
const pass = encoder.beginRenderPass({
  colorAttachments: [{ view,
    clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
    loadOp: "clear", storeOp: "store" }]
});
```
1. #### Draw & submit

```
pass.setPipeline(pipeline);
pass.draw(3);
pass.end();
device.queue.submit([encoder.finish()]);
```
- `pass.draw(n)` — draw n vertices, non-indexed
- `pass.draw(n, instances)` — instanced draw
- `pass.drawIndexed(n)` — draw n indices from an index buffer
- `pass.drawIndirect(buf, off)` — GPU-driven draw from a buffer
- `pass.setVertexBuffer(0, buf)` — attach vertex data to slot 0
- `pass.setIndexBuffer(ib, "uint32")` — attach index data

<details>
<summary>Full triangle, end to end</summary>

#### JavaScript

```
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const ctx = canvas.getContext("webgpu");
ctx.configure({ device, format: "bgra8unorm" });

const shader = device.createShaderModule({ code });
const pipeline = device.createRenderPipeline({
  layout: "auto",
  vertex: { module: shader, entryPoint: "vs_main" },
  fragment: { module: shader, entryPoint: "fs_main",
    targets: [{ format: "bgra8unorm" }] },
  primitive: { topology: "triangle-list" }
});

const enc = device.createCommandEncoder();
const pass = enc.beginRenderPass({
  colorAttachments: [{
    view: ctx.getCurrentTexture().createView(),
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
    loadOp: "clear", storeOp: "store"
  }]
});
pass.setPipeline(pipeline);
pass.draw(3);
pass.end();
device.queue.submit([enc.finish()]);
```

#### WGSL

```
@vertex
fn vs_main(@builtin(vertex_index) i: u32)
  -> @builtin(position) vec4<f32> {
  return vec4f(0, 0, 0, 1);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4f(1, 0, 0, 1);
}
```

</details>

## wgpu (Rust/native) {#native}

`wgpu` is the Rust implementation of the same model — currently at `v26` — and also ships inside Firefox and Deno. Dawn (C++) powers Chromium; all speak WGSL, so shaders port unchanged.

### wgpu in Rust

```
let instance = wgpu::Instance::default();
let adapter = instance
  .request_adapter(&wgpu::RequestAdapterOptions::default())
  .await?;
let (device, queue) = adapter
  .request_device(&wgpu::DeviceDescriptor::default(), None)
  .await?;
let encoder = device.create_command_encoder(
  &wgpu::CommandEncoderDescriptor::default());
queue.submit([encoder.finish()]);
```

### Same model, three surfaces

```
// JavaScript (browser)
const d = await navigator.gpu.requestAdapter();
const dev = await d.requestDevice();

// Rust (wgpu)
let (device, queue) = adapter
  .request_device(&desc, None).await?;

// C++ (Dawn)
wgpu::Device device = instance.RequestDevice();
```

- `navigator.gpu` ships in Chrome/Edge 113+, Safari 26+, Firefox 141+.
- Native over Vulkan, Metal, DX12 — `v26` is current. Powers Firefox & Deno.
- Chromium's implementation (Chrome & Edge).
- Unflagged `navigator.gpu` in Node 22+; Deno ships WebGPU too.

## Pitfalls {#gotchas}

The errors are validation messages at submit time, so they surface late. These are the usual suspects.

### Bind group vs layout mismatch

Every `createBindGroup` layout must match the pipeline layout exactly — same bindings, types, and visibility. `layout: "auto"` infers it from the shader, so change one and you must change the other.

### Buffer usage flags

A buffer can only do what it was created to do. Forgetting `COPY_DST` breaks `writeBuffer`; forgetting `STORAGE` breaks a storage binding.

```
usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
```

### Adapter/device are async

`requestAdapter()` and `requestDevice()` return promises. `await` them — and handle `null` when WebGPU isn't available.

```
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error("no WebGPU");
```

### WGSL syntax

`fn` not `function`, `let` for constants and `var` for mutable, `->` for return type, types after names (`vec3<f32>`), `@` attributes. No implicit conversions.

### Limits & features

Optional features and raised limits must be requested up front; an unsupported request makes `requestDevice()` resolve to `null`.

```
const device = await adapter.requestDevice({
  requiredFeatures: ["timestamp-query"],
  requiredLimits: { maxStorageBufferBindingSize: 1 << 30 }
});
```

### Canvas format must match

The `configure()` format and every pipeline's `fragment.targets` format must be identical — use `navigator.gpu.getPreferredCanvasFormat()`.

### Command buffers are single-use

Once you call `finish()` the encoder is spent — you can't add to it or submit it twice. Build a fresh encoder every frame.

```
const enc = device.createCommandEncoder();
// … record work …
device.queue.submit([enc.finish()]);
// enc is now invalid — create a new one next frame
```

### Don't touch buffers the GPU is reading

`writeBuffer`, `mapAsync`, or `destroy()` on a buffer still in flight is a validation error. Wait for the queue to drain, or use extra buffers.

```
await device.queue.onSubmittedWorkDone();
device.queue.writeBuffer(buf, 0, nextData);
```

> **⚠:** **Check the console.** WebGPU reports misuse as asynchronous `uncapturederror` events with `GPUValidationError` strings. Add a listener during development — and wrap suspicious calls in `pushErrorScope()` / `popErrorScope()` to catch the error where it's raised — so failures don't vanish silently.
