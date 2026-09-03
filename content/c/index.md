---
title: "C"
description: "Pointers, memory, structs, strings, and the preprocessor."
category: "Languages"
tags: ["language", "pointers", "malloc", "struct"]
weight: 60
lead: "Close to the metal."
version: "C17 · C23"
---
C is the language underneath almost everything: small, fast, and uncompromisingly close to the machine. This cheatsheet is the 20% of C you reach for every day.

## The 20-second version {#quickref}

Compile, print, point, allocate, copy, define — the handful of idioms you type every session.

### Compile

```
gcc -Wall -Wextra -std=c23 main.c -o main
clang -Wall -Wextra main.c -o main
# debug + sanitizers:
gcc -g -fsanitize=address main.c -o main
```

### printf format

```
%d  int        %f  double
%u  unsigned   %c  char
%x  hex        %s  char*
%p  pointer    %zu size_t
printf("%d %s\n", n, s);
```

### Pointers

```
int x = 42;
int *p = &x;   // address-of
*p = 7;        // dereference
p + 1;         // next element
int *a = arr;  // array → pointer
```

### malloc / free

```
int *p = malloc(n * sizeof *p);
if (!p) { perror("malloc"); exit(1); }
/* ... use p ... */
free(p);
p = NULL;   // avoid use-after-free
```

### Struct

```
typedef struct {
  int x, y;
} Point;
Point p = {1, 2};
p.x = 3;         // dot
Point *pp = &p;
pp->y = 4;       // arrow
```

### Strings

```
#include <string.h>
strlen(s)     strcmp(a, b)
strcpy(d, s)  strcat(d, s)
strchr(s, c)  strstr(h, n)
// every string ends in '\0'
```

### Preprocessor

```
#include <stdio.h>
#define MAX(a,b) ((a)>(b)?(a):(b))
#ifndef UTIL_H
#define UTIL_H
#endif
```

### main()

```
int main(void) {
  return 0;
}
int main(int argc, char *argv[]) {
  // argv[1..argc-1] = args
  return 0;
}
```

> **TIP:** Build with `-Wall -Wextra` and treat warnings as errors (`-Werror`). For C23 use `-std=c23`; fall back to `-std=c17` on older compilers.

## Compile & structure {#start}

One `.c` file, one compiler invocation, one entry point. Everything else is commentary.

### 1. Compile

```
gcc -Wall -Wextra -std=c23 main.c -o main
clang -Wall -Wextra -std=c23 main.c -o main
```

### 2. Include headers

```
#include <stdio.h>   // system
#include <stdlib.h>  // malloc, exit
#include "util.h"    // local
```

### 3. main() signature

```
int main(void) {
  return 0;
}

int main(int argc, char *argv[]) {
  // argv[0] = program name
  // argv[1..argc-1] = args
}
```

### 4. Return codes

```
return 0;            // success
return EXIT_SUCCESS; // == 0
return EXIT_FAILURE; // non-zero
// check with: echo $?
```

> **KEY:** **Warnings are bugs in disguise.** Always build with `-Wall -Wextra`; add `-Werror` in CI so nothing slips through. C23 is the current ISO standard (published 2024) — use `-std=c23`, or `-std=c17` on older toolchains.

> **C23:** **New in C23** (ISO/IEC 9899:2024): `nullptr`/`nullptr_t`, `typeof` and `typeof_unqual`, `constexpr` objects, `auto` type inference, `#embed`, digit separators (`0xFF'FF`), and standard `strdup`/`strndup`/`memccpy`. `true`, `false`, `bool`, and `static_assert` are now keywords.

## Types & printf {#types}

Pick a type that fits, then match it to the right format specifier — or `printf` will lie to you.

### 1. Integer types

```
char        // 1 byte
short       // ≥ 2
int         // ≥ 2, usually 4
long        // ≥ 4
long long   // ≥ 8
```

### 2. Fixed-width

```
#include <stdint.h>
int8_t   uint8_t
int16_t  uint16_t
int32_t  uint32_t
int64_t  uint64_t
```

### 3. Floating point

```
float       // 4 bytes
double      // 8 bytes
long double // extended
// literals:
3.14f   // float
3.14    // double
```

### 4. sizeof

```
sizeof(int)           // 4
sizeof x              // type of x
sizeof(arr)/sizeof(arr[0])
// == array length
size_t n = strlen(s);
```

| Specifier | Type | Example |
| --- | --- | --- |
| `%d` | `int` (signed) | `printf("%d", n);` |
| `%u` | `unsigned int` | `printf("%u", u);` |
| `%x` | `unsigned int` (hex) | `printf("%x", u);` |
| `%f` | `double` | `printf("%.2f", d);` |
| `%c` | `char` | `printf("%c", c);` |
| `%s` | `char *` | `printf("%s", s);` |
| `%p` | `void *` | `printf("%p", (void*)p);` |
| `%zu` | `size_t` | `printf("%zu", n);` |
| `%ld` | `long` | `printf("%ld", l);` |
| `%lld` | `long long` | `printf("%lld", ll);` |

## Pointers & arrays {#pointers}

A pointer is just an address. Everything else — arithmetic, decay, `void *` — follows from that.

### 1. & and *

```
int x = 42;
int *p = &x;       // p points to x
*p = 7;           // x = 7
printf("%d", *p); // 7
```

### 2. Pointer arithmetic

```
int a[4] = {1,2,3,4};
int *p = a;
*(p + 1);   // a[1] == 2
p++;        // next element
// p + n moves n * sizeof(*p)
```

### 3. Array decay

```
void f(int *p, size_t n);
int a[3] = {1,2,3};
f(a, 3);      // a == &a[0]
// inside f, sizeof(a)
// no longer works
```

### void * and function pointers

```
void *p = malloc(16);  // any type
int *ip = p;           // implicit cast

int cmp(const void *a, const void *b);
int (*fn)(int, int) = add; // pointer
fn(2, 3);                  // call it
```

### Const-correctness

```
const int *p;        // can't write *p
int *const q;        // can't move q
const int *const r;  // neither

void f(const char *s) {
  // reads s, never writes
}
```

## Memory management {#memory}

Stack memory is automatic; heap memory is yours to manage. Forget to free it, and it leaks.

### 1. malloc

```
int *p = malloc(n * sizeof(int));
if (!p) {
  perror("malloc");
  exit(1);
}
// always check for NULL
```

### 2. calloc

```
int *p = calloc(n, sizeof(int));
// zero-initialized
// == malloc + memset(0)
```

### 3. realloc

```
int *t = realloc(p, new_n * sizeof(int));
if (!t) { free(p); exit(1); }
p = t;
// use a temp: realloc may
// move or return NULL
```

### 4. free

```
free(p);
p = NULL;  // avoid use-after-free
// free(NULL) is safe
// one free per malloc
```

### Stack vs heap

Stack is fast, automatic, and small (MBs). Heap is large, manual, and lives until `free()`.

```
int local;                 // stack
int *p = malloc(sizeof *p); // heap
// *p outlives the function;
// local does not
```

### Find bugs before they find you

```
valgrind ./main
# or build with ASan:
gcc -fsanitize=address -g main.c -o main
./main
```

> **⚠:** **Double-free, use-after-free, and leaks are the three killers.** `free(p)` twice is undefined behavior; reading a freed pointer is a dangling pointer; forgetting to free is a leak. Set pointers to `NULL` after freeing, and free exactly once.

## Strings {#strings}

C strings are just `char` arrays terminated by `'\0'`. Forget the terminator and you're in trouble.

- `strlen(s)` — length, excluding the `'\0'`. O(n) — don't call it in a loop condition.
- `strcpy(dst, src)` — copy src into dst; dst must be big enough.
- `strncpy(dst, src, n)` — copy at most n bytes; may not null-terminate.
- `strcmp(a, b)` — 0 if equal, <0 if a<b, >0 if a>b.
- `strcat(dst, src)` — append src to dst; dst must have room.
- `strchr(s, c)` — pointer to first c in s, or NULL.
- `strstr(h, n)` — pointer to needle n in haystack h, or NULL.
- `snprintf(buf, n, fmt, …)` — bounded printf into buf; always null-terminates if n>0.

### Null termination

```
char s[6] = "hello";  // 5 + '\0'
char t[5] = {'h','e','l','l','o'};
// no '\0' — strlen(t) reads OOB
strcpy(dst, src); // copies '\0' too
```

### fgets vs gets

```
char buf[64];
fgets(buf, sizeof buf, stdin);
// keeps '\n', never overflows

// gets() was removed in C11:
// unbounded, unsafe — never use
```

> **KEY:** Prefer `snprintf` over `sprintf`, use `strncpy` with care, and always pass a known maximum to `fgets`. Every buffer needs a guaranteed terminator.

## Structs, unions & enums {#structs}

Group data into types with `struct`, pick one value with `union`, name constants with `enum`.

### 1. Define a struct

```
struct Point {
  int x;
  int y;
};
struct Point p = {3, 4};

typedef struct {
  int x, y;
} Point;
Point q = {1, 2};
```

### 2. . vs ->

```
Point p;        // value
p.x = 3;        // dot

Point *pp = &p;
pp->x = 3;      // arrow
// pp->x == (*pp).x
```

### 3. Union

```
union Value {
  int i;
  float f;
  char *s;
};
// one member at a time,
// all share the same bytes
```

### Enum

```
enum Color { RED, GREEN, BLUE };
// RED=0, GREEN=1, BLUE=2
enum Color c = GREEN;

enum { A = 1, B = 5, C };  // C=6
```

### Packed

```
struct __attribute__((packed)) Pkt {
  uint8_t  type;
  uint16_t len;
};
// no padding: sizeof == 3
// GCC/Clang extension
```

## File & stream I/O {#io}

`stdio` gives buffered streams on top of raw `read`/`write` syscalls. Check every return value.

- `fopen(path, mode)` — open a `FILE *`; modes `"r"`, `"w"`, `"a"`, `"rb"`, `"wb"`.
- `fclose(fp)` — close and flush; check for write errors.
- `fread(buf, size, nmemb, fp)` — read up to nmemb items; returns count read.
- `fwrite(buf, size, nmemb, fp)` — write nmemb items; returns count written.
- `fgets(buf, n, fp)` — read a line (at most n-1 chars); NULL at EOF.
- `fprintf(fp, fmt, …)` — printf to a stream.
- `read(fd, buf, n)` — unbuffered syscall; returns bytes, 0 at EOF, -1 on error.
- `write(fd, buf, n)` — unbuffered syscall; may write fewer bytes — loop it.

### Standard streams

```
stdin   // FILE *  (fd 0)
stdout  // FILE *  (fd 1)
stderr  // FILE *  (fd 2)
fprintf(stderr, "err: %s\n", msg);
```

### Check every return value

```
FILE *fp = fopen("f.txt", "r");
if (!fp) { perror("fopen"); exit(1); }

if (fclose(fp) == EOF) {
  perror("fclose");
}
```

> **✓:** **`fopen` returns `NULL` on failure** — always test it. `fread`/`fwrite` can return short counts, and `fclose` can report a delayed write error, so check it too.

## Preprocessor & macros {#preprocessor}

Text substitution that runs before the compiler. Great for guards and constants; dangerous in function-like macros.

### 1. #define

```
#define PI 3.14159
#define MAX(a, b) ((a) > (b) ? (a) : (b))
// parenthesize everything
MAX(x + 1, y);  // safe
```

### 2. #include

```
#include <stdio.h>  // system
#include "util.h"    // local
// the file's text is pasted
// in place
```

### 3. Conditionals

```
#ifdef DEBUG
  printf("x=%d\n", x);
#endif

#if defined(__unix__)
  // POSIX-only code
#endif
```

### Include guards

```
// util.h
#ifndef UTIL_H
#define UTIL_H

int add(int, int);

#endif  // UTIL_H
```

### #pragma once

```
// util.h — modern alternative
#pragma once
// GCC/Clang/MSVC; include this
// header only once
```

## Undefined behavior & pitfalls {#gotchas}

UB means the compiler can do anything — including working today and exploding tomorrow.

<details>
<summary>Buffer overflow</summary>

```
char buf[8];
strcpy(buf, "this is way too long");  // overflow!
// use snprintf/strncpy, or know your size
```

</details>

<details>
<summary>Off-by-one</summary>

```
int a[10];
for (int i = 0; i <= 10; i++) a[i] = 0; // a[10]!
// valid indices are 0..9 — loop i < 10
```

</details>

<details>
<summary>Signed overflow</summary>

```
INT_MAX + 1   // UB — wraps in practice
// use unsigned for defined wraparound,
// or check before adding
```

</details>

<details>
<summary>Uninitialized memory</summary>

```
int x;            // indeterminate
printf("%d", x);  // UB
int *p = malloc(n * sizeof *p);
// malloc leaves garbage — calloc zeros
```

</details>

<details>
<summary>Missing null terminator</summary>

```
char buf[4];
strncpy(buf, "abc", 4);  // no '\0'
printf("%s", buf);        // reads past the end
// reserve one byte for '\0'
```

</details>

<details>
<summary>Null pointer dereference</summary>

```
int *p = NULL;
*p = 42;              // UB — segfault
// malloc can return NULL:
int *q = malloc(n * sizeof *q);
if (!q) { /* handle it */ }
```

</details>

<details>
<summary>Dangling pointer (returned local)</summary>

```
int *bad(void) {
  int x = 5;
  return &x;      // x dies on return!
}
// return malloc'd memory or pass a
// buffer in — never & a local
```

</details>

<details>
<summary>Signed/unsigned comparison</summary>

```
int n = -1;
size_t m = 10;
if (n < m) { }   // n converts to unsigned!
// -1 becomes a huge number — surprising
// keep signs consistent
```

</details>

<details>
<summary>Integer division truncates</summary>

```
int a = 5 / 2;        // 2, not 2.5
double d = 5.0 / 2;   // 2.5
double e = (double)a / 2;
// remainder: 5 % 2 == 1
```

</details>
