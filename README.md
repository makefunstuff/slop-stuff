# slop-stuff

All the AI slop lives here: little static sites, experiments, and random stuff — hosted on GitHub Pages.

## Cheatsheets & guides

Each guide is a subfolder, served under `https://makefunstuff.github.io/slop-stuff/<folder>/`:

- **[herdr-cheatsheet](./herdr-cheatsheet/)** — a friendly, visual Herdr cheatsheet and usage guide → [live site](https://makefunstuff.github.io/slop-stuff/herdr-cheatsheet/)
- **[hermes-agent](./hermes-agent/)** — Hermes Agent cheatsheet: CLI, keybindings, slash commands, sessions, providers, config → [live site](https://makefunstuff.github.io/slop-stuff/hermes-agent/)
- **[omp](./omp/)** — omp harness cheatsheet: tools, subagents, LSP/DAP, hashline edits, providers, memory → [live site](https://makefunstuff.github.io/slop-stuff/omp/)
- **[jq](./jq/)** — jq cheatsheet: filters, recipes, operators, flags, curl pipelines → [live site](https://makefunstuff.github.io/slop-stuff/jq/)

The root **[index.html](./index.html)** is the hub linking the guides and experiments.

## Shared assets

All cheatsheet pages share the design system in [`assets/style.css`](./assets/style.css) and [`assets/app.js`](./assets/app.js) (theme toggle, search, copy buttons, scrollspy). To add a new guide, copy a page's structure, point at `../assets/`, and set a unique `data-guide` on `<html>`.

## Experiments

Games and other builds live in their own repos (e.g. [invader-rogue](https://github.com/makefunstuff/invader-rogue)) and are linked from the hub.

## Notes

This repo replaces the old `makefunstuff` (personal page) and `herdr-cheatsheet` repos, which were merged here. Organic codebases (not written by AI) still live somewhere else.
