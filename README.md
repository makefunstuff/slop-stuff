# slop-stuff

A dense wiki of AI-generated cheatsheets and usage notes, built with [Hugo](https://gohugo.io/) and served at
[makefunstuff.github.io/slop-stuff](https://makefunstuff.github.io/slop-stuff/).

Each guide is a Markdown file under `content/<kebab-slug>/index.md`. Hugo renders kebab-case URLs — `/rust/`, `/esp32/`, `/linux-cli/`.

## Preview locally

Install [Hugo](https://gohugo.io/installation/) (extended, v0.165+), then:

```
hugo server
```

Production base URL is `https://makefunstuff.github.io/slop-stuff/`.

```
hugo --gc --minify
```

writes the static site to `public/`.

## Add a new Markdown guide

1. Create `content/<kebab-slug>/index.md`. The folder name **is** the URL path.

2. Fill in front matter. `category` should be one of the values in `data/categories.yaml` so the hub groups it automatically.

```markdown
---
title: "Zig"
description: "Comptime, allocators, optionals/errors, build.zig, C interop."
category: "Languages"
tags: ["language", "comptime"]
---

One-paragraph lead.

## Quick reference

- `zig build` — compile via `build.zig`
```

3. Write the body in Markdown. Tables, fenced code, lists, and `<kbd>` / `<details>` HTML all work. Do **not** add the page to the hub by hand — `layouts/index.html` lists every regular page grouped by `category`.

4. Optional fields: `lead` (subtitle), `tags` (search), `weight` (sort order).

5. Run `hugo server` and hit `/<kebab-slug>/`.

Starter: `hugo new rust/index.md` uses `archetypes/default.md`.

## Hub, search, experiments

- The root page is generated from front matter / `data/categories.yaml`.
- Header search reads `/index.json` (built by Hugo).
- Games live in other repos. Link them from `data/experiments.yaml`.

## Deploy (GitHub Pages)

Copy [`docs/hugo-pages.yml`](docs/hugo-pages.yml) to `.github/workflows/hugo.yml` (the token used for this PR cannot write workflow files). Then:

1. Settings, Pages, Build and deployment, Source: GitHub Actions.
2. After merge the site is https://makefunstuff.github.io/slop-stuff/

## Layout

```
content/<slug>/index.md   guides (kebab-case paths)
layouts/                  wiki chrome (hub, single, search JSON)
static/css/wiki.css       dense hacker-wiki styles
static/js/wiki.js         theme, search, copy buttons
data/categories.yaml      hub section order
data/experiments.yaml     off-repo games / toys
hugo.toml                 baseURL, markup, outputs
docs/hugo-pages.yml       GitHub Actions workflow to copy into .github/workflows/
```

Organic (non-AI) codebases still live somewhere else.
