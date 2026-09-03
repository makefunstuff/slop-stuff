---
title: "Assembly"
description: "Registers, instructions, addressing, calling conventions, and syscalls."
category: "Systems & CS"
tags: ["systems", "registers", "syscall", "x86-64"]
weight: 460
lead: "Think in instructions."
version: "x86-64 · ARM"
---
Assembly is the machine's native language: a flat list of instructions operating on registers and memory. This cheatsheet covers the x86-64 and ARM essentials — registers, addressing, calling conventions, and `syscall`.

## Quick reference {#quickref}

The eight snippets you'll reach for most often — registers, moves, branches, calls, and syscalls at a glance.

### move & arithmetic

```
mov rax, rbx   ; rax = rbx
add rax, 1     ; rax += 1
sub rax, rcx   ; rax -= rcx
xor rax, rax   ; rax = 0
```

### key registers

```
rax   ; return value
rdi   ; 1st argument
rsi   ; 2nd argument
rsp   ; stack pointer
rbx   ; callee-saved
```

### push / pop

```
push rax   ; rsp -= 8; [rsp] = rax
pop  rax   ; rax = [rsp]; rsp += 8
```

### compare & branch

```
cmp rax, rbx
je  equal   ; ==
jne diff    ; !=
jl  less    ; < (signed)
jmp loop    ; always
```

### call / ret

```
call func   ; push return addr, jump
ret         ; pop return addr, jump back
```

### syscall

```
mov rax, 60   ; exit
mov rdi, 0    ; status
syscall       ; result in rax
```

### AT&T vs Intel

```
; Intel: mov rax, 1
; AT&T:  movq $1, %rax
; Intel: dst, src
; AT&T:  src, dst
```

### memory

```
mov rax, [rbx]          ; load
mov [rbx], rax          ; store
mov rax, [rbx+rcx*4+16] ; full form
```

## Registers & basics {#start}

x86-64 has sixteen 64-bit general-purpose registers. The `mov` instruction copies a value, `add` and `sub` do arithmetic.

| Register | 32-bit | 16-bit | 8-bit | Purpose |
| --- | --- | --- | --- | --- |
| `rax` | `eax` | `ax` | `al` | Return value; accumulator |
| `rbx` | `ebx` | `bx` | `bl` | Callee-saved base |
| `rcx` | `ecx` | `cx` | `cl` | 4th arg; counter / shift count |
| `rdx` | `edx` | `dx` | `dl` | 3rd arg; mul/div high half |
| `rsi` | `esi` | `si` | `sil` | 2nd arg; source index |
| `rdi` | `edi` | `di` | `dil` | 1st arg; destination index |
| `rbp` | `ebp` | `bp` | `bpl` | Frame pointer; callee-saved |
| `rsp` | `esp` | `sp` | `spl` | Stack pointer |
| `r8`–`r15` | `r8d`–`r15d` | `r8w`–`r15w` | `r8b`–`r15b` | General; `r8`/`r9` are args 5–6, `r12`–`r15` callee-saved |

### move / add / sub

```
mov rax, rbx     ; rax = rbx
add rax, 1       ; rax = rax + 1
sub rax, rcx     ; rax = rax - rcx
inc rax          ; rax++
dec rax          ; rax--
```

### Operand sizes

```
mov al, 1        ; byte  (8 bits)
mov ax, 1        ; word  (16 bits)
mov eax, 1       ; dword (32 bits)
mov rax, 1       ; qword (64 bits)
```

### ARM registers

```
mov x0, #42      ; x0 = 42
add x1, x0, x2   ; x1 = x0 + x2
ldr x0, [sp]     ; load qword from stack
; w0 is low 32 bits of x0
```

### Zero- & sign-extend

```
movzx rax, bl    ; zero-extend bl to rax
movsx rax, bl    ; sign-extend bl to rax
movzx rax, byte [rsi]  ; load + zero-extend
```

### Immediates & swap

```
mov rax, 0x1234  ; load immediate
mov rbx, 60      ; decimal is fine too
xchg rax, rbx    ; swap the two
```

> **KEY:** Writing to `eax` zeroes the upper 32 bits of `rax`; writing to `al` or `ax` leaves them untouched. On ARM, registers are `x0`–`x30` (64-bit) with `w0`–`w30` as the low 32 bits, plus `sp` (stack pointer) and `x30` (link register).

## Memory & addressing {#memory}

Memory is addressed as `[base + index*scale + offset]`. The stack is just memory pointed at by `rsp`.

| Addressing mode | Example | Meaning |
| --- | --- | --- |
| Register indirect | `mov rax, [rbx]` | qword at address in `rbx` |
| Base + offset | `mov rax, [rbx+8]` | qword at `rbx + 8` |
| Base + index | `mov rax, [rbx+rcx]` | qword at `rbx + rcx` |
| Base + index*scale | `mov rax, [rbx+rcx*4]` | scale is 1, 2, 4, or 8 |
| Full form | `mov rax, [rbx+rcx*4+16]` | `base + index*scale + offset` |

### lea — load effective address

```
lea rax, [rbx+8]       ; rax = rbx + 8
lea rax, [rbx+rcx*4]   ; compute address, no read
```

### push / pop

```
push rax   ; rsp -= 8; [rsp] = rax
pop  rax   ; rax = [rsp]; rsp += 8
```

> **STACK:** The stack grows **downward**: `push` subtracts from `rsp`, `pop` adds to it. `rsp` always points to the top of the stack; `rbp` is conventionally used as a fixed frame base so locals and arguments have stable offsets.

## Control flow {#control}

`cmp` sets flags, `jcc` branches on them, `call`/`ret` enter and leave functions.

| Jump | Jumps when (after `cmp a, b`) |
| --- | --- |
| `je` / `jz` | equal / zero — `a == b` |
| `jne` / `jnz` | not equal — `a != b` |
| `jg` | greater, signed — `a > b` |
| `jge` | greater or equal, signed — `a >= b` |
| `jl` | less, signed — `a < b` |
| `jle` | less or equal, signed — `a <= b` |
| `ja` / `jb` | above / below, unsigned — `a > b` / `a < b` |
| `jmp` | unconditional |

### Compare & branch

```
cmp rax, rbx
je  equal    ; if rax == rbx
jl  less     ; if rax < rbx (signed)
```

### Counted loop

```
mov rcx, 10
loop:
  ; body
  dec rcx
  jnz loop
```

### call / ret

```
call func   ; push return addr, jump
; ...
ret         ; pop return addr, jump back
```

> **IDIOMS:** `test rax, rax` is a cheaper `cmp rax, 0`. Conditional moves avoid branches entirely: `cmp rax, 0` then `cmovge rbx, rax` sets `rbx = rax` only if `rax >= 0`. `call` pushes the return address and jumps; `ret` pops it and jumps back.

## Calling conventions {#calling}

System V AMD64 (used on Linux and macOS) passes the first six integer arguments in registers and returns in `rax`.

| Position | Register |
| --- | --- |
| 1st argument | `rdi` |
| 2nd argument | `rsi` |
| 3rd argument | `rdx` |
| 4th argument | `rcx` |
| 5th argument | `r8` |
| 6th argument | `r9` |
| 7th and beyond | pushed on the stack, right-to-left |
| Return value | `rax` (`rdx:rax` for 128-bit) |

### Who must save what

```
; callee-saved (preserve):
;   rbx, rbp, r12, r13, r14, r15
; caller-saved (may be clobbered):
;   rax, rcx, rdx, rsi, rdi, r8-r11
```

### Example function

```
; int add(int a, int b)  a=rdi, b=rsi
add:
  lea  rax, [rdi+rsi]  ; rax = a + b
  ret
```

### Call site

```
; int r = add(2, 3);
mov edi, 2     ; 1st arg
mov esi, 3     ; 2nd arg
call add       ; result in rax
```

> **!:** **Stack alignment:** keep `rsp` 16-byte aligned before any `call`. On function entry `rsp % 16 == 8` (the return address has shifted it). A function that uses callee-saved registers must save them (`push`) and restore them (`pop`) before `ret`.

## System calls {#syscalls}

Put the syscall number in `rax`, arguments in `rdi`/`rsi`/`rdx`, then `syscall`. The return value lands in `rax`.

| Syscall | `rax` | Arguments |
| --- | --- | --- |
| `read` | 0 | `rdi`=fd, `rsi`=buf, `rdx`=count |
| `write` | 1 | `rdi`=fd, `rsi`=buf, `rdx`=count |
| `open` | 2 | `rdi`=path, `rsi`=flags, `rdx`=mode |
| `mmap` | 9 | `rdi`=addr, `rsi`=len, `rdx`=prot, `r10`=flags |
| `exit` | 60 | `rdi`=status |

### hello, world (x86-64)

```
section .data
msg db "hello, world", 10   ; 13 bytes

section .text
global _start
_start:
  mov rax, 1        ; syscall: write
  mov rdi, 1        ; fd = stdout
  mov rsi, msg      ; buffer
  mov rdx, 13       ; count
  syscall

  mov rax, 60       ; syscall: exit
  xor rdi, rdi      ; status 0
  syscall
```

### read from stdin

```
section .bss
buf resb 16       ; 16-byte buffer

_start:
  mov rax, 0      ; syscall: read
  mov rdi, 0      ; fd = stdin
  mov rsi, buf    ; buffer
  mov rdx, 16     ; max count
  syscall         ; rax = bytes read
```

### ARM (svc)

```
mov x0, #1        ; fd = stdout
adr x1, msg       ; buffer
mov x2, #13       ; count
mov x8, #64       ; write (Linux)
svc #0            ; syscall
```

> **NOTE:** `syscall` clobbers `rcx` and `r11` (they hold the return address and flags) and returns the result in `rax`. A negative value means error (negated `errno`). Syscall numbers differ by OS and architecture — check your platform's tables.

## Flags & arithmetic {#flags}

Arithmetic and bitwise instructions set condition flags in `EFLAGS`; `cmp` and `jcc` read them back.

| Flag | Name | Set when |
| --- | --- | --- |
| `ZF` | Zero | result is zero |
| `CF` | Carry | unsigned overflow or borrow |
| `SF` | Sign | high bit of result set (negative) |
| `OF` | Overflow | signed overflow |

### add / sub

```
add rax, rbx   ; rax += rbx
sub rax, 10    ; rax -= 10
neg rax        ; rax = -rax
```

### mul / div

```
imul rax, 10   ; rax *= 10 (signed)
mul  rbx       ; rdx:rax = rax*rbx
idiv rcx       ; rax = quo, rdx = rem
```

### shifts

```
shl rax, 1   ; left, fill 0
shr rax, 1   ; right, fill 0
sar rax, 1   ; right, fill sign
mov cl, 3
shl rax, cl  ; shift by cl
```

### bitwise

```
and rax, rbx   ; rax &= rbx
or  rax, 0x01  ; set bit 0
xor rax, rax   ; zero rax
not rax        ; ~rax
```

> **TIP:** Use `xor rax, rax` instead of `mov rax, 0` — it's a shorter encoding and also clears the flags. `shl`/`sar` by 1 is multiplication/division by 2; use `sar` (not `shr`) to preserve sign on signed values.

## Syntax & tooling {#gas}

Two dialects dominate: AT&T (used by `gas`) and Intel (used by `nasm` and most documentation). This guide uses Intel syntax.

| Element | AT&T (gas) | Intel (nasm) |
| --- | --- | --- |
| Operand order | `src, dst` | `dst, src` |
| Registers | `%rax` | `rax` |
| Immediates | `$1` | `1` |
| Memory | `8(%rbx)` | `[rbx+8]` |
| Size suffix | `movq`, `movl` | `mov` (inferred) |

### AT&T (gas)

```
movq %rax, %rbx      # rbx = rax
movq $1, %rax        # rax = 1
movq 8(%rbx), %rax   # rax = [rbx+8]
```

### Intel (nasm)

```
mov rbx, rax         ; rbx = rax
mov rax, 1           ; rax = 1
mov rax, [rbx+8]     ; rax = [rbx+8]
```

### Assemble, link, disassemble

```
as hello.s -o hello.o     # gas
nasm -f elf64 hello.asm   # nasm
gcc -o hello hello.o      # link
objdump -d hello          # disassemble
objdump -d -M intel hello # Intel syntax
gdb -batch -ex 'disas main' hello
```

### Sections

```
section .text   ; code (executable)
section .data   ; initialized data
section .bss    ; zero-filled data
```

## Pitfalls {#gotchas}

Small mistakes that produce wrong code instead of errors.

### AT&T operand order is reversed

In AT&T syntax the source comes first: `mov %rax, %rbx` copies `rax` into `rbx` — the opposite of Intel syntax.

```
movq %rax, %rbx   # rbx = rax
```

### Signed vs unsigned jumps

After `cmp`, `jg`/`jl` compare signed values while `ja`/`jb` compare unsigned. Use the wrong pair and negative numbers misbehave.

```
jg above   ; signed
ja above   ; unsigned
```

### Stack alignment

`call` requires a 16-byte-aligned `rsp`. An off-by-8 stack misaligns `movaps` and SSE code, crashing with a segfault.

```
; before call: rsp % 16 == 0
; on entry:    rsp % 16 == 8
```

### Clobbering callee-saved registers

If your function touches `rbx`, `rbp`, or `r12`–`r15`, you must save and restore them or the caller breaks.

```
push rbx       ; save
; ... use rbx ...
pop  rbx       ; restore
ret
```

### No memory-to-memory moves

`mov` can't copy memory to memory — at least one operand must be a register. Load into a scratch register, then store.

```
mov rax, [rsi]  ; load
mov [rdi], rax  ; store
```

### mul / div use implicit registers

`mul rbx` is really `rdx:rax = rax * rbx` — it reads `rax` and writes both `rax` and `rdx`, silently clobbering `rdx`. `idiv rcx` divides the 128-bit `rdx:rax` by `rcx`.

```
mul  rbx   ; rdx:rax = rax*rbx
idiv rcx   ; rax = quo, rdx = rem
```

### Variable shift count lives in cl

A shift or rotate count must be an immediate or in `cl` — no other register is accepted.

```
shl rax, 3   ; immediate OK
mov cl, 3
shl rax, cl  ; variable count
```

### syscall uses r10, not rcx

For `syscall`, the 4th argument goes in `r10` — `syscall` clobbers `rcx` with the return address. Function calls use `rcx`; system calls use `r10`.

```
; function: 4th arg = rcx
; syscall:  4th arg = r10
```
