---
title: "SDL2/SDL3"
description: "Game loop, window, rendering, input, audio, and textures with SDL2/SDL3."
category: "Game dev"
tags: ["gamedev", "game loop", "renderer", "events"]
weight: 440
lead: "Multimedia, cross-platform."
version: "SDL2 · SDL3"
---
SDL is the C library behind countless games: one thin, portable layer over windowing, rendering, input, audio, and timing. Two major versions exist — `SDL2` and `SDL3` — and this guide covers both. SDL3 is the actively developed stable line (the 3.4.x series at the time of writing).

## Quick reference {#quickref}

The handful of calls every SDL program touches — init, window, renderer, the loop, textures, audio, and time. SDL3 forms shown; SDL2 noted where it differs.

### Init

```
SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO);
// SDL3: returns bool; SDL2: < 0 = error
```

### Window & renderer

```
SDL_Window *w =
    SDL_CreateWindow("game", 800, 600, 0);
SDL_Renderer *r =
    SDL_CreateRenderer(w, NULL);   // SDL3
// SDL2: SDL_CreateRenderer(w, -1,
//   SDL_RENDERER_ACCELERATED);
```

### Game loop

```
while (running) {
    poll_events();
    update(dt);
    draw();   // clear, copy, present
}
```

### Poll events

```
SDL_Event e;
while (SDL_PollEvent(&e))
    if (e.type == SDL_EVENT_QUIT) // SDL2: SDL_QUIT
        running = false;
```

### Textures

```
SDL_Texture *t =
    SDL_CreateTextureFromSurface(r, s);
SDL_RenderTexture(r, t, NULL, NULL);
// SDL2: SDL_RenderCopy(r, t, NULL, NULL)
```

### Audio (SDL3)

```
const SDL_AudioSpec spec =
    { SDL_AUDIO_S16, 2, 44100 };
SDL_AudioStream *st = SDL_OpenAudioDeviceStream(
    SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK,
    &spec, NULL, NULL);
SDL_ResumeAudioDevice(
    SDL_GetAudioStreamDevice(st));
SDL_PutAudioStreamData(st, buf, len);
```

### Ticks

```
Uint64 now = SDL_GetTicks();   // SDL2: SDL_GetTicks64()
Uint64 ns  = SDL_GetTicksNS();
Uint64 c   = SDL_GetPerformanceCounter();
```

### Teardown

```
SDL_DestroyTexture(tex);
SDL_DestroyRenderer(r);
SDL_DestroyWindow(w);
SDL_Quit();   // last
```

## Init & window {#start}

Initialize subsystems, create a window, then a renderer. Tear them down in reverse order and call `SDL_Quit` last.

### 1. Init

```
SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO);
// returns 0 on success, < 0 on error
```

### 2. Window

```
SDL_Window *w = SDL_CreateWindow(
    "My Game", SDL_WINDOWPOS_CENTERED,
    SDL_WINDOWPOS_CENTERED, 800, 600,
    SDL_WINDOW_SHOWN);
```

### 3. Renderer

```
SDL_Renderer *r = SDL_CreateRenderer(
    w, -1, SDL_RENDERER_ACCELERATED);
// SDL3: SDL_CreateRenderer(w, NULL);
```

### 4. Teardown

```
SDL_DestroyRenderer(r);
SDL_DestroyWindow(w);
SDL_Quit();  // shuts down every subsystem
```

<details>
<summary>SDL3: SDL_InitSubSystem & init flags</summary>

> **3:** **`SDL_Init(flags)` became `SDL_InitSubSystem(flags)`.** Bare `SDL_Init()` now initializes everything, and `SDL_QuitSubSystem()` tears one subsystem down. `SDL_INIT_GAMECONTROLLER` is now `SDL_INIT_GAMEPAD`, and most error returns are `bool`.

```
#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>

SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO);
SDL_InitSubSystem(SDL_INIT_JOYSTICK);
SDL_QuitSubSystem(SDL_INIT_JOYSTICK);
SDL_Quit();
```

</details>

## The game loop {#loop}

Poll events, advance your world with a fixed timestep, render, then present. Keep each frame deterministic and responsive.

1. **Poll events** — Drain the queue; the quit event flips a flag that ends the loop.
1. **Fixed timestep** — Step the simulation in fixed increments so physics behaves the same at any framerate.
1. **Delta time** — For smooth motion that scales with frame rate, scale by the elapsed time.
1. **Render** — Clear the backbuffer, draw your textures, then present once per frame.
1. **Sync** — Present blocks when vsync is enabled; otherwise cap the rate yourself with `SDL_Delay`.

## Rendering & textures {#render}

Draw through a renderer: clear the frame, copy textures, present. Think of `SDL_Texture` as the GPU copy and `SDL_Surface` as the CPU copy.

### Clear, copy & present

```
SDL_SetRenderDrawColor(r, 0, 0, 0, 255);
SDL_RenderClear(r);              // wipe the backbuffer
SDL_RenderCopy(r, tex, NULL, NULL);  // SDL3: SDL_RenderTexture
SDL_RenderPresent(r);            // swap to screen
```

### Making textures

```
SDL_Surface *s = SDL_LoadBMP("sprite.bmp");
SDL_Texture *t = SDL_CreateTextureFromSurface(r, s);
SDL_DestroySurface(s);   // SDL2: SDL_FreeSurface(s)

SDL_Texture *rt = SDL_CreateTexture(r,
    SDL_PIXELFORMAT_RGBA8888,
    SDL_TEXTUREACCESS_TARGET, 64, 64);
```

`STATIC` `STREAMING` `TARGET`

### Texture vs surface

`SDL_Texture` lives in GPU memory and is drawn by the renderer — filtered, scaled, and usable as a render target. `SDL_Surface` is a CPU pixel buffer you can lock, read, and poke. Convert once, then free it.

```
SDL_Texture *t =
    SDL_CreateTextureFromSurface(r, surface);
```

## Input & events {#input}

`SDL_Event` is a tagged union: check `.type`, then read the matching struct. Use keycode for meaning and scancode for position.

| Event | SDL2 type | SDL3 type | Read it as |
| --- | --- | --- | --- |
| Quit | `SDL_QUIT` | `SDL_EVENT_QUIT` | set `running = false` |
| Key down | `SDL_KEYDOWN` | `SDL_EVENT_KEY_DOWN` | `e.key.keysym.sym` → `e.key.key` |
| Key up | `SDL_KEYUP` | `SDL_EVENT_KEY_UP` | `e.key.keysym.sym` → `e.key.key` |
| Mouse button | `SDL_MOUSEBUTTONDOWN` | `SDL_EVENT_MOUSE_BUTTON_DOWN` | `e.button.button` (`SDL_BUTTON_LEFT`) |
| Mouse motion | `SDL_MOUSEMOTION` | `SDL_EVENT_MOUSE_MOTION` | `e.motion.x` / `.y` (floats in SDL3) |
| Gamepad button | `SDL_CONTROLLERBUTTONDOWN` | `SDL_EVENT_GAMEPAD_BUTTON_DOWN` | `e.cbutton.button` → `e.gbutton.button` |

<details>
<summary>Keycode vs scancode, and gamepads</summary>

#### Keycode vs scancode

A `SDL_Keycode` means “what key after layout” (press <kbd>Esc</kbd>); an `SDL_Scancode` means “where it physically sits”.

```
switch (e.key.keysym.sym) {       // SDL3: e.key.key
  case SDLK_ESCAPE: running = SDL_FALSE; break;
  case SDLK_SPACE:  jump(); break;
}
```

#### Game controller

`SDL_GameController` is renamed `SDL_Gamepad` in SDL3, and buttons are positional (`SOUTH` ≈ A).

```
SDL_GameController *pad =           // SDL3: SDL_Gamepad
    SDL_GameControllerOpen(0);      // SDL_OpenGamepad
if (SDL_GameControllerGetButton(
        pad, SDL_CONTROLLER_BUTTON_A))
    attack();
```

</details>

## Audio {#audio}

Open a device with an `SDL_AudioSpec`, feed it via callback or queue. SDL3 reworked this around `SDL_AudioStream`.

### SDL2: callback

```
void SDLCALL mix(void *ud, Uint8 *buf, int len) {
    // write `len` bytes of samples into `buf`
}

SDL_AudioSpec spec = {0};
spec.freq     = 44100;
spec.format   = AUDIO_S16;
spec.channels = 2;
spec.samples  = 1024;
spec.callback = mix;

SDL_AudioDeviceID dev =
    SDL_OpenAudioDevice(NULL, 0, &spec, NULL, 0);
SDL_PauseAudioDevice(dev, 0);   // unpause
```

### SDL2: queue + SDL_LoadWAV

```
Uint8 *wav; Uint32 wavlen;
SDL_AudioSpec wavspec;
SDL_LoadWAV("pop.wav", &wavspec, &wav, &wavlen);

SDL_QueueAudio(dev, wav, wavlen);
while (SDL_GetQueuedAudioSize(dev) > 0)
    SDL_Delay(10);

SDL_FreeWAV(wav);   // SDL3: SDL_free(wav)
```

<details>
<summary>SDL3 audio API changes</summary>

> **3:** **SDL3 dropped the callback-first model.** Bind an `SDL_AudioStream` to a device with `SDL_OpenAudioDeviceStream` and push data with `SDL_PutAudioStreamData`. `SDL_QueueAudio` is gone, and you must call `SDL_Init(SDL_INIT_AUDIO)` explicitly.

```
const SDL_AudioSpec spec = { SDL_AUDIO_S16, 2, 44100 };
SDL_AudioStream *stream = SDL_OpenAudioDeviceStream(
    SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, &spec, NULL, NULL);
SDL_ResumeAudioDevice(SDL_GetAudioStreamDevice(stream));

SDL_PutAudioStreamData(stream, wav, wavlen);  // was SDL_QueueAudio
```

</details>

## Surfaces & pixels {#surfaces}

`SDL_Surface` is a plain CPU pixel buffer — load, blit, or lock it to write pixels directly.

### Load & blit

```
SDL_Surface *img = SDL_LoadBMP("hero.bmp");
SDL_Rect dst = { x, y, img->w, img->h };
SDL_BlitSurface(img, NULL, screen, &dst);
SDL_DestroySurface(img);   // SDL2: SDL_FreeSurface
```

### Pixel formats

```
// 8 bits per channel, packed — stable names
SDL_PIXELFORMAT_RGBA8888
SDL_PIXELFORMAT_ARGB8888
SDL_PIXELFORMAT_RGB565
SDL_PIXELFORMAT_INDEX8

// SDL2: surface->format is SDL_PixelFormat*
Uint32 c = SDL_MapRGBA(img->format, 255, 0, 0, 255);
// SDL3: surface->format is an enum value
Uint32 c3 = SDL_MapRGBA(
    SDL_GetPixelFormatDetails(img->format),
    255, 0, 0, 255);
```

### Lock pixels

```
SDL_LockSurface(s);
// s->pixels is the raw buffer, s->pitch its stride
Uint32 *pixels = (Uint32 *)s->pixels;
pixels[y * (s->pitch / 4) + x] =
    SDL_MapRGBA(s->format, r, g, b, a);
SDL_UnlockSurface(s);
```

## Timing & misc {#timing}

Measure time with ticks or performance counters, schedule work with timers, and keep your resolution independent with a logical size.

### Ticks & counters

```
Uint64 ms = SDL_GetTicks64();   // SDL3: SDL_GetTicks()
Uint64 ns = SDL_GetTicksNS();   // SDL3 only

Uint64 c = SDL_GetPerformanceCounter();
Uint64 f = SDL_GetPerformanceFrequency();
double secs = (double)c / (double)f;
```

### Timers

```
Uint32 tick(Uint32 interval, void *ud) {
    SDL_Event e = {0};
    e.type = SDL_USEREVENT;
    SDL_PushEvent(&e);
    return interval;      // repeat
}
SDL_TimerID id = SDL_AddTimer(100, tick, NULL);
// ...
SDL_RemoveTimer(id);
```

### Logical size & threads

```
SDL_RenderSetLogicalSize(r, 320, 180);
// SDL3: SDL_SetRenderLogicalPresentation(r,
//   320, 180, SDL_LOGICAL_PRESENTATION_LETTERBOX);

int worker(void *data) { return 0; }
SDL_Thread *t = SDL_CreateThread(worker, "w", data);
int rc = 0; SDL_WaitThread(t, &rc);
```

## Pitfalls {#gotchas}

The mistakes that bite everyone once, and the SDL2→SDL3 renames that trip up migrations.

> **⚠:** **Destroy everything you create, in reverse order.** Textures before their renderer, the renderer before its window, and `SDL_Quit()` last. Leaked SDL objects hold GPU memory and can crash on exit.

### Init order matters

```
// 1. init subsystem   2. create window
// 3. create renderer  4. load assets
// 5. loop             6. destroy (reverse)
// 7. SDL_Quit()
if (SDL_Init(SDL_INIT_VIDEO) < 0) {
    SDL_Log("init failed: %s", SDL_GetError());
    return 1;
}
// SDL3: SDL_Init()/SDL_InitSubSystem() return bool
```

### Texture vs renderer lifetime

A texture belongs to the renderer that made it — never free the renderer first.

```
SDL_DestroyTexture(tex);   // FIRST
SDL_DestroyRenderer(r);    // then renderer
SDL_DestroyWindow(w);      // then window
SDL_Quit();                // last
```

### Pixel format endianness

`SDL_PIXELFORMAT_RGBA8888` packs red in the most-significant byte (`0xRRGGBBAA`); on little-endian CPUs the bytes land in memory as `A,B,G,R`. Index bytes by hand and you'll get swapped channels — let SDL map them instead.

```
Uint32 px = SDL_MapRGBA(s->format, 255, 0, 0, 255);
```

### SDL2 → SDL3 renames

`SDL_GetWindowSurface` exists in both versions (SDL3 re-added it in 3.2.0, paired with `SDL_DestroyWindowSurface`); most surfaces come from `SDL_CreateSurface`.

- `SDL_bool` — bool (true / false)
- `SDL_Init(flags)` — SDL_InitSubSystem(flags)
- `SDL_QUIT` — SDL_EVENT_QUIT
- `SDL_CreateRGBSurface` — SDL_CreateSurface
- `SDL_FreeSurface` — SDL_DestroySurface
- `SDL_RenderCopy` — SDL_RenderTexture
- `SDL_RenderCopyEx` — SDL_RenderTextureRotated
- `SDL_GetTicks64` — SDL_GetTicks
- `SDL_RenderSetVSync` — SDL_SetRenderVSync
- `SDL_GameController` — SDL_Gamepad
- `SDL_QueueAudio` — SDL_PutAudioStreamData
- `AUDIO_S16` — SDL_AUDIO_S16
- `SDL_FreeWAV` — SDL_free

### Vsync: property, not a flag

`SDL_RENDERER_PRESENTVSYNC` is gone in SDL3. Ask for vsync with a renderer property at creation, or toggle it at runtime with `SDL_SetRenderVSync`.

```
SDL_SetRenderVSync(r, 1);   // on; SDL2: SDL_RenderSetVSync(r, 1)
SDL_SetRenderVSync(r, 0);   // off
// SDL2: SDL_RENDERER_PRESENTVSYNC flag
```

### Don't free memory SDL owns

In SDL3 the `SDL_EVENT_DROP_FILE` path and the surface from `SDL_GetWindowSurface` belong to SDL — copy them if you need to keep them, but never `SDL_free`/`SDL_DestroySurface` them yourself.

```
// SDL_GetWindowSurface returns a surface owned
// by the window — freed when the window dies
```
