---
title: "TypeScript"
description: "Types, interfaces, generics, narrowing, and utility types."
category: "Languages"
tags: ["language", "generic", "narrowing", "utility"]
weight: 120
lead: "Types that catch bugs early."
version: "5.x"
---
TypeScript is JavaScript with types: annotate once and the compiler catches whole classes of bugs before they ship. This is the daily surface — types, interfaces, generics, narrowing, and the tooling around `tsc`.

## Quick reference {#quickref}

The daily surface on one screen: the commands, type operators, and built-ins you reach for constantly. Everything here is expanded in the sections below.

- `tsc --noEmit` — type-check only — emit no JavaScript
- `interface User { name: string }` — object shape (mergeable); `type` also covers unions & tuples
- `function f<T>(x: T): T { return x }` — generic — `T` is inferred from the call
- `type Id = string | number` — union type; literals give `"on" | "off"`
- `if (typeof x === "string") …` — narrow a union — also `instanceof` and `"k" in obj`
- `Partial<T> · Pick<T, K> · Omit<T, K>` — built-in utility types for reshaping objects
- `const x = { a: 1 } as const` — deep readonly + literal types preserved
- `const c = { … } satisfies Config` — check against a type without widening
- `keyof T · T[K]` — key union + indexed access — the mapped-type machinery
- `function id<const T>(x: T): T` — const type parameter (TS 5.8) — keeps literal types

## Setup & compile {#start}

`tsc` checks your types and emits plain JavaScript. A single `tsconfig.json` drives every flag and file.

### 1. Install

```
npm i -g typescript    # global CLI
tsc --version          # → Version 5.x.x
# or project-local:
npm i -D typescript
```

### 2. Compile a file

```
tsc app.ts          # → app.js
tsc src/*.ts        # compile a set
tsc --watch         # recompile on save
```

### 3. Init & config

```
tsc --init          # write tsconfig.json
tsc -p tsconfig.json
tsc --noEmit        # type-check only
tsc --strict        # full strictness
```

### 4. Run (node / bun)

```
tsc app.ts && node app.js
npx tsx app.ts      # run TS directly
bun run app.ts      # bun runs TS natively
```

1. **Write** — `app.ts` — annotated source.
1. **Type-check** — `tsc --noEmit` — find errors.
1. **Transpile** — `tsc` — strip types, emit `.js`.
1. **Run** — `node app.js` or `bun app.ts`.
> **KEY:** **Type-check ≠ build.** `tsc` both checks and emits JavaScript; `tsc --noEmit` checks only. `--strict` turns on the whole strictness family at once (and is on by default in the generated `tsconfig.json`).

## Types & annotations {#primitives}

The building blocks: primitives, arrays, tuples, and the operators that combine them.

### Primitives & annotations

```
let age: number = 36;
let name: string = "Ada";
let ok: boolean = true;
let big: bigint = 100n;
let none: null = null;
let undef: undefined = undefined;
let sym: symbol = Symbol("id");
```

### Arrays & tuples

```
let nums: number[] = [1, 2, 3];
let names: Array<string> = ["a", "b"];
let pair: [string, number] = ["Ada", 36];
let ro: readonly string[] = ["x"];

// array of objects
let users: { id: number }[] = [];
```

### Union & intersection

```
let id: string | number = "u1";
let maybe: string | null = null;

type Draggable = { drag(): void };
type Resizable = { resize(): void };
type Widget = Draggable & Resizable;
// has BOTH drag() and resize()
```

### Literal types & aliases

```
type Mode = "on" | "off";
type Status = "idle" | "loading" | "done";
type ID = string | number;
type Point = { x: number; y: number };

let mode: Mode = "on";   // ✓
// mode = "maybe";       // ✗ error
```

### unknown vs any vs never

```
let a: any = risky();     // opts out of checking
a.nope().still.fine();     // no error — dangerous

let u: unknown = risky();  // safe: must narrow
if (typeof u === "string") console.log(u.length);

function fail(): never { throw new Error("boom"); }
```

`any = opt out of checking` `unknown = safe, narrow before use` `never = function never returns`

> **!:** **Avoid `any`.** It silently disables checking and lets type errors through. Prefer `unknown` and narrow with `typeof` / `in` before using the value.

## Interfaces & type aliases {#interfaces}

Interfaces describe object shapes; type aliases describe any shape — and both compose.

### interface vs type

```
interface User { name: string }
type User = { name: string };

type ID = string | number;   // type: unions
type Pair = [string, number];// type: tuples

interface A { a: number }
interface A { b: string }    // interface: merges
```

### Optional & readonly

```
interface User {
  readonly id: number;
  name: string;
  email?: string;        // optional
}

const u: User = { id: 1, name: "Ada" };
// u.id = 2;             // ✗ readonly
```

### extends

```
interface Animal { name: string }
interface Dog extends Animal {
  breed: string;
}
interface A extends B, C {} // multiple

// type aliases extend via &
type Dog2 = Animal & { breed: string };
```

### Index signatures

```
interface Scores {
  [key: string]: number;
}
let s: Scores = { math: 90, art: 88 };

interface Dict<T> {
  [key: string]: T;
}
let d: Dict<boolean> = { active: true };
```

### Function types

```
type Fn = (x: number) => string;
const f: Fn = (x) => String(x);

type Callback = (err: Error | null, data?: string) => void;
```

### Call signatures

```
interface Comparator {
  (a: string, b: string): number;
}
const byLen: Comparator = (a, b) => a.length - b.length;

byLen("a", "bbb");   // -2
```

> **KEY:** **Interface for object shapes, type for everything else.** A `type` alias can express unions, primitives, and tuples; an `interface` can be reopened and merged later. For plain object shapes the two are interchangeable — pick one and stay consistent.

## Functions & generics {#functions}

Annotate parameters and returns, then make functions reusable across types with generics.

### Parameters & return

```
function add(a: number, b: number): number {
  return a + b;
}
const sub = (a: number, b: number): number => a - b;

function log(msg: string): void {
  console.log(msg);
}
```

### Generics <T>

```
function identity<T>(x: T): T { return x; }

identity<string>("hi");   // T = string
identity(42);            // T = number (inferred)

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

### Generic constraints

```
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest("ab", "cde");     // "cde"
longest([1], [1, 2, 3]);  // [1, 2, 3]

function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### const type params (5.8)

```
function id<const T>(x: T): T { return x; }
const a = id("hi");    // "hi" — literal kept
const b = id([1, 2]);  // readonly [1, 2]

// before 5.8 you'd write: id("hi" as const)
// the <const> saves the call-site cast
```

### Function overloads

```
function parse(x: string): number;
function parse(x: number): string;
function parse(x: string | number): number | string {
  return typeof x === "string" ? Number(x) : String(x);
}
parse("42");   // number
parse(42);     // string
```

### Rest & default params

```
function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3);   // 6

function greet(name: string, greeting = "hi") {
  return `${greeting}, ${name}`;
}
```

### Return types: void & never

```
function log(msg: string): void {
  console.log(msg);       // returns nothing
}
function fail(msg: string): never {
  throw new Error(msg);   // never returns
}
function loop(): never {
  while (true) {}         // never returns
}
```

> **KEY:** **Let inference do the work.** `identity(42)` infers `T = number` — you rarely write `<number>` by hand. Constraints (`<T extends …>`) let you promise a capability while keeping the exact type.

> **!:** **In `.tsx` files, give generic arrows a trailing comma:** `const f = <T,>(x: T) => x`. Without the comma, `<T>` is parsed as a JSX tag and the compiler errors.

## Classes & objects {#classes}

Classes add visibility and inheritance; parameter properties cut the boilerplate.

### class & constructor

```
class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
const p = new Point(3, 4);
p.x;   // 3
```

### Parameter properties

```
class Point {
  constructor(public x: number, public y: number) {}
}
// shorthand for: declare the field
// AND assign it in the constructor

const p = new Point(3, 4);
p.x;   // 3
```

### Visibility

```
class Account {
  public id: string;        // default
  private balance = 0;      // this class only
  protected owner: string;  // + subclasses
  readonly created: Date;   // assign once
}

// a.balance;   // ✗ private
// a.owner;     // ✗ protected
```

### abstract

```
abstract class Shape {
  abstract area(): number;   // subclass must implement
  describe() {
    return `area ${this.area()}`;
  }
}
class Square extends Shape {
  constructor(private s: number) { super(); }
  area() { return this.s * this.s; }
}
```

### implements

```
interface Named { name: string }
interface Greeter { greet(): string }

class Person implements Named, Greeter {
  constructor(public name: string) {}
  greet() { return `hi ${this.name}`; }
}
```

### Enums

```
enum Direction { Up, Down, Left, Right }
Direction.Up;     // 0
Direction[1];     // "Down"

enum Status { Ok = 200, NotFound = 404 }

const enum Color { Red, Green }
// inlined at compile time — no runtime object
```

> **!:** **Enums are runtime objects**; a `const enum` is inlined and emits nothing — but it's incompatible with `isolatedModules` (and the newer `erasableSyntaxOnly`), so bundlers like Vite discourage it. For simple finite sets, a union of string literals (`"on" | "off"`) is often lighter and easier to extend.

## Narrowing & type guards {#narrowing}

A union is only useful after you shrink it to one branch — these are the tools that do it.

### typeof

```
function len(x: string | number) {
  if (typeof x === "string") {
    return x.length;         // string here
  }
  return String(x).length;   // number here
}
// narrows: string number boolean
// symbol bigint undefined object function
```

### instanceof

```
function message(e: Error | string) {
  if (e instanceof Error) {
    return e.message;   // Error here
  }
  return e;             // string here
}
```

### in

```
type Bird = { fly(): void };
type Fish = { swim(): void };

function move(a: Bird | Fish) {
  if ("fly" in a) a.fly();
  else a.swim();
}
```

### Discriminated unions

```
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape) {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "rect":   return s.w * s.h;
  }
}
```

### Type predicates

```
function isFish(pet: Bird | Fish): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

if (isFish(pet)) {
  pet.swim();   // narrowed to Fish
} else {
  pet.fly();    // narrowed to Bird
}
```

### satisfies & as const

```
const palette = { red: "#f00", green: "#0f0" } as const;
// palette.red: "#f00" — a literal, not string

const config = { port: 8080 } satisfies ServerConfig;
// keeps the exact type AND checks it
// against ServerConfig
```

> **KEY:** `satisfies` validates without widening — your literal types survive. `as const` makes a value deeply readonly and keeps its literals, the backbone of discriminated unions.

## Utility & mapped types {#utilities}

Built-in type transformers for reshaping existing types, plus the `keyof` machinery behind them.

| Utility | What it does |
| --- | --- |
| `Partial<T>` | makes every property optional |
| `Required<T>` | makes every property required |
| `Readonly<T>` | makes every property readonly |
| `Pick<T, K>` | keeps only the keys `K` |
| `Omit<T, K>` | drops the keys `K` |
| `Record<K, V>` | maps keys `K` to the value type `V` |
| `ReturnType<F>` | return type of function `F` |
| `Parameters<F>` | tuple of function `F`'s parameters |
| `NonNullable<T>` | removes `null` and `undefined` |
| `Awaited<T>` | the resolved type of a promise |
| `Exclude<T, U>` | types in `T` not in `U` |
| `Extract<T, U>` | types in `T` also in `U` |

### keyof & indexed access

```
type User = { id: number; name: string };
type K = keyof User;          // "id" | "name"
type Name = User["name"];     // string

function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
get(user, "name");   // string (checked key)
```

### Mapped types

```
type Flags<T> = { [K in keyof T]: boolean };
type UserFlags = Flags<User>;
// { id: boolean; name: boolean }

// the built-ins, from scratch:
type Partial<T> = { [K in keyof T]?: T[K] };
type Readonly<T> = { readonly [K in keyof T]: T[K] };

type Pick<T, K extends keyof T> = { [P in K]: T[P] };
```

> **KEY:** `keyof` + mapped types are the building blocks — `Partial`, `Readonly`, `Pick`, and `Omit` are all implemented this way in the standard library.

> **!:** **`Object.keys(obj)` returns `string[]`, not `keyof T`.** The runtime keys aren't proven to be typed keys, so indexing with them needs a guard or a cast.

## Tooling & config {#tooling}

Configure the compiler, ship declaration files, and wire up linting and direct execution.

### tsconfig.json

```
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### Strict flags

```
"strict": true                  // all below ON
"noImplicitAny": true
"strictNullChecks": true
"noUncheckedIndexedAccess": true
"exactOptionalPropertyTypes": true
"noImplicitReturns": true
```

### Declaration files

```
declare const API_URL: string;   // ambient value
declare module "*.css";          // wildcard module

// types.d.ts — types only, ships no JS
export interface Config { port: number }

tsc --declaration       // emit .d.ts for your code
```

### tsx & ts-node

```
npm i -D tsx
npx tsx app.ts        # run TS directly

npm i -D ts-node
npx ts-node app.ts

# types in one-off scripts:
npx tsx -e 'const n: number = 2'
```

### ESLint + typescript-eslint

```
npm i -D eslint typescript-eslint

// eslint.config.mjs
import tseslint from "typescript-eslint";
export default tseslint.config(
  ...tseslint.configs.recommended,
);

npx eslint .
```

### Vite / bundlers

```
# Vite runs TS with no build step
npm create vite@latest my-app -- --template vanilla-ts
npm run dev

# esbuild strips types instantly
esbuild src/app.ts --bundle --outfile=dist/app.js
```

#### tsc — check & build

- Type-check only — <kbd>tsc --noEmit</kbd>
- Watch mode — <kbd>tsc --watch</kbd>
- Init config — <kbd>tsc --init</kbd>

#### tsc — emit

- Output dir — <kbd>tsc --outDir dist</kbd>
- Declaration files — <kbd>tsc --declaration</kbd>
- Use a project — <kbd>tsc -p tsconfig.json</kbd>

#### run directly

- tsx — <kbd>npx tsx app.ts</kbd>
- ts-node — <kbd>npx ts-node app.ts</kbd>
- bun — <kbd>bun run app.ts</kbd>
> **KEY:** **Current release: TypeScript 5.9** (Aug 2025). Highlights: `import defer` (deferred module evaluation), a minimal `tsc --init` that now defaults to `module: "nodenext"` and `target: "esnext"`, and — from 5.8 — `const` type parameters and the `--erasableSyntaxOnly` flag.

> **!:** **Declaration files (`.d.ts`) are types only.** They are stripped from the emitted JavaScript and exist so other projects (and your editor) can consume your public types.
