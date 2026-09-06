---
title: "ComfyUI nodes"
description: "Node herding for SlopGen ComfyUI — core graph, samplers, loaders, ControlNet, video packs, kill-list."
category: "Graphics"
tags: ["ComfyUI", "latent", "sampler", "Flux", "LTXV"]
weight: 425
lead: "Wire the graph — don't pray to the UI."
version: "SlopGen inventory · 1195 nodes"
---
Cheatsheet for **[SlopGen](http://slopgen.jurip.xyz/)** ComfyUI (`object_info` snapshot: **1195** nodes). Core graph first; then what's actually installed on that box (AnimateDiff, LTXV, Wan, partner APIs, …). Custom packs come and go — treat pack sections as inventory notes, not eternal API.

## Quick reference {#quickref}

**Minimal txt2img (SD/Flux-style):**

```
CheckpointLoaderSimple → CLIPTextEncode(+) / CLIPTextEncode(−)
                      → EmptyLatentImage
                      → KSampler → VAEDecode → SaveImage
         MODEL/CLIP/VAE ──────────┘
```

| Knob | Typical | Notes |
| --- | --- | --- |
| `steps` | 20–30 | fewer with distilled/turbo; LCM ~4–8 |
| `cfg` | 3.5–7 Flux · ~7–8 SDXL default in UI | too high → fried / overcooked |
| `denoise` | `1.0` txt2img · `0.35–0.75` img2img | structure from init latent |
| latent size | multiple of **8** | SDXL often 1024²; Flux often 1024+ |
| scheduler | `karras` / `normal` / `simple` | pair with sampler; don't cargo-cult |

**Type wires that matter:** `MODEL` · `CLIP` · `VAE` · `CONDITIONING` · `LATENT` · `IMAGE` · `MASK` · `CONTROL_NET` · `LORA`

## Graph anatomy {#graph}

| Stage | Job | Core nodes (this install) |
| --- | --- | --- |
| Load | weights into graph | `CheckpointLoaderSimple`, `UNETLoader`, `CLIPLoader`, `VAELoader`, `LoraLoader`, `ControlNetLoader`, `UpscaleModelLoader` |
| Condition | text / control → CONDITIONING | `CLIPTextEncode`, `CLIPTextEncodeSDXL`, `CLIPTextEncodeFlux`, `ControlNetApplyAdvanced`, `FluxGuidance` |
| Latent | canvas / encode pixels | `EmptyLatentImage`, `EmptySD3LatentImage`, `EmptyFlux2LatentImage`, `VAEEncode`, `VAEEncodeForInpaint` |
| Sample | denoise | `KSampler`, `KSamplerAdvanced`, `SamplerCustomAdvanced` |
| Decode | latent → pixels | `VAEDecode`, `VAEDecodeTiled` |
| I/O | disk / preview | `LoadImage`, `SaveImage`, `PreviewImage` |

> **KEY:** Checkpoint loaders spit **MODEL + CLIP + VAE**. Flux/SD3-style graphs often load UNET/CLIP/VAE **separately** — don't assume one `.safetensors` always means all three.

## Loaders {#loaders}

| Node | Outputs | Use |
| --- | --- | --- |
| `CheckpointLoaderSimple` | MODEL, CLIP, VAE | single-file ckpt |
| `UNETLoader` / `CLIPLoader` / `VAELoader` | pieces | Flux / modular pipelines |
| `DualCLIPLoader` / `TripleCLIPLoader` | CLIP | multi-encoder models |
| `LoraLoader` | MODEL, CLIP | strength_model / strength_clip (can be negative) |
| `LoraLoaderModelOnly` | MODEL | skip CLIP patch |
| `ControlNetLoader` | CONTROL_NET | pair with Apply* |
| `UpscaleModelLoader` | UPSCALE_MODEL | with `ImageUpscaleWithModel` |

**Checkpoints seen on SlopGen (examples):** `flux1-dev-fp8`, `sd_xl_base_1.0`, `ltx-2.3-22b-…`, `hunyuan_3d_v2.1`, DynamiCrafter/ToonCrafter. Refresh via the loader dropdown — inventory changes.

## Conditioning {#conditioning}

| Node | Role |
| --- | --- |
| `CLIPTextEncode` | generic positive/negative text |
| `CLIPTextEncodeSDXL` / `…Refiner` / `…SD3` | architecture-specific text encode |
| `CLIPTextEncodeFlux` + `FluxGuidance` | Flux text + guidance helper |
| `ControlNetApplyAdvanced` | pos/neg + image + strength + start/end % |
| `InstructPixToPixConditioning` | edit conditioning |
| `GLIGENTextBoxApply` | grounded boxes |
| `PhotoMakerEncode` | identity stack |

ControlNet: preprocess the guide image **outside** or via detection nodes (`image/detection`), then `ControlNetApplyAdvanced` — prefer Advanced over legacy `ControlNetApply`.

## Samplers & schedulers {#sampling}

`KSampler` inputs: model, seed, steps, cfg, **sampler_name**, **scheduler**, positive, negative, latent_image, denoise.

**Samplers on this build (subset of the long enum):**  
`euler`, `euler_ancestral`, `heun`, `dpm_2`, `dpmpp_2m`, `dpmpp_2m_sde`, `dpmpp_3m_sde`, `ddim`, `uni_pc`, `lcm`, `res_multistep`, … (+ many `_cfg_pp` / `_gpu` variants).

**Schedulers:** `simple`, `sgm_uniform`, `karras`, `exponential`, `ddim_uniform`, `beta`, `normal`, `linear_quadratic`, `kl_optimal`.

| Goal | Try |
| --- | --- |
| General SDXL | `dpmpp_2m` + `karras` |
| Ancestral variation | `euler_ancestral` / `dpmpp_2s_ancestral` |
| Few-step / LCM LoRA | `lcm` + low steps |
| Fine control | `KSamplerAdvanced` (start/end step, leftover noise) |

`denoise < 1` needs a meaningful init latent (`VAEEncode` or previous sample) — otherwise you're just dimming noise.

## Latent & VAE {#latent}

| Node | Notes |
| --- | --- |
| `EmptyLatentImage` | w/h step **8**; batch_size |
| `VAEEncode` / `VAEDecode` | match VAE to model family |
| `VAEEncodeForInpaint` | hole + mask aware |
| `VAEDecodeTiled` / `VAEEncodeTiled` | VRAM lifeline |
| `SetLatentNoiseMask` | inpaint / regional |
| `LatentUpscale` / `LatentUpscaleBy` | before second sample pass |

Wrong VAE (SD1.5 VAE on SDXL, etc.) → gray sludge / pink nonsense. When in doubt, use the VAE from the same loader stack.

## Image I/O & utils {#image}

`LoadImage` · `LoadImageMask` · `SaveImage` · `PreviewImage` · `ImageScale` / `ImageScaleBy` · `ImageUpscaleWithModel` · `ImageCompositeMasked` · `RemoveBackground` · mask ops under `image/mask`.

## Workflow recipes {#recipes}

### txt2img
Loader → +/− encode → EmptyLatent → KSampler (denoise 1) → VAEDecode → Save

### img2img
LoadImage → VAEEncode → KSampler (**denoise 0.35–0.75**) → Decode

### Inpaint
LoadImage + mask → `VAEEncodeForInpaint` (or encode + `SetLatentNoiseMask`) → sample → decode

### 2-pass upscale
Sample → Decode → `ImageUpscaleWithModel` or latent upscale → second KSampler at lower denoise

### ControlNet
Guide image → (optional preprocessor) → `ControlNetLoader` → `ControlNetApplyAdvanced` on +/− → sample

## SlopGen inventory notes {#inventory}

Pulled from live `object_info` (counts approximate by name prefix/category):

| Family | ~Nodes | What it's for |
| --- | --- | --- |
| **AnimateDiff (ADE_*)** | ~143 | motion modules, context opts, LoRA hooks |
| **LTXV / Lightricks** | ~84+ | LTX video latents, samplers, AV |
| **Wan*** | ~41 | Wan video I2V / control / audio dance |
| **ComfyUI-Frame-Interpolation** | VFI | frame interp loaders/nodes |
| **DynamiCrafterWrapper** | dozen | I2V / toon crafter style |
| **partner/** | many | hosted image/video/3d/audio APIs (Kling, Recraft, Tripo, …) |
| **Woosh/** | few | custom load/encode/sample helpers |
| **3d / mesh / splat** | dozens | meshing & Gaussian-ish paths |
| **audio / QwenTTS** | present | TTS / audio encode paths |

Partner nodes need API credentials and are **not** local diffusion — don't debug them like KSampler graphs.

## AI-slop kill-list {#gotchas}

| Slop | Reality |
| --- | --- |
| Random CFG 15 “for sharpness” | Overcooks; use model-appropriate CFG |
| Any VAE with any UNET | Family must match |
| `denoise=1` on img2img and expecting the photo | You're reinventing txt2img |
| Ignoring latent multiple-of-8 | Subtle crops / errors |
| Mixing SDXL CLIP encode with Flux UNET | Graph type-checks may pass; results won't |
| “More steps always better” | Plateaus; wastes time |
| Forgetting negative prompt on SD-family | Often matters; Flux stacks differ |
| ControlNet strength 2.0 forever | Start ~0.6–1.0; use start/end % |
| Tiled VAE “always” | Slower; use when VRAM hurts |
| Assuming custom ADE/LTXV nodes are core Comfy | Pack-specific; break when pack updates |
| Partner node failures = sampler bug | Check API keys / quotas |
| Publishing every LoRA filename from the box | Inventory is private — don't mirror NSFW lists into public docs |

## Refs {#refs}

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) · examples in-repo
- Live graph UI: [slopgen.jurip.xyz](http://slopgen.jurip.xyz/) (LAN / HTTP from your network)
- Node schema: `GET /object_info` on that host
- AnimateDiff pack docs (Kosinkadink) · LTXV / Wan model cards for architecture-specific encodes
