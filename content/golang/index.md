---
title: "Go"
description: "Modules, structs, interfaces, goroutines, channels, and errors."
category: "Languages"
tags: ["language", "goroutine", "interface", "module"]
weight: 80
lead: "Simple, fast, concurrent."
version: "1.27"
---
Go is a compiled, statically-typed language built for servers and CLIs: goroutines make concurrency cheap, interfaces keep code decoupled, and one static binary ships everything. This is the surface you'll touch every day.

## Quick reference {#quickref}

The ten commands and idioms you reach for every day. Each points at a full section below.

- `go mod init example/app` — Start a module — writes `go.mod`; `go mod tidy` prunes deps.
- `go build` — · Compile to a binary, or build + run in one. `go build -o bin/app` names output.
- `go test ./...` — Run all tests; `go test -run TestX` filters by name.
- `go get pkg@v1.2.3` — · Add/upgrade a dependency; format every file.
- `go doWork()` — Goroutine — runs concurrently; thousands are fine.
- `ch := make(chan T)` — Channel: `ch <- v` sends, `v := <-ch` receives.
- `select { case v := <-ch: … }` — Multiplex channels; `default:` is non-blocking, `<-time.After(d)` times out.
- `defer f.Close()` — Run on return, LIFO order. Pair with every open.
- `type Greeter interface { Greet() string }` — Interface — any type with `Greet() string` satisfies it implicitly.
- `if err != nil { return err }` — Errors are values: wrap with `%w`, match with `errors.Is` / `errors.As`.

> **→:** **Where to go next:** Modules & build covers the toolchain, Concurrency covers goroutines/channels/select, Structs & interfaces covers methods, and Errors & context covers `%w`, `errors.Is`, and `errors.As`.

## Modules & build {#start}

`go mod` manages dependencies; `go build`, `go run`, and `go test` are the daily loop. Modules replaced `GOPATH` in Go 1.11 and are default since 1.16.

### 1. New module

```
go mod init example/hello   # create go.mod
go mod tidy                 # add missing, drop unused
go mod download             # fetch deps
```

### 2. Build & run

```
go build               # compile → ./hello
go run .               # build + run package
go build -o bin/app    # name the output
```

### 3. Test & vet

```
go test               # tests in this package
go test ./...         # all packages
go test -run TestX    # filter by name
go vet ./...          # static analysis
```

### 4. Format

```
gofmt -w main.go      # format one file
gofmt -w .            # format all .go
go fmt ./...          # via the toolchain
```

| File / env | What it is |
| --- | --- |
| `go.mod` | Module path + `require` directives (dependencies). |
| `go.sum` | Checksums of dependency content — commit it. |
| `go get pkg@v1.2.3` | Add or upgrade a dependency in `go.mod`. |
| `GOPATH` | Legacy pre-modules workspace (`~/go`); modules replaced it. |
| `go env GOMODCACHE` | Where downloaded module sources are cached. |
| `GOOS` / `GOARCH` | Cross-compile targets, e.g. `GOOS=linux GOARCH=amd64 go build`. |

> **KEY:** **Run `gofmt` on every save.** Formatting is non-negotiable in Go — `gofmt -w .` normalizes tabs, spacing, and import order, so style is never a debate and diffs stay clean.

## Types & zero values {#types}

Variables hold a zero value until assigned — no uninitialized memory. Declare with `var` or the short `:=` operator.

`bool` `string` `int` `int8` `int16` `int32` `int64` `uint` `uint8` `uint64` `float32` `float64` `byte` `rune` `complex128`

| Type | Example | Notes |
| --- | --- | --- |
| `bool` | `var ok = true` | `true` / `false`; no truthy/falsy. |
| `string` | `s := "hi"` | Immutable UTF-8 bytes. |
| `int` | `n := 42` | Platform-sized (32 or 64-bit). |
| `int32` / `int64` | `var id int64 = 9` | Explicit width; `int64` for timestamps/IDs. |
| `uint` / `uint64` | `var u uint = 7` | Unsigned; use sparingly. |
| `float64` | `f := 3.14` | Default float literal type; prefer it over `float32`. |
| `byte` | `b := []byte("hi")` | Alias for `uint8` — a raw byte. |
| `rune` | `r := '界'` | Alias for `int32` — one code point. |

### Zero values

```
var i int        // 0
var f float64    // 0
var s string     // ""
var b bool       // false
var p *int       // nil
var sl []int     // nil (but usable)
```

### Short declaration `:=`

```
n := 42          // infers int
name := "Go"     // infers string
x, y := 1, 2     // multiple at once

// := only inside functions;
// at package level use var
```

### `var` & constants

```
var count int = 0
var name = "Go"        // type inferred

const Pi = 3.14159
const (
    StatusOK       = 200
    StatusNotFound = 404
)
```

### Arrays `[N]T` — fixed

```
arr := [3]int{1, 2, 3}
arr2 := [...]int{1, 2, 3} // len inferred
n := arr[0]               // index
fmt.Println(len(arr))     // 3
// arrays are values: copying copies data
```

### Slices `[]T` — growable

```
sl := []int{1, 2, 3}
sl = append(sl, 4)
sub := sl[1:3]      // [2, 3] — a view
// slices are the everyday list type;
// see Collections for make/copy
```

### Generics `[T any]` — Go 1.18+

```
func First[T any](xs []T) T {
    return xs[0]
}
n := First([]int{1, 2, 3})       // int
s := First([]string{"a", "b"})   // string

// constraint: ~int admits any
// underlying-int type (aliases too)
type Number interface {
    ~int | ~float64
}
func Sum[T Number](xs []T) T {
    var total T
    for _, x := range xs { total += x }
    return total
}
```

### Constraints: `any` & `comparable`

```
// any == interface{} (Go 1.18+)
// comparable: usable with ==
func Index[T comparable](xs []T, v T) int {
    for i, x := range xs {
        if x == v { return i }
    }
    return -1
}

// ~int matches int and its
// defined types (type MyInt int)
// Generic type aliases: Go 1.24+
```

## Control flow {#control}

`for` is the only loop keyword; `switch` never falls through; `defer` runs cleanup in LIFO order on return.

### `if` / `else`

```
if n > 10 {
    fmt.Println("big")
} else if n > 5 {
    fmt.Println("mid")
} else {
    fmt.Println("small")
}

// short statement before the check:
if err := do(); err != nil {
    return err
}
```

### `for` — all three forms

```
// C-style
for i := 0; i < 5; i++ {
    fmt.Println(i)
}

// while-style
for n < 100 {
    n *= 2
}

// infinite
for {
    // break or return to exit
}
```

### `switch`

```
switch n {
case 1:
    fmt.Println("one")
case 2, 3:
    fmt.Println("small")
default:
    fmt.Println("other")
}
// no break needed — cases don't
// fall through. Switch w/o value:
switch {
case n < 0:
    fmt.Println("neg")
}
```

### `defer` — LIFO

```
f, err := os.Open("f.txt")
if err != nil {
    return err
}
defer f.Close()   // runs on return

defer fmt.Println("world")
defer fmt.Println("hello")
// prints: hello, then world (LIFO)
```

### `panic` / `recover`

```
func mayPanic() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("recovered:", r)
        }
    }()
    panic("boom")   // stops here
}
// recover only works inside defer
```

> **!:** **`panic` is for unrecoverable bugs, not flow control.** Return an `error` for expected failures and reserve `panic`/`recover` for invariant violations — see the Errors & context section.

## Structs, methods & interfaces {#structs}

Types with methods satisfy interfaces implicitly — no `implements` keyword. Pointer receivers let a method mutate its receiver.

### Struct literals

```
type User struct {
    Name string
    Age  int
}

u := User{Name: "Ada", Age: 36}  // named
v := User{"Ada", 36}             // positional
u.Age = 37                       // field access
```

### Methods & receivers

```
// value receiver: reads a copy
func (u User) Greet() string {
    return "hi " + u.Name
}

// pointer receiver: can mutate
func (u *User) SetAge(a int) {
    u.Age = a
}

u.SetAge(40)   // Go takes &u for you
```

### Embedded structs

```
type Employee struct {
    User              // embedded
    Title string
}

e := Employee{User{"Ada", 36}, "Eng"}
fmt.Println(e.Name)    // promoted field
fmt.Println(e.Greet()) // promoted method
```

### Interfaces

```
type Greeter interface {
    Greet() string
}
// any type with Greet() string
// satisfies Greeter — implicit.

var g Greeter = User{"Ada", 36}
fmt.Println(g.Greet())

var x any = 42     // any == interface{}
var y any = "hi"
```

### Type assertion & switch

```
v, ok := x.(string)   // ok = false if wrong
if ok {
    fmt.Println(v)
}

switch t := x.(type) {
case string:
    fmt.Println("string", t)
case int:
    fmt.Println("int", t)
default:
    fmt.Println("other")
}
```

> **→:** **The `error` interface** is just `type error interface { Error() string }` — any type with an `Error()` method is an error. See Errors & context for `%w`, `errors.Is`, and `errors.As`.

## Slices, maps & strings {#collections}

Slices are views into a backing array; maps are unordered; strings are immutable bytes. Convert between them explicitly.

### `make` / `append` / `copy`

```
s := make([]int, 0, 8)   // len 0, cap 8
s = append(s, 1, 2, 3)
s = append(s, more...)    // spread a slice

dst := make([]int, len(s))
n := copy(dst, s)         // n = copied
```

### Map operations

```
m := map[string]int{"a": 1}
m["b"] = 2

v, ok := m["a"]   // ok = false if missing
if v, ok := m["c"]; ok {
    fmt.Println(v)
}
delete(m, "b")
// unordered: iterate with range
```

### `range`

```
for i, v := range xs { ... }   // index, value
for k, v := range m  { ... }   // key, value
for i := range xs    { ... }   // index only
for _, v := range xs { ... }   // value only
// underscore discards a value
```

### `string` vs `[]byte`

```
s := "héllo"
b := []byte(s)      // string → bytes (copy)
s2 := string(b)     // bytes → string (copy)

// strings are immutable; []byte is
// mutable. Indexing s[i] gives a byte.
```

### Runes & `strconv`

```
for _, r := range "héllo" {
    // r is a rune (int32), not a byte
}

n, err := strconv.Atoi("42")   // → int
s := strconv.Itoa(42)          // → "42"
f, err := strconv.ParseFloat("3.14", 64)
s = fmt.Sprintf("%d items", n)
```

### `range` over int — Go 1.22+

```
for i := range 3 {       // 0, 1, 2
    fmt.Println(i)
}

// range over a channel runs
// until the channel is closed:
for v := range ch {
    fmt.Println(v)
}
```

### Iterators — `range` over func (1.23+)

```
// iter.Seq[int] yields ints one at a time
func Count(n int) iter.Seq[int] {
    return func(yield func(int) bool) {
        for i := range n {
            if !yield(i) { return }
        }
    }
}
for v := range Count(3) {
    fmt.Println(v)      // 0 1 2
}

slices.Sorted(maps.Keys(m))  // 1.21+
```

> **KEY:** **Ranging a string yields runes, indexing yields bytes.** For multi-byte text use `[]rune(s)` to get a slice of code points, or range directly. Use `strings.Builder` to concatenate in a loop instead of `+=`.

## Goroutines & channels {#concurrency}

Start work with `go`; pass data and synchronize through channels. Share memory by communicating, not by mutating shared state.

### `go` keyword

```
go doWork()        // run in a goroutine

go func(x int) {   // anonymous
    fmt.Println(x)
}(42)

// goroutines are cheap —
// thousands run comfortably.
```

### Channels

```
ch := make(chan int)         // unbuffered: sync
ch2 := make(chan int, 10)    // buffered: async

ch <- 42          // send (blocks if full)
v := <-ch         // receive (blocks if empty)
close(ch)         // close; later sends panic
```

### `select`

```
select {
case v := <-ch1:
    fmt.Println(v)
case ch2 <- 42:
    fmt.Println("sent")
case <-time.After(2 * time.Second):
    fmt.Println("timeout")
default:
    // non-blocking
}
```

### `sync.WaitGroup`

```
var wg sync.WaitGroup
for _, u := range urls {
    wg.Add(1)
    go func(u string) {
        defer wg.Done()
        fetch(u)
    }(u)
}
wg.Wait()   // block until all finish
```

### `sync.Mutex`

```
var mu sync.Mutex
var counter int

func inc() {
    mu.Lock()
    defer mu.Unlock()
    counter++
}
// protect shared state; prefer
// channels for passing values.
```

> **⌁:** **Channels as pipes:** an unbuffered `make(chan T)` synchronizes — a send blocks until another goroutine receives, so it both transfers data and waits. Send from the producer, receive in the consumer, and `close(ch)` so a `for v := range ch` loop ends.

## Errors & context {#errors}

Errors are values. Wrap them with `%w` to preserve the chain, match with `errors.Is`/`As`, and thread `context.Context` through IO and network calls.

### The `error` interface

```
type error interface {
    Error() string
}

err := errors.New("boom")
err2 := fmt.Errorf("open %s: %w", path, err)
// %w wraps err so callers can
// unwrap it with Is / As

// Go 1.20+: combine many errors
err3 := errors.Join(e1, e2, e3)
```

### `errors.Is` / `As`

```
if errors.Is(err, fs.ErrNotExist) {
    // err, or anything it wraps, matches
}

var ne *net.OpError
if errors.As(err, &ne) {
    fmt.Println(ne.Op)   // typed error
}
```

### `context.Context`

```
ctx := context.Background()
ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
defer cancel()

req, _ := http.NewRequestWithContext(
    ctx, "GET", url, nil)
// pass ctx first to every IO call
```

### `defer` for cleanup

```
f, err := os.Open("f.txt")
if err != nil {
    return err
}
defer f.Close()   // runs on return

db, _ := sql.Open("sqlite", "app.db")
defer db.Close()
```

### `panic` vs error

```
// recoverable → return an error
if err != nil {
    return err
}

// programmer bug → panic
panic("unreachable")

func main() {
    defer func() {
        if r := recover(); r != nil {
            log.Fatal(r)
        }
    }()
    run()
}
```

> **!:** **Return errors; don't `panic`.** Missing files, timeouts, and bad input are expected — return an `error` and wrap it with `%w` so callers can `errors.Is`/`As`. `panic` unwinds the goroutine and only `recover` inside a `defer` stops it.

## Standard library {#stdlib}

The standard library covers HTTP servers, JSON, files, streams, time, flags, and formatting — no third-party deps for the common 80%.

- `net/http` — HTTP server & client. `http.Get(url)`, `http.HandleFunc("/", h)`, `http.ListenAndServe(":8080", nil)`.
- `encoding/json` — JSON encode/decode. `json.Marshal(v)`, `json.Unmarshal(b, &v)`, struct tags `json:"name,omitempty"`.
- `os` — Files & process. `os.ReadFile`, `os.WriteFile`, `os.Open`, `os.Args`, `os.Getenv`, `os.Exit`.
- `io` — Streams. `io.Copy(dst, src)`, `io.ReadAll(r)`, plus the `io.Reader` / `io.Writer` interfaces.
- `time` — Time & durations. `time.Now()`, `time.Sleep`, `time.After`, `time.Parse`, `time.Duration`.
- `flag` — CLI flags. `flag.String("name", "", "help")`, `flag.Int`, `flag.Parse()`.
- `fmt` — Printing & errors. `fmt.Println`, `fmt.Printf("%s %d")`, `fmt.Sprintf`, `fmt.Errorf`.
- `strings` — Text. `strings.Split`, `strings.Join`, `strings.Contains`, `strings.HasPrefix`, `strings.Builder`.
- `log` — Logging. `log.Println`, `log.Printf`, `log.Fatal` (exits), `log.SetPrefix`.
- `sort` — Sorting. `sort.Ints(xs)`, `sort.Strings`, `sort.Slice(xs, func(i, j int) bool)`.
- `slices` — Slice helpers (1.21+). `slices.Sort`, `slices.Clone`, `slices.Contains`, `slices.Concat`.
- `maps` — Map helpers (1.21+). `maps.Keys`, `maps.Values`, `maps.Clone`, `maps.Equal`.
- `iter` — Iterators (1.23+). `iter.Seq[T]`, `iter.Seq2[K,V]`, `iter.Pull`.

### HTTP server

```
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "hello")
    })
    http.ListenAndServe(":8080", nil)
}
```

### JSON + struct tags

```
type User struct {
    Name string `json:"name"`
    Age  int    `json:"age,omitempty"`
}

b, _ := json.Marshal(User{"Ada", 36})
// {"name":"Ada","age":36}

var u User
json.Unmarshal(b, &u)
```

## Gotchas {#gotchas}

The traps that survive code review. Go compiles fast and trusts you to check errors — these are the rules it enforces at runtime instead.

### Nil map write panics

```
var m map[string]int
m["a"] = 1   // panic: assignment to
             // entry in nil map
m = make(map[string]int)   // fix
```

### `defer` evaluates args now

```
i := 1
defer fmt.Println(i)  // prints 1
i = 2
// to read at return time:
defer func() { fmt.Println(i) }()
```

### Loop capture in goroutines

```
// Go 1.22+: each iteration gets a
// fresh variable, so this is safe:
for _, u := range urls {
    go func() { fetch(u) }()
}
// explicit param works everywhere:
go func(u string) { fetch(u) }(u)
```

### Slices share a backing array

```
s := []int{1, 2, 3, 4}
sub := s[1:3]   // [2 3] — shares s
sub[0] = 99     // s → [1 99 3 4]
c := slices.Clone(s)   // independent
```

### `:=` shadows outer `err`

```
var err error
if err = doA(); err != nil {
    return err
}
x, err := doB()  // new err, outer hidden
// reuse outer with = when err exists:
x, err = doB()
```

### Send on closed channel panics

```
close(ch)
ch <- 1         // panic: send on closed
v, ok := <-ch   // ok == false, v is zero
// only the sender closes; check ok,
// or iterate with for v := range ch
```

> **!:** **Know the rules, or debug the panic.** Nil-map writes, closed-channel sends, and shadowed errors compile fine and blow up at runtime. `go vet ./...` and tests catch many — but a `defer func()` that reads a captured variable, and a `:=` that hides an outer `err`, need a human eye.
