---
title: "C++"
description: "STL, smart pointers, templates, and modern C++ syntax."
category: "Languages"
tags: ["language", "STL", "RAII", "templates"]
weight: 70
lead: "Zero-cost abstractions, safely."
version: "C++20 · C++23 · C++26"
---
C++ gives you C's speed with zero-cost abstractions: `RAII`, smart pointers, templates, and the STL. This is the daily surface — from `g++` flags to the gotchas that bite everyone once.

## Quick reference {#quickref}

The 10 things you reach for most — compile, containers, pointers, syntax. Copy any line straight into your code.

- `g++ -std=c++20 main.cpp -o main` — compile with C++20; add `-Wall -Wextra`.
- `std::vector<int> v; v.push_back(x);` — dynamic array — your default container.
- `std::map<K,V> m; m[k] = v;` — sorted key → value; `unordered_map` for hashing.
- `auto p = std::make_unique<T>(…)` — exclusive owner; freed at scope exit.
- `auto sp = std::make_shared<T>()` — reference-counted; `weak_ptr` observes without owning.
- `auto x = 42;` — type deduced at compile time.
- `for (const auto& x : v)` — iterate a range without copying.
- `auto f = [&](int n){ return n * 2; };` — lambda; `[=]` copies, `[&]` captures by ref.
- `template <typename T> T add(T a, T b)` — compile-time generic function.
- `class R { /* ctor acquires */ ~R(){ /* frees */ } }` — RAII — resource lifetime = object lifetime.

## Compile & basics {#start}

Two compilers, one standard, and the tiny syntax you need before anything else. Every program starts in `main()`.

### 1. Compile

```
g++ -std=c++23 main.cpp -o main
clang++ -std=c++23 main.cpp -o main
g++ -std=c++20 main.cpp -o main  # pin older
g++ -std=c++26 main.cpp -o main  # newest
```

### 2. Useful flags

```
-Wall -Wextra   # warnings
-Wpedantic      # strict ISO C++
-O2             # optimize
-g              # debug symbols
```

### 3. Hello world

```
#include <iostream>
int main() {
  std::cout << "hi\n";
}
```

### 4. auto & namespaces

```
namespace app { int version = 1; }
auto x = 42;              // int
auto s = "text";          // const char*
std::cout << app::version;
```

<kbd>g++</kbd> compile
<kbd>-std=c++20</kbd> standard
<kbd>-Wall</kbd> warnings
<kbd>-o main</kbd> output

> **KEY:** **Prefer `std::`.** Write `std::cout`, `std::vector`, `std::string`. A blanket `using namespace std;` is fine for tiny demos but pollutes the global namespace in real code.

## STL containers & algorithms {#stl}

`vector`, `map`, `set`, `unordered_map`, `string` — plus the `<algorithm>` toolbox and iterators.

| Container | Header | Behavior | Access |
| --- | --- | --- | --- |
| `std::vector<T>` | `<vector>` | dynamic array, contiguous | `v.push_back(x); v[i]` |
| `std::string` | `<string>` | growable text buffer | `s += "x"; s.size()` |
| `std::map<K,V>` | `<map>` | sorted key → value | `m["k"] = v;` |
| `std::set<T>` | `<set>` | sorted, unique elements | `s.insert(x);` |
| `std::unordered_map<K,V>` | `<unordered_map>` | hash map, O(1) average | `um.at("k")` |
| `std::array<T,N>` | `<array>` | fixed size, no heap | `a[0]; a.size()` |

### Common algorithms

- `std::sort(v.begin(), v.end())` — ascending; pass a comparator for custom order.
- `std::find(v.begin(), v.end(), x)` — iterator to x, or end().
- `std::count(v.begin(), v.end(), x)` — number of matches.
- `std::min_element(b, e)` — iterator to smallest.
- `std::max_element(b, e)` — iterator to largest.
- `std::reverse(b, e)` — reverse in place.
- `std::any_of(b, e, pred)` — does any element satisfy pred?
- `std::accumulate(b, e, 0)` — sum — from <numeric>.

### Iterators

Iterators point into a container; `begin()`/`end()` bound a half-open range. Range-`for` is sugar over them.

```
std::vector<int> v{3, 1, 2};
for (auto it = v.begin(); it != v.end(); ++it)
  std::cout << *it << ' ';
for (int x : v)          // same thing
  std::cout << x << ' ';
```

<details>
<summary>Erase–remove idiom</summary>

Erasing while iterating invalidates iterators. Remove first, then erase once.

```
// remove all 2s from v
v.erase(std::remove(v.begin(), v.end(), 2), v.end());
```

</details>

## Classes & inheritance {#classes}

`class` vs `struct`, constructors and destructors, member init lists, inheritance, and `virtual`.

### class vs struct

```
class Dog {          // private by default
  int age;
 public:
  void bark() { /* … */ }
};
struct Point {       // public by default
  int x, y;
};
```

### Constructors & destructors

```
class Foo {
 public:
  Foo(int n) : value(n) {}     // member init list
  Foo(const Foo&) = default;   // copy ctor
  ~Foo() = default;            // destructor
 private:
  int value;
};
```

### Inheritance

```
class Shape {
 public:
  virtual double area() const = 0;  // pure virtual
};
class Circle : public Shape {
 public:
  double area() const override;     // implement
};
```

### virtual / override / final

```
class Base { public: virtual void f() const; };
class Mid : public Base { void f() const override; };
class Leaf final : public Mid { void f() const final; };
```

> **KEY:** **Access specifiers:** `public` (anyone), `protected` (this class + derived), `private` (this class only). `virtual` enables dispatch through a base pointer; `override` catches typos, `final` blocks further overriding.

## Memory & smart pointers {#memory}

`new`/`delete`, `unique_ptr`, `shared_ptr`/`weak_ptr`, and RAII — the rule of 3/5/0.

### new / delete (raw)

```
int* p = new int(5);      // allocate
delete p;                 // free
int* arr = new int[10];
delete[] arr;             // array form
```

### std::unique_ptr

```
auto p = std::make_unique<Widget>(a, b);
p->draw();               // sole owner
// no delete — freed at scope exit
auto q = std::move(p);    // transfer ownership
```

### std::shared_ptr / weak_ptr

```
auto sp = std::make_shared<Widget>();
std::weak_ptr<Widget> wp = sp;   // no ownership
if (auto lock = wp.lock()) {     // promote
  lock->draw();
}
```

### RAII

```
class File {
  FILE* f_;
 public:
  File(const char* path) : f_(fopen(path, "r")) {}
  ~File() { if (f_) fclose(f_); }  // always runs
};
```

**new / delete** (manual, error-prone) → **unique_ptr** (exclusive owner) → **shared_ptr** (reference-counted)

1. **Acquire** — Open the resource in the constructor.
1. **Use** — Work with the object normally.
1. **Release** — The destructor frees it — even when an exception unwinds.
> **!:** **Rule of three / five / zero.** If a class owns a resource and you hand-write a destructor, copy constructor, or copy assignment, you probably need all five (plus move). If it owns nothing, write none — that's the rule of zero.

## Templates, lambdas & auto {#templates}

Function and class templates, lambdas with captures, `auto`, `decltype`, and `constexpr`.

### Function template

```
template <typename T>
T add(T a, T b) { return a + b; }

add(1, 2);        // int
add(1.5, 2.5);    // double
```

### Class template

```
template <typename T>
struct Box { T value; };

Box<int> b{42};
Box<std::string> s{"hi"};
```

### Lambdas

```
auto twice = [](int x) { return x * 2; };
auto sum = [](auto a, auto b) { return a + b; };

// captures: [=] copy · [&] ref · [this]
int n = 10;
auto plus_n = [=](int x) { return x + n; };
```

### auto & decltype

```
auto x = compute();              // deduced type
decltype(x) y = x;               // "type of x"
auto f(int a, int b) -> int;     // trailing return
```

### constexpr

```
constexpr int sq(int n) { return n * n; }
static_assert(sq(4) == 16);      // compile-time
constexpr auto v = sq(3);        // a constant
```

<details>
<summary>Lambda captures at a glance</summary>

| Capture | Meaning |
| --- | --- |
| `[=]` | capture everything used, by value |
| `[&]` | capture everything used, by reference |
| `[this]` | capture the enclosing object |
| `[n]` | capture `n` by value |
| `[&n]` | capture `n` by reference |

</details>

`template` `typename` `auto` `constexpr` `lambda` `decltype`

## Modern features {#modern}

Range-`for`, structured bindings, move semantics, initializer lists, `enum class`, `nullptr`, `optional`/`variant` — plus the C++20/23/26 highlights worth knowing.

### Range-for & structured bindings

```
for (int x : v) { … }
for (const auto& x : v) { … }   // no copy

auto [name, age] = person;      // structured binding
auto& [a, b] = pair;
```

### Move semantics

```
std::vector<int> a = build();    // move elision
std::vector<int> b = std::move(a); // a is moved-from

void sink(Widget&& w);          // rvalue reference
```

### Init lists, enum class, nullptr

```
std::vector<int> v{1, 2, 3};    // init list

enum class Color { Red, Green };
Color c = Color::Red;           // scoped

int* p = nullptr;               // not 0 / NULL
```

### std::optional

```
std::optional<int> find(int k) {
  if (k < 0) return std::nullopt;
  return k * 2;
}
if (auto r = find(3)) use(*r);
```

### std::variant

```
std::variant<int, std::string> v = "hi";
if (auto* s = std::get_if<std::string>(&v))
  use(*s);
std::visit([](auto&& x){ … }, v);
```

- **lvalue** — Named, addressable — a variable.
- **prvalue** — Pure temporary — a call result.
- **xvalue** — eXpiring — result of `std::move`.
- **glvalue** — lvalue or xvalue.
> **NEW:** **C++23** added `std::print`/`std::println`, `std::expected`, `std::mdspan`, `std::flat_map`, and `std::ranges::to`. **C++26** (ISO, finalized 2025) is the biggest upgrade since C++11 — reflection, contracts, and `std::execution`.

## stdlib bits {#stdlib}

`filesystem`, `chrono`, `thread`, `optional`, `variant`, `any` — the utilities you reach for.

### std::filesystem

```
namespace fs = std::filesystem;
fs::path p{"data/out.txt"};
if (fs::exists(p)) fs::remove(p);
for (auto& e : fs::directory_iterator("data"))
  std::cout << e.path() << '\n';
```

### std::chrono

```
using namespace std::chrono;
auto t0 = steady_clock::now();
work();
auto ms = duration_cast<milliseconds>(
            steady_clock::now() - t0).count();
```

### std::thread / std::any

```
std::thread t([]{ std::cout << "bg\n"; });
t.join();                    // wait

std::any a = 42;             // hold any type
int n = std::any_cast<int>(a);
```

- `std::print / std::println` — C++23 — format-aware printing; replaces `cout <<` chains.
- `std::format` — C++20 — type-safe string formatting.
- `std::span<T>` — C++20 — non-owning view over an array/vector.
- `std::expected<T,E>` — C++23 — a value or an error (like `Result`).
- `std::ranges / std::views` — C++20 — compose algorithms over ranges.
- `std::optional<T>` — a value or std::nullopt.
- `std::variant<A,B>` — one of several types.
- `std::any` — any copyable type.
- `std::filesystem::path` — filesystem paths and traversal.
- `std::chrono::steady_clock` — monotonic timing.
- `std::thread / std::jthread` — concurrency.
- `std::async → std::future` — background result.
- `std::to_string / std::stoi` — string ⇄ number.

## Pitfalls {#gotchas}

Dangling references, object slicing, iterator invalidation, const correctness, shadowing, and the rule of 3/5.

### Dangling references

```
const std::string& bad() {
  std::string s = "temp";
  return s;                 // s dies at return
}                           // → dangling
std::string good() { return "temp"; } // return by value
```

### Object slicing

```
Derived d;
Base b = d;        // slices off Derived members
// store by pointer/reference instead:
Base& r = d;
auto p = std::make_unique<Derived>();
```

### Iterator invalidation

```
for (auto it = v.begin(); it != v.end(); ++it)
  if (*it == 2) v.erase(it);   // it is invalidated
// safe: erase–remove, rebuild, or index loop
```

### Const correctness

```
void f(const std::vector<int>& v); // no copy, no mutation
const int* p;     // pointer to const
int* const q;     // const pointer
const int& r = x; // const reference
```

### Rule of three / five / zero

If a class owns a resource and you hand-write a destructor, copy constructor, or copy assignment, you almost always need all five (copy + move + destructor). If it owns nothing, write none.

```
// Rule of five: = default or = delete
Foo(const Foo&) = default;
Foo(Foo&&) = default;
```

### Shadowing

```
int x = 1;
{ int x = 2; }   // shadows outer x — confusing
// rename inner variables; compile with -Wshadow
```

### Most vexing parse

```
Widget w();      // declares a FUNCTION, not an object
Widget w;        // default-constructs
Widget w{args};  // braces always construct
```

### Signed/unsigned comparison

```
for (int i = 0; i < v.size(); ++i)   // sign mismatch
for (std::size_t i = 0; i < v.size(); ++i)
// v[i] is unchecked; v.at(i) throws out_of_range
```

> **!:** **Enable warnings.** `-Wall -Wextra -Wshadow -Wpedantic` catch most of these at compile time. Add sanitizers (`-fsanitize=address,undefined`) to catch dangling pointers and undefined behavior at runtime.
