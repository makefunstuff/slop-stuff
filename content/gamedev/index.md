---
title: "GameDev patterns"
description: "Fixed timestep, ECS vs OO, HFSM/BT, pooling, spatial picks, frame budget, and AI-slop kill-list."
category: "Game dev"
tags: ["gamedev", "timestep", "ECS", "HFSM", "spatial"]
weight: 430
lead: "Patterns that make games tick — herded, not essayed."
version: "patterns"
---
Every game is input → sim → draw. Use **seconds** (`dt = 1/60`), not `MS_PER_UPDATE`. Composition ≠ ECS. Fixed dt is necessary for net/replay — **not sufficient** alone.

## Quick reference {#quickref}

| Pattern | One-liner |
| --- | --- |
| Fixed + accumulator | `acc += clamp(frame); while acc>=dt: fixedUpdate(dt); acc-=dt` then `render(lerp(prev,curr,acc/dt))` |
| Spiral fuse | Clamp frame (`0.25s`) and/or `maxSteps` |
| Input | Queue every **frame**, apply on **tick** |
| ECS | entity=id · component=data · system=behavior — when *thousands* of similar things |
| State | enum ≤~8 · objects when state owns data · HFSM for shared edges · BT+FSM leaves for NPC AI |
| Pool | Free list O(1) · reset on release · **ID+generation**, not raw ptrs |
| Events | Observer = sync · queue = later · don’t emit from handlers |
| Command | Intent boundary (remap / undo / lockstep) — not particles |
| Spatial | Grid for bullets · quadtree open world · SAP/BVH for physics pairs |
| Budget | `16.67ms` @60 · `33.3ms` @30 |

## Loop / timestep {#loop}

| Strategy | Deterministic? | Use | Death |
| --- | --- | --- | --- |
| Variable `update(frameTime)` | No | juice / UI / particles | springs explode, tunneling, FPS-feel |
| Clamped `min(frameTime, dtMax)` | No | simple 2D | hitch → slow-mo |
| Semi-fixed (remainder ≠ dt) | Almost | upper bound on dt | spiral; not bit-exact |
| **Fixed + accumulator** | Yes if rest of sim is | **default for physics / net / replay** | spiral unless clamp + maxSteps |
| Fixed + vsync sleep | Until overrun | locked 30/60 | overrun slows gameplay *and* render |

```
dt = 1.0/60.0
clampFrame = 0.25
maxSteps = 8
acc = 0.0
prevTime = now()

while running:
  frameTime = min(now() - prevTime, clampFrame)
  prevTime = now()
  acc += frameTime
  steps = 0
  while acc >= dt and steps < maxSteps:
    previous = current
    fixedUpdate(dt)          # physics, cooldowns, AI decisions, net
    acc -= dt
    steps += 1
  alpha = acc / dt
  frameUpdate(...)           # anim, camera, VFX, UI
  render(lerp(previous, current, alpha))
```

**Interp** = `lerp(prev, curr, α)` — needs **two states** (slerp quats). **Extrap** = `curr + vel*α` — rubber-bands on collision. Leftover lag alone is **not** interpolation.

| Domain | Clock |
| --- | --- |
| Physics / cooldowns / AI decisions / net | **fixed** |
| Input | queue every **frame**, apply on **tick** |
| Animation / camera / VFX / UI | **frame** |

Semi-implicit Euler: `v += a*dt; x += v*dt` (that order). Box2D-ish: `1/60` + ~4 substeps — never tie the step to FPS.

## ECS vs OO {#ecs}

| | Reach for it when | Avoid when |
| --- | --- | --- |
| Classic OO + components | Domains decouple but you still think in *objects* | Thousands of identical ticking things |
| ECS | Mass similar entities / cache-friendly tick dumps | One-off player systems, UI-as-entities, pre-prototype framework |

**AoS** = object-centric · **SoA** = system-centric. **Archetype** = one table per component-set (add/remove *moves* the entity). **Sparse set** = O(1) add/remove, slower multi-comp queries.

> **KEY:** Composition ≠ ECS. Hybrid is normal. System order = dataflow; **defer** structural changes. Don’t boolean-tag until empty chunks. Anti: `PlayerJumpSystem` for one entity.

## State / HFSM / BT {#state}

| Tool | When |
| --- | --- |
| Enum switch | ≤ ~8 states |
| State objects | states own data |
| Concurrent FSMs | kill n×m flag soup |
| HFSM | shared on-ground edges |
| Pushdown | pause / fire overlay |
| **BT supervisor + FSM leaves** | NPC combat (Halo 2–style) |
| Player locomotion | FSM |

Pitfalls: god state · transition spam · BT full-tree tick + LOS at root every frame · BT that’s a 1-depth switch.

## Pool / events / command {#patterns}

| Pattern | Do | Don’t |
| --- | --- | --- |
| Object pool | Free list O(1); reset on release; ID+generation | O(n) scan; raw dangling ptrs; “pool fixes GC” while refs live |
| Observer | Sync fan-out | Architecture via global EventBus |
| Event queue | Copy payload; drain later | Emit from handlers (storms); stale entity ids |
| Command | Remap / editor undo / lockstep at **intent** | Wrap every particle spawn |

## Spatial pick {#spatial}

| Structure | Use |
| --- | --- |
| Uniform grid | bullets / arena (cell ≈ query radius; half-neighbors) |
| Quad / octree | open world, mixed density |
| Sweep & prune | coherent physics pairs |
| Dynamic AABB BVH | modern broadphase / rays |

`n≈20` → nested loop is fine. Two structures is normal. Don’t quadtree the particles. Cell ≪ radius → you still pay near-n².

## Frame budget / net {#budget}

| Hz | Frame budget |
| --- | --- |
| 60 | **16.67 ms** |
| 30 | **33.3 ms** |

Display can be 30 Hz while sim still runs two 60 Hz ticks. **Lockstep** = exchange commands, wait for slowest, needs determinism. **C/S** = server owns state; client predicts own pawn; rewind-replay on correction. Fixed dt ≠ deterministic if RNG, hashmap order, fp nondeterminism, or dropped ticks leak in. **Never client-auth position.**

## AI-slop kill-list {#gotchas}

1. Wrong / variable dt on physics
2. Physics @ FPS
3. Explicit Euler for stiff sims
4. No spiral fuse (`clampFrame` / `maxSteps`)
5. Leftover-lag called “interpolation”
6. Input sampled only inside fixed update (missed presses) — or only in render with no queue
7. Gameplay numbers mutated in `frameUpdate`
8. “Just use ECS”
9. Tag explosion / empty archetypes
10. One-entity systems
11. Mutate collections while iterating
12. Undefined system order
13. Pool everything / no reset / raw ptrs
14. “Pool fixes GC”
15. Observer-as-architecture
16. Event storms (emit from handlers)
17. Stale queued entity ids
18. God FSM
19. BT-as-switch
20. Spatial cell ≪ query radius
21. Quadtree on bullets
22. n² then blame the language
23. Entity inheritance diamond
24. Dangling observers
25. “Fixed dt ⇒ deterministic”
26. Client-auth position
27. Command objects in the inner particle loop
28. Sleep-to-60 coupled as the only timestep
29. Premature ECS + bus + framework before a looping prototype

## Refs {#refs}

- [Game Programming Patterns](https://gameprogrammingpatterns.com/) — Loop, Component, Event Queue, Command, State, Object Pool, Spatial Partition, Data Locality
- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)
- [Integration Basics](https://gafferongames.com/post/integration_basics/)
- [Game Networking](https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/)
- [Box2D simulation](https://box2d.org/documentation/md_simulation.html)
- [Ford — Overwatch Gameplay Architecture (GDC 2017)](https://www.youtube.com/watch?v=W3aieHjyNvw)
- [Isla — Halo 2 AI complexity (GDC 2005)](https://www.gamedeveloper.com/programming/gdc-2005-proceeding-handling-complexity-in-the-i-halo-2-i-ai)
