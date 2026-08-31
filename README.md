# slop-stuff

All the AI slop lives here: little static sites, experiments, and random stuff — hosted on GitHub Pages.

## Cheatsheets & guides

Each guide is a subfolder, served under `https://makefunstuff.github.io/slop-stuff/<folder>/`. The root **[index.html](./index.html)** is the hub linking everything.

### AI & agents

- **[herdr-cheatsheet](./herdr-cheatsheet/)** — Herdr: workspaces, panes, agents, remote, automation, plugins
- **[herdr-agentic](./herdr-agentic/)** — agentic patterns with Herdr: orchestrator-worker, reviewer, parallel worktrees
- **[hermes-agent](./hermes-agent/)** — Hermes Agent: CLI, keybindings, slash commands, sessions, providers, config
- **[omp](./omp/)** — omp harness: tools, subagents, LSP/DAP, hashline edits, providers, memory
- **[llm-ai](./llm-ai/)** — LLM & AI: tokens, embeddings, attention, transformers, RAG, prompting, agents, evals

### Languages

- **[rust](./rust/)** — ownership, cargo, match, Result, traits, concurrency
- **[c](./c/)** — pointers, memory, structs, strings, preprocessor
- **[cpp](./cpp/)** — STL, smart pointers, templates, modern C++
- **[python](./python/)** — comprehensions, decorators, dataclasses, stdlib
- **[lua](./lua/)** — tables, metatables, patterns, modules, embedding
- **[golang](./golang/)** — modules, structs, interfaces, goroutines, channels, errors
- **[typescript](./typescript/)** — types, interfaces, generics, narrowing, utility types

### CLI & shell

- **[jq](./jq/)** — JSON filters, recipes, operators, flags, curl pipelines
- **[bash](./bash/)** — variables, quoting, loops, conditionals, functions, expansion
- **[linux-cli](./linux-cli/)** — sed, awk, grep, find, xargs, sort, tar, and friends

### Cloud, DevOps & observability

- **[kubectl](./kubectl/)** — inspect, run, edit, debug, contexts
- **[gcloud](./gcloud/)** — compute, storage, GKE, IAM, SQL, logging
- **[grafana](./grafana/)** — panels, variables, transforms, alerts, provisioning
- **[promql](./promql/)** — selectors, rates, aggregation, functions
- **[devops](./devops/)** — CI/CD, containers, orchestration, IaC, observability, deployment

### Data & databases

- **[postgres](./postgres/)** — psql, users/permissions, backups, replication, tuning, monitoring
- **[kafka](./kafka/)** — topics, partitions, producers, consumers, offsets, operations
- **[db-optimization](./db-optimization/)** — indexes, query plans, normalization vs denormalization, tuning
- **[excel](./excel/)** — formulas, functions, pivot tables, lookups, shortcuts

### Embedded & hardware

- **[esp32](./esp32/)** — GPIO, UART/I2C/SPI, Wi-Fi, storage, power, OTA
- **[embedded](./embedded/)** — bare-metal/RTOS: registers, interrupts, timers, memory, boot, debugging
- **[electrical](./electrical/)** — Ohm's law, logic levels, pull-ups, dividers, power for firmware devs
- **[sdr](./sdr/)** — IQ, sampling, DSP, GNU Radio, common signals
- **[hamradio](./hamradio/)** — bands, propagation, antennas, and the math/physics/embedded side of RF

### Electronics

- **[electronics](./electronics/)** — components, circuits, op-amps, power supplies, practical electronics
- **[tubes](./tubes/)** — BJTs, MOSFETs, JFETs, vacuum tubes: operation, biasing, circuits
- **[hardware](./hardware/)** — modules, ICs, MCUs, and sensors (typical and unusual) for DIY builds

### Drones & FPV

- **[betaflight](./betaflight/)** — rates, PIDs, filters, modes, CLI
- **[ardupilot](./ardupilot/)** — firmware, flight modes, failsafes, tuning, Mission Planner
- **[pid-tuning](./pid-tuning/)** — P/I/D terms, tuning methods, symptoms, implementation
- **[fpv](./fpv/)** — frames, motors, ESCs, VTX, radios, batteries, build workflow

### Graphics

- **[shaders](./shaders/)** — GLSL, the pipeline, uniforms/varyings, lighting, SDFs, effects
- **[opengl](./opengl/)** — buffers, VAOs, shaders, textures, framebuffers, core profile

### Game dev

- **[sdl](./sdl/)** — SDL2/SDL3: game loop, window, rendering, input, audio, textures
- **[gamedev](./gamedev/)** — game loop, component/entity, state machines, pooling, messaging

### Systems & CS

- **[allocators](./allocators/)** — bump, free lists, arenas, slab, buddy, garbage collection
- **[algorithms](./algorithms/)** — complexity, sorting, searching, data structures, graphs
- **[dop](./dop/)** — Data-Oriented Design: SoA vs AoS, cache locality, ECS, layout patterns
- **[osdev](./osdev/)** — boot, protected mode, interrupts, paging, kernel basics
- **[asm](./asm/)** — registers, instructions, addressing, calling conventions, syscalls
- **[giants](./giants/)** — systems lessons from nginx, Redis, the Linux kernel, and Carmack

### Quantitative

- **[math](./math/)** — linear algebra, probability, calculus, discrete, and signal/DSP math
- **[finance](./finance/)** — value investing: statements, valuation ratios, DCF, margin of safety

### Security

- **[pentesting](./pentesting/)** — recon, scanning, exploitation, privilege escalation, reporting
- **[security](./security/)** — auth, secrets, supply chain, hardening, web security, incident response

### Editors

- **[neovim](./neovim/)** — modes, motions, text objects, config, LSP

## Shared assets

All cheatsheet pages share the design system in [`assets/style.css`](./assets/style.css) and [`assets/app.js`](./assets/app.js) (theme toggle, search, copy buttons, scrollspy). To add a new guide, copy a page's structure, point at `../assets/`, and set a unique `data-guide` on `<html>`.

## Experiments

Games and other builds live in their own repos (e.g. [invader-rogue](https://github.com/makefunstuff/invader-rogue)) and are linked from the hub.

## Notes

This repo replaces the old `makefunstuff` (personal page) and `herdr-cheatsheet` repos, which were merged here. Organic codebases (not written by AI) still live somewhere else.
