# slop-stuff

A dense wiki of AI-generated cheatsheets and usage notes, built with [Hugo](https://gohugo.io/) and served at
[makefunstuff.github.io/slop-stuff](https://makefunstuff.github.io/slop-stuff/).

Each guide is a Markdown file. Hugo renders kebab-case URLs — `/rust/`, `/esp32/`, `/linux-cli/` — same as the old hand-written HTML folders.

## Preview locally

Install [Hugo](https://gohugo.io/installation/) (extended, v0.165+), then:

```
hugo server
```

Open the printed `localhost` URL. Production base URL is `https://makefunstuff.github.io/slop-stuff/`.

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

## Gotchas

...
```

3. Write the body in Markdown. Tables, fenced code, lists, and `<kbd>` / `<details>` HTML all work. Do **not** add the page to the hub by hand — `layouts/index.html` lists every regular page grouped by `category`.

4. Optional fields:

   - `lead` — short subtitle under the title
   - `tags` — shown on the page and used by search
   - `weight` — sort order inside a category (lower first; title is the fallback)

5. Run `hugo server` and hit `/<kebab-slug>/`.

A starter file: `hugo new rust/index.md` uses `archetypes/default.md`.

## Hub, search, experiments

- The root page is generated from front matter / `data/categories.yaml`. No giant HTML index.
- Header search reads `/index.json` (built by Hugo) and filters title, category, description, tags.
- Games and other builds that are **not** cheatsheets belong in their own repos. Link them from `data/experiments.yaml` instead of adding pages here.

## Deploy (GitHub Pages)

`.github/workflows/hugo.yml` builds Hugo on push to `main` and deploys the `public/` artifact to GitHub Pages.

One-time repo settings (already needed for project Pages):

1. Settings, Pages, Build and deployment, Source: GitHub Actions.
2. After merge, the site is https://makefunstuff.github.io/slop-stuff/

## Layout

```
content/<slug>/index.md   guides (kebab-case paths)
layouts/                  wiki chrome (hub, single, search JSON)
static/css/wiki.css       dense hacker-wiki styles
static/js/wiki.js         theme, search, copy buttons
data/categories.yaml      hub section order
data/experiments.yaml     off-repo games / toys
hugo.toml                 baseURL, markup, outputs
```

Organic (non-AI) codebases still live somewhere else.
