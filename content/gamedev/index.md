---
title: "GameDev patterns"
description: "Game loop, component/entity, state machines, object pooling, and messaging."
category: "Game dev"
tags: ["gamedev", "game loop", "ECS", "state"]
weight: 430
lead: "Patterns that make games tick."
version: "patterns"
---
Every game is one tight loop — read input, step the simulation, draw a frame. These patterns keep that loop, and the code around it, fast, clear, and debuggable.

## Quick reference {#quickref}

The ten patterns you reach for most — the loop, the step, the state, the pool, the message. Copy any line straight in.

- `while (running) { input(); update(); render(); }` — one loop runs the game; everything else hangs off it.
- `dt = (now - last) / 1000.0; last = now;` — delta time — multiply movement by `dt` so speed is framerate-independent.
- `while (lag >= STEP) { update(STEP); lag -= STEP; }` — fixed timestep — constant `dt`, deterministic physics.
- `render(lag / STEP);` — interpolate between the last two states — decouple update from render.
- `entity = id; component = data; system = behavior;` — ECS — compose objects from plain data, systems iterate it.
- `state_->enter(); state_->update(dt); state_->exit();` — state machine — one current state, explicit transitions.
- `p = pool.obtain(); ... pool.release(p);` — object pool — recycle dead objects; reset on release.
- `for (auto* o : observers_) o->onEvent(e);` — observer / event queue — decouple raising an event from handling it.
- `input.bind(KEY_SPACE, &jumpCommand);` — command — wrap actions to remap, queue, or undo.
- `for (auto& e : entities) e.update(dt);` — update method + spatial partition — update each entity, test only neighbors.

## Architecture {#start}

Every game is one loop — input, update, render — driven by a clock. The four ideas below are the whole foundation.

### 1. Game loop

One loop runs forever: `input()`, then `update()`, then `render()`. Everything else hangs off it.

### 2. Delta time

`dt = now - last`. Multiply movement by `dt` so speed is constant on any framerate.

### 3. Update vs render

Update the simulation at a fixed rate; render as fast as the display allows. Never tie logic to frame rate.

### 4. Determinism

A fixed timestep makes physics reproducible — same inputs, same result, every run.

1. **Read input** — Sample the controller, queue events, or poll state once per tick.
1. **Update** — Advance the simulation by a fixed `dt` — physics, AI, timers.
1. **Render** — Draw the current (interpolated) world state to the screen.
1. **Repeat** — Loop back — the only thing that ends the game is an exit condition.

## Game loop patterns {#loop}

Decouple update from render, advance time with an accumulator, and queue input so it is handled once per tick.

### Fixed timestep with accumulator + interpolation

```
double previous = getCurrentTime();
double lag = 0.0;
while (running) {
  double current = getCurrentTime();
  double elapsed = current - previous;
  previous = current;
  lag += elapsed;

  processInput();

  while (lag >= MS_PER_UPDATE) {
    update();              // fixed step — deterministic
    lag -= MS_PER_UPDATE;
  }

  render(lag / MS_PER_UPDATE);  // interpolate between states
}
```

### Decoupled update/render

Run `update()` a fixed number of times per second, but `render()` as fast as the monitor refreshes. Pass the interpolation factor `α` so the renderer can blend between the last two states.

```
render(lag / MS_PER_UPDATE); // α in [0, 1)
```

### Event queue for input

Push input events into a queue; drain it at the top of `update()`. Input is then processed once per simulation step, not once per render frame.

```
while (!inputQueue.empty()) {
  auto event = inputQueue.pop();
  handleInput(event);
}
```

| Strategy | Update rate | Good for | Watch out for |
| --- | --- | --- | --- |
| Variable timestep | each frame, `dt` varies | simple games | physics can diverge |
| Fixed timestep | constant `dt` | deterministic physics | spiral of death if too slow |
| Fixed + accumulator | fixed, capped catch-up | most real games | cap the loop, drop spare time |

## Component & entity {#component}

Compose objects from small, reusable parts instead of inheriting from a giant base class. ECS takes that idea to the extreme.

**Entity** (just an id) → **Components** (plain data) → **Systems** (behavior) → **World** (wires it together)

### Composition over inheritance

Build an entity by attaching only the components it needs. No `Monster : Actor : Entity` ladder to refactor later.

### Component pattern

One component owns one domain — `Position`, `Sprite`, `Physics`. Each knows its own state and can be updated independently.

### Data locality

Store all components of one type contiguously (struct-of-arrays) so a system iterates cache-friendly memory instead of chasing pointers.

### Minimal component + system

```
struct Position { float x, y; };
struct Velocity { float dx, dy; };

void moveSystem(Array<Position>& pos,
                Array<Velocity>& vel, float dt) {
  for (size_t i = 0; i < pos.size(); ++i) {
    pos[i].x += vel[i].dx * dt;
    pos[i].y += vel[i].dy * dt;
  }
}
```

`ECS` `entity` `component` `system` `SoA` `cache-friendly`

## State machines {#state}

Model an object as a finite set of states and the transitions between them. Keeps branching logic flat and testable.

- **Idle** — On ground, no input. Transitions to `Running` on move.
- **Running** — On ground, moving. Transitions to `Jumping` on jump input.
- **Jumping** — Airborne, rising. Gravity takes over until apex.
- **Falling** — Airborne, descending. Lands back to `Idle`.
**Idle** (grounded) → **Run** (move) → **Jump** (rise) → **Fall** (descend)

### Finite state machine

A fixed set of states plus explicit transition rules. The classic enemy-AI or UI-state tool.

### State pattern

Each state is an object implementing `enter()`, `exit()`, `update()`. The context delegates to the current one.

### Pushdown automaton

A stack of states: push a new state on top, pop to return. Great for nested menus or “pause over play”.

### Hierarchical states

States have sub-states — `Jumping` contains `Rising` / `Falling`. Share behavior via a parent.

<details>
<summary>State pattern in code</summary>

```
class PlayerState {
public:
  virtual ~PlayerState() {}
  virtual void enter() = 0;
  virtual void update(float dt) = 0;
  virtual void exit() = 0;
};

void Player::setState(PlayerState* next) {
  state_->exit();
  state_ = next;
  state_->enter();
}
```

</details>

## Object pooling & spawning {#spawn}

Creating and destroying objects every frame is slow and fragments memory. Pool, prototype, and flyweight keep spawning cheap.

### 1. Object pool

Recycle dead objects instead of `new`/`delete`. Keep a list of free slots; reset on reuse.

### 2. Factory

One place that constructs objects, so callers never depend on concrete classes.

### 3. Prototype

Clone a configured template instead of building from scratch — spawn varied enemies from one base.

### 4. Flyweight

Split shared (intrinsic) state from per-instance state. A thousand trees share one mesh + texture.

### Reusable object pool

```
class ParticlePool {
  std::vector<Particle*> pool_;   // pre-allocated
  Particle* obtain() {
    for (auto* p : pool_)
      if (!p->active_) return p;   // reuse
    return nullptr;                 // exhausted
  }
  void release(Particle* p) { p->reset(); }
};
```

> **POOL:** **Reset on release.** A reused object must look brand-new: clear velocity, timers, and references in `release()` — or the next spawn inherits stale state.

## Messaging {#events}

Decouple senders from receivers. Observers, queues, and commands keep systems independent and let you rewind, replay, and remap.

### Observer

Subjects notify a list of listeners. Great for one-to-many updates like achievements listening to combat.

### Event queue

Buffer messages and process them later — decouples “something happened” from “handle it now”, and enables replay.

### Command

Wrap an action in an object so it can be queued, remapped, or undone. The input system’s best friend.

**Sender** (raises event) → **Event queue** (buffered) → **Receiver** (handles later)

### Command: input remap + undo

```
class JumpCommand : public Command {
public:
  void execute() override { actor->jump(); }
  void undo()    override { actor->resetJump(); }
};

// remap any key to any command
input.bind(KEY_SPACE, &jumpCommand);
```

<kbd>Space</kbd> then <kbd>Jump</kbd> command

### Observer: one-to-many

```
class Subject {
  void notify(Event e) {
    for (auto* o : observers_) o->onEvent(e);
  }
};
```

- Move forward — <kbd>W</kbd>
- Move back — <kbd>S</kbd>
- Strafe — <kbd>A</kbd><kbd>D</kbd>
- Jump — <kbd>Space</kbd>
- Fire — <kbd>Click</kbd>
- Reload — <kbd>R</kbd>
- Undo — <kbd>Z</kbd>
- Pause — <kbd>Esc</kbd>
- Menu — <kbd>Tab</kbd>
- `Event::PlayerDied` — Raised once; achievements and UI both listen.
- `Event::DamageTaken` — Carries amount + source; queued, not applied inline.
- `Command::undo()` — Reverses the last command — replay and rewind.
- `Queue::drain()` — Process all buffered events at a safe point in the loop.

## Update methods & behaviors {#update}

How you run per-object behavior each frame — and how to make big worlds fast without scanning everything.

### Update method

Give each entity an `update(dt)` and call them all from the loop. Keeps behavior next to state.

```
for (auto& e : entities) e.update(dt);
```

### Double buffer

Write to one buffer while reading another, then swap. Lets a system see a consistent previous state.

```
std::swap(current_, next_);
```

### Dirty flag

Mark objects as changed and only recompute the derived data that matters — skip the rest.

```
if (dirty_) { rebuild(); dirty_ = false; }
```

### Spatial partitioning

Divide the world into a grid or quad-tree and only test neighbors in the same cells — collision goes from O(n²) to O(n).

```
auto& bucket = grid.cellAt(entity.pos);
for (auto* other : bucket)
  if (overlaps(entity, other)) resolve();
```

### Delegation over subclassing

Instead of overriding `update()` in a deep class tree, delegate behavior to components. Easier to mix, test, and swap.

> **✓:** **Rule of thumb:** if two entities need different behavior, change their components — not their place in an inheritance hierarchy.

## Gotchas {#gotchas}

Architecture patterns are a map, not the territory. These are the traps that bite even experienced game programmers.

### Premature abstraction

Don’t build an ECS, a command bus, and a plugin system before your first prototype runs. Patterns solve problems — introduce them when the problem exists.

### Cache locality

Jumping between heap-allocated objects thrashes the cache. Prefer contiguous arrays and struct-of-arrays for hot paths like physics and rendering.

### Object lifetime

Who owns an entity, and when does it die? Dangling pointers to freed entities are the #1 crash source. Pool, defer deletion, or use IDs instead of raw pointers.

### Deep inheritance (diamond of death)

`A → B → C → D` class ladders collapse under change. Every level couples you to everything above it; prefer composition.

### Update order coupling

Systems run in a fixed order, so one reading another’s output sees *last* frame’s value — a one-frame lag that breeds hard-to-reproduce bugs. Keep systems independent, or make the dependency explicit.

### Dangling observers & stale events

A destroyed listener still registered is a guaranteed crash, and a queue that is never drained holds dead, stale events. Unregister on teardown, cap the queue, and drop or merge old events.

> **⚠:** **Over-engineering vs simple code.** The best pattern is the simplest code that ships. A 40-line `switch` state machine often beats a 400-line state framework — until you have six states and twenty transitions.
