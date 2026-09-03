---
title: "Neovim"
description: "Modes, motions, operators, text objects, config, and LSP."
category: "Editors"
tags: ["editor", "motion", "operators", "lsp"]
weight: 560
lead: "Edit at the speed of thought."
version: "0.11+"
---
Neovim is a modal editor: every keypress is a command, not a character. Learn the modes and motions once, and your hands never leave the home row again.

## The everyday keys, at a glance {#quickref}

Nine blocks cover the daily surface — modes, movement, operators, text objects, search, replace, splits, config, and LSP. Skim it once, then dive into the sections below for depth.

### Modes

```
Esc           " back to Normal (always)
i  a  o       " insert before / after / new line
v  V  Ctrl-v  " visual: char / line / block
:             " command-line mode
```

### Move

```
h  j  k  l    " left / down / up / right
w  b  e       " word: next / back / end
0  $  ^       " line start / end / first char
gg  G  12G    " top / bottom / line 12
```

### Operators

```
d  c  y       " delete / change / yank
x  p  P       " char / put after / before
u  Ctrl-r     " undo / redo
.             " repeat last change
```

### Text objects

```
ciw  ci"      " change word / string
di(  di{      " delete inside ( / {
yap  yit      " yank paragraph / tag
cit           " change tag content
```

### Search

```
/pattern      " search forward
?pattern      " search backward
n  N          " next / previous match
*  #          " word under cursor fwd/back
:noh          " clear highlight
```

### Replace

```
:s/old/new/    " current line, first
:%s/old/new/g  " whole file
:%s/old/new/gc " whole file, confirm
&               " repeat last :s
```

### Splits

```
:sp  :vsp      " split horizontal / vertical
Ctrl-w h j k l " move focus
Ctrl-w q  o    " close / only window
Ctrl-w =       " equalize sizes
```

### init.lua

```
~/.config/nvim/init.lua   " entry point
vim.opt.number = true     " options
vim.keymap.set("n", ...)  " keymaps
require("lazy").setup("plugins")
```

### LSP

```
gd  gr         " definition / references
K              " hover docs
<leader>rn    " rename symbol
:LspInstall srv  " install a server
:LspInfo       " what's attached
```

> **KEY:** **The grammar of every command:** `count` + `operator` + `motion`. `d3w` deletes three words, `ci"` changes inside the quotes — everything else is a refinement of that one sentence.

## Modes & help {#start}

Neovim is modal. You read and move in `Normal`, type in `Insert`, select in `Visual`, and run commands from the `:` command line.

### 1. Modes

```
Esc            " back to Normal (always works)
i  a  o        " insert before / after / new line
v  V  Ctrl-v   " visual: char / line / block
:              " command-line mode
```

### 2. Open & quit

```
nvim main.rs   " open a file
:w             " save (write)
:q             " quit
:wq            " save and quit (:x too)
:q!            " quit, discard changes
```

### 3. Help

```
:help           " open the manual
:help :w        " help for the :w command
:help quickref  " one-page quick reference
:help user-manual
```

### 4. Shell

```
:!ls -la        " run a command, return
:terminal       " open a real shell
:term           " ...in a split
```

> **KEY:** **Neovim is modal.** In Normal mode every key is a command, and most commands combine a `count`, an `operator`, and a `motion` — `d3w` means “delete 3 words”. `Esc` always returns you to Normal mode.

## Motions {#motion}

Motions move the cursor. Prefix any of them with a count to repeat: `5j`, `3w`, `12G`.

### Cursor

- Left / down / up / right — <kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd>
- Next word / back / end — <kbd>w</kbd><kbd>b</kbd><kbd>e</kbd>
- WORD (ignore punctuation) — <kbd>W</kbd><kbd>B</kbd><kbd>E</kbd>
- Beginning of line (0) / end ($) — <kbd>0</kbd><kbd>$</kbd>
- First non-blank character — <kbd>^</kbd>

### Line & find

- Find char (forward) — <kbd>f</kbd><kbd>char</kbd>
- Until char (forward) — <kbd>t</kbd><kbd>char</kbd>
- Find / until (backward) — <kbd>F</kbd><kbd>T</kbd>
- Repeat last f/t forward — <kbd>;</kbd>
- Repeat last f/t backward — <kbd>,</kbd>

### File jumps

- Top of file / bottom — <kbd>gg</kbd><kbd>G</kbd>
- Jump to line N — <kbd>N</kbd><kbd>G</kbd>
- Match bracket / paren — <kbd>%</kbd>
- Previous / next paragraph — <kbd>{</kbd><kbd>}</kbd>
- Page down / up — <kbd>Ctrl-f</kbd><kbd>Ctrl-b</kbd>
> **3×:** **Counts multiply anything.** `5j` moves down five lines, `3w` advances three words, `12G` jumps to line 12. `f` and `t` land on a character in the current line; repeat them with `;` (forward) and `,` (backward).

## Operators & text objects {#editing}

An operator is a verb, a text object is a noun. Pair `d`, `c`, or `y` with a motion or a text object: `dw`, `ciw`, `yap`.

### Operators

- Delete — <kbd>d</kbd><kbd>motion</kbd>
- Change (delete + insert) — <kbd>c</kbd><kbd>motion</kbd>
- Yank (copy) — <kbd>y</kbd><kbd>motion</kbd>
- Delete character — <kbd>x</kbd>
- Put after / before cursor — <kbd>p</kbd><kbd>P</kbd>

### Lines & repeat

- Delete / change / yank line — <kbd>dd</kbd><kbd>cc</kbd><kbd>yy</kbd>
- Delete / change to end of line — <kbd>D</kbd><kbd>C</kbd>
- Undo / redo — <kbd>u</kbd><kbd>Ctrl-r</kbd>
- Repeat last change — <kbd>.</kbd>
- Delete 3 words — <kbd>3</kbd><kbd>d</kbd><kbd>w</kbd>

### Registers

- Yank into register a — <kbd>"</kbd><kbd>a</kbd><kbd>y</kbd>
- Paste from register a — <kbd>"</kbd><kbd>a</kbd><kbd>p</kbd>
- System clipboard — <kbd>"</kbd><kbd>+</kbd><kbd>y</kbd>
- List all registers — <kbd>:</kbd><kbd>reg</kbd>
- Last yank / delete — <kbd>"</kbd><kbd>0</kbd><kbd>p</kbd>

| Text object | Selects | Example |
| --- | --- | --- |
| `iw` / `aw` | inner / a word | `ciw` retype the word |
| `ip` / `ap` | inner / a paragraph | `dip` delete paragraph |
| `i"` / `a"` | inside / around quotes | `ci"` replace a string |
| `i)` / `a)` | inside / around parens | `di(` clear the contents |
| `it` / `at` | inner / around HTML tag | `cit` change the tag body |

> **.:** **The dot command repeats the last change** — not the last motion. `ciw foo` then `j.` rewrites each word as you walk down. Registers named `"a`–`"z` persist between edits; `"+` is your system clipboard.

## Search & replace {#search}

Search with `/`, jump between hits with `n` / `N`, then rewrite with `:s` when you need a change across the file.

### Find

- Search forward / backward — <kbd>/</kbd><kbd>pattern</kbd>/<kbd>?</kbd>
- Next / previous match — <kbd>n</kbd><kbd>N</kbd>
- Clear highlight — <kbd>:</kbd><kbd>noh</kbd>
- Find next occurrence of word — <kbd>*</kbd><kbd>#</kbd>
- Partial word (forward/back) — <kbd>g</kbd><kbd>*</kbd>/<kbd>g</kbd><kbd>#</kbd>

### Pattern flags

- Ignore case — <kbd>\</kbd><kbd>c</kbd>
- Match case — <kbd>\</kbd><kbd>C</kbd>
- Very magic (regex) — <kbd>\</kbd><kbd>v</kbd>
- Very nomagic (literal) — <kbd>\</kbd><kbd>V</kbd>
- Word boundary — <kbd>\</kbd><kbd><</kbd><kbd>\</kbd><kbd>></kbd>

### Replace

- Replace in line — <kbd>:</kbd><kbd>s/old/new/</kbd>
- Replace all in line — <kbd>:</kbd><kbd>s/old/new/g</kbd>
- Replace all in file — <kbd>:</kbd><kbd>%s/old/new/g</kbd>
- Confirm each match — <kbd>:</kbd><kbd>%s/old/new/gc</kbd>
- Delete matching lines — <kbd>:</kbd><kbd>g/pattern/d</kbd>
> **\/:** **Slash inside a pattern?** Use any delimiter — `:s#/usr/bin#/usr/local/bin#g` — or escape it as `\/`. The `c` flag confirms each replacement; `n` just counts matches.

## Buffers, windows & tabs {#buffers}

A *buffer* holds a file, a *window* shows a buffer, and a *tab* groups windows. One buffer can appear in many windows.

### Buffers

- Edit / open a file — <kbd>:</kbd><kbd>e</kbd><kbd>file</kbd>
- Next / previous buffer — <kbd>:</kbd><kbd>bn</kbd>/<kbd>:</kbd><kbd>bp</kbd>
- List buffers — <kbd>:</kbd><kbd>ls</kbd>
- Delete buffer — <kbd>:</kbd><kbd>bd</kbd>
- Delete buffer, discard changes — <kbd>:</kbd><kbd>bd!</kbd>

### Windows

- Split horizontal / vertical — <kbd>:</kbd><kbd>sp</kbd>/<kbd>:</kbd><kbd>vsp</kbd>
- Move focus — <kbd>Ctrl-w</kbd><kbd>h j k l</kbd>
- Close / only window — <kbd>Ctrl-w</kbd><kbd>q</kbd>/<kbd>o</kbd>
- Equalize sizes — <kbd>Ctrl-w</kbd><kbd>=</kbd>
- Rotate / swap windows — <kbd>Ctrl-w</kbd><kbd>r</kbd>

### Tabs & marks

- New tab — <kbd>:</kbd><kbd>tabnew</kbd>
- Next / previous tab — <kbd>g</kbd><kbd>t</kbd>/<kbd>g</kbd><kbd>T</kbd>
- Set mark a — <kbd>m</kbd><kbd>a</kbd>
- Jump to mark a — <kbd>`</kbd><kbd>a</kbd>
- Jump to mark's line — <kbd>'</kbd><kbd>a</kbd>
> **m:** **Marks are bookmarks.** `m`*a* drops mark *a* at the cursor, `\`a` returns to its exact position, `'a` to its line. `\`\`` jumps back to your previous jump, lowercase marks stay with the buffer, and uppercase `mA` work across files.

## init.lua config {#config}

Neovim is configured in Lua. Start at `~/.config/nvim/init.lua`, set options with `vim.opt`, and bind keys with `vim.keymap.set`.

### vim.opt

Options are Lua table fields. Reload with `:source %`.

```
vim.opt.number = true          -- line numbers
vim.opt.relativenumber = true  -- relative jumps
vim.opt.shiftwidth = 2         -- indent width
vim.opt.tabstop = 2
vim.opt.expandtab = true       -- spaces, not tabs
vim.opt.smartindent = true
vim.opt.ignorecase = true      -- search…
vim.opt.smartcase = true       -- …unless uppercase
```

### vim.keymap.set

Signature: `vim.keymap.set(mode, lhs, rhs, opts)`.

```
vim.keymap.set("n", "<leader>w", ":w<CR>", { desc = "Save" })
vim.keymap.set("n", "<leader>q", ":q<CR>", { desc = "Quit" })
vim.keymap.set("n", "Y", "y$", { desc = "Yank to EOL" })
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv",
  { desc = "Move line down" })
```

### Leader key

A leader gives every custom map a namespace. `<leader>` expands to your chosen key.

<kbd>Space</kbd> then <kbd>w</kbd> saves

```
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"
-- <leader>w means: space, then w
vim.keymap.set("n", "<leader>e", vim.cmd.Ex,
  { desc = "File explorer" })
```

### lazy.nvim

Plugin manager. Bootstrap once, then declare plugins in `~/.config/nvim/lua/plugins/`.

```
local lazypath = vim.fn.stdpath("data")
  .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  vim.fn.system({ "git", "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", lazypath })
end
vim.opt.rtp:prepend(lazypath)
require("lazy").setup("plugins")
```

> **lua:** **Where does config live?** `~/.config/nvim/init.lua` is the entry point; `require("plugins")` pulls from `lua/plugins/`. After edits, `:source %` reloads the current file — or restart Neovim and run `:checkhealth` to catch mistakes.

## LSP, treesitter & completion {#lsp}

Language servers give you go-to-definition, references, rename, and diagnostics; treesitter adds real syntax parsing; nvim-cmp ties it into completion.

### mason + lspconfig

Install servers with `:LspInstall`, then attach them per buffer — or use the built-in `vim.lsp.enable` on 0.11+.

```
require("mason").setup()
require("mason-lspconfig").setup({
  ensure_installed = { "lua_ls", "rust_analyzer" },
})
require("lspconfig").lua_ls.setup({})
require("lspconfig").rust_analyzer.setup({})
```

### treesitter

Built into core since 0.11 — parsers for C, Lua, Vimscript, and Vimdoc ship with Neovim, and treesitter highlighting is the default in 0.12. The `nvim-treesitter` plugin was archived in 2026; keep it only for extra parsers via `:TSInstall`.

```
-- 0.11+ / 0.12: nothing to configure
-- parsing + highlighting are built in
-- extra parsers still need the plugin:
--   :TSInstall rust
```

### nvim-cmp

Completion engine fed by LSP, buffer words, and paths.

```
local cmp = require("cmp")
cmp.setup({
  sources = {
    { name = "nvim_lsp" },
    { name = "buffer" },
    { name = "path" },
  },
})
```

### Go to

- Go to definition — <kbd>g</kbd><kbd>d</kbd>
- Go to references — <kbd>g</kbd><kbd>r</kbd>
- Go to declaration — <kbd>g</kbd><kbd>D</kbd>
- Go to type definition — <kbd>g</kbd><kbd>y</kbd>
- Go to implementation — <kbd>g</kbd><kbd>i</kbd>

### Hover & actions

- Hover documentation — <kbd>K</kbd>
- Rename symbol — <kbd>leader</kbd><kbd>r</kbd><kbd>n</kbd>
- Code action — <kbd>leader</kbd><kbd>c</kbd><kbd>a</kbd>
- Signature help — <kbd>Ctrl-k</kbd>
- List LSP servers — <kbd>:</kbd><kbd>LspInfo</kbd>

### Diagnostics

- Next / previous diagnostic — <kbd>]</kbd><kbd>d</kbd>/<kbd>[</kbd><kbd>d</kbd>
- Open diagnostics list — <kbd>leader</kbd><kbd>d</kbd>
- Format buffer — <kbd>leader</kbd><kbd>f</kbd>
- Open LSP log — <kbd>:</kbd><kbd>LspLog</kbd>
- Restart LSP client — <kbd>:</kbd><kbd>LspRestart</kbd>
> **LSP:** **Zero-config setup:** `:LspInstall rust_analyzer` installs a server, `:LspInfo` shows what's attached, and `:LspLog` reveals errors when a server won't start. On 0.11+ you can skip lspconfig entirely with the built-in `vim.lsp.config()` + `vim.lsp.enable("rust_analyzer")`.

## Pitfalls {#gotchas}

Small behaviors that bite everyone once — usually right after a destructive command.

### :q! vs :qa!

`:q!` discards changes and quits the *current window*. With splits or tabs open, the others stay behind. `:qa!` quits every window and buffer without saving.

```
:q!   " quit this window, discard
:qa!  " quit everything, discard
:qa   " quit everything (only if saved)
```

### Stuck in insert mode

If typing does nothing, you're probably in Normal mode; if keys appear as text, you're in Insert. Double-tap `Esc` or use `Ctrl-[` to get back. `:set showmode` shows the mode in the status line.

```
Esc Esc   " always returns to Normal
Ctrl-[    " same as Esc
Ctrl-c    " also exits insert mode
```

### Undo is a tree

Undo isn't a linear stack — it branches. If you undo then edit again, the old path still exists. Time-travel with `:earlier` / `:later`.

```
:undolist      " every undo state
:earlier 10m   " back ten minutes
:later 5s      " forward five seconds
u  Ctrl-r      " undo / redo
```

### Registers & dot

`.` repeats only the last *change* — motions don't count, and undo doesn't count either. Pasted text lands in `"+` only if your build has clipboard support; check with `:checkhealth`.

```
"ap      " paste register a
:reg     " list all registers
.        " repeat the last change only
```

### :s scope surprises

`:s` substitutes on the *current line only*, and only the first match unless you add `g`. `:%s` reaches the whole file, and `&` repeats the last substitution.

```
:s/old/new/     " this line, first hit
:s/old/new/g    " this line, all
:%s/old/new/g   " whole file
&               " repeat last :s
```

### Silent config errors

A typo in `init.lua` stops the file mid-way with no loud alarm — half your keymaps just won't exist. Read the messages with `:messages`, trace an option with `:verbose set nu?`, and run `:checkhealth` after big edits.

```
:messages        " recent errors + messages
:verbose set nu? " where 'number' was set
:checkhealth     " LSP / provider report
```

> **!:** **Lost your way?** `:q!` discards only the current window's changes. If `Ctrl-c` won't leave insert mode you may be in `-- TERMINAL --`; press `Ctrl-\ Ctrl-n` to escape a terminal back to Normal mode.
