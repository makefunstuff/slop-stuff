# slop-stuff

All the AI slop lives here: little static sites, experiments, and random stuff — hosted on GitHub Pages.

## Cheatsheets & guides

Each guide is a subfolder, served under `https://makefunstuff.github.io/slop-stuff/<folder>/`. The root **[index.html](./index.html)** is the hub linking everything.

### Agent tools

- **[herdr-cheatsheet](./herdr-cheatsheet/)** — Herdr: workspaces, panes, agents, remote, automation, plugins
- **[herdr-agentic](./herdr-agentic/)** — agentic patterns with Herdr: orchestrator-worker, reviewer, parallel worktrees
- **[hermes-agent](./hermes-agent/)** — Hermes Agent: CLI, keybindings, slash commands, sessions, providers, config
- **[omp](./omp/)** — omp harness: tools, subagents, LSP/DAP, hashline edits, providers, memory

### Languages

- **[rust](./rust/)** — ownership, cargo, match, Result, traits, concurrency
- **[c](./c/)** — pointers, memory, structs, strings, preprocessor
- **[cpp](./cpp/)** — STL, smart pointers, templates, modern C++
- **[python](./python/)** — comprehensions, decorators, dataclasses, stdlib
- **[lua](./lua/)** — tables, metatables, patterns, modules, embedding

### Embedded

- **[esp32](./esp32/)** — GPIO, UART/I2C/SPI, Wi-Fi, storage, power, OTA

### CLI & data

- **[jq](./jq/)** — JSON filters, recipes, operators, flags, curl pipelines

### Cloud & observability

- **[kubectl](./kubectl/)** — inspect, run, edit, debug, contexts
- **[gcloud](./gcloud/)** — compute, storage, GKE, IAM, SQL, logging
- **[grafana](./grafana/)** — panels, variables, transforms, alerts, provisioning
- **[promql](./promql/)** — selectors, rates, aggregation, functions

### Editors

- **[neovim](./neovim/)** — modes, motions, text objects, config, LSP

## Shared assets

All cheatsheet pages share the design system in [`assets/style.css`](./assets/style.css) and [`assets/app.js`](./assets/app.js) (theme toggle, search, copy buttons, scrollspy). To add a new guide, copy a page's structure, point at `../assets/`, and set a unique `data-guide` on `<html>`.

## Experiments

Games and other builds live in their own repos (e.g. [invader-rogue](https://github.com/makefunstuff/invader-rogue)) and are linked from the hub.

## Notes

This repo replaces the old `makefunstuff` (personal page) and `herdr-cheatsheet` repos, which were merged here. Organic codebases (not written by AI) still live somewhere else.
