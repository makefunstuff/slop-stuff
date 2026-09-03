---
title: "OS dev"
description: "Booting, protected mode, interrupts, paging, and kernel basics."
category: "Systems & CS"
tags: ["systems", "GDT", "IDT", "paging"]
weight: 500
lead: "Write an OS from scratch."
version: "kernel"
---
Bare-metal x86: boot with GRUB, drop into protected or long mode, wire up interrupts and paging, then grow a scheduler. Everything here is copy-paste ready for a hobby kernel.

## Quick reference {#quickref}

The essentials you reach for on every boot — compile flags, boot protocol, tables, paging, and interrupts in one scannable pass. UEFI is the modern default; treat legacy BIOS as deprecated.

- `x86_64-elf-gcc -ffreestanding -nostdlib -mno-red-zone -c kernel.c` — Cross-compile with no hosted libc; add `-mno-mmx -mno-sse`.
- `x86_64-elf-ld -T linker.ld -o kernel.bin *.o` — Link with a custom script; `. = 1M` and `*(.multiboot)` first.
- `grub-mkrescue -o os.iso isodir` — Multiboot2 ISO — header must sit in the first 8 KiB, 4-byte aligned.
- `qemu-system-x86_64 -kernel kernel.bin` — Boot a raw multiboot kernel; add `-s -S` to wait for GDB on `:1234`.
- `lgdt [gdt_descriptor]  /  jmp 0x08:reload_cs` — Null + code + data GDT entries needed for protected and long mode.
- `lidt [idt_descriptor]  /  outb(0x20, 0x20)` — Load the IDT; remap the PIC to 32–47 and send EOI per IRQ.
- `mov cr3, rax` — Paging: PML4 → PDPT → PD → PT → 4 KiB frame; the faulting address lands in `CR2`.
- `cli / sti / hlt / iretq` — Disable, enable, halt until an IRQ, and return from an interrupt.

## The boot process {#start}

Firmware → bootloader → kernel. The kernel is a plain binary with no libc, no `main()`, and no OS underneath it.

1. **BIOS / UEFI firmware** — Runs first and hands off to a bootloader. UEFI is the modern standard — legacy BIOS (MBR/CSM) is deprecated. UEFI loads an EFI executable straight into 64-bit long mode with paging already on.
1. **Bootloader (GRUB / Limine)** — Reads the kernel image and passes a boot-info struct (memory map, framebuffer, modules). On BIOS it drops into 32-bit protected mode first; on UEFI you're already in long mode. Multiboot2 and the Limine protocol are the current choices.
1. **Kernel entry** — Your `_start` runs: set up a stack, zero the BSS, and hand control to C.
1. **Kernel takes over** — Build a GDT/IDT, enable paging, then never return — the kernel is the environment now.
> **KEY:** **Target UEFI, not legacy BIOS.** BIOS/CSM is deprecated and vanishing from new boards. A UEFI kernel is a position-independent EFI executable (PE32+) loaded from a GPT EFI system partition; the firmware hands you long mode, flat memory, and paging already enabled. To ship one image for both firmware types, use a protocol like **Limine** or **Multiboot2** (via GRUB) that abstracts the difference away.

### 1. Cross-compile

```
x86_64-elf-gcc -ffreestanding -c kernel.c -o kernel.o
x86_64-elf-ld -T linker.ld -o kernel.bin kernel.o
```

### 2. Freestanding flags

```
-ffreestanding  # no hosted libc
-nostdlib       # no libc / crt0
-mno-red-zone   # safe interrupts (x86-64)
-mno-mmx -mno-sse
```

### 3. Multiboot header

```
; multiboot header (GRUB)
align 4
dd 0x1BADB002       ; magic
dd 0x00000003       ; flags
dd -(0x1BADB002 + 0x00000003)  ; checksum
```

### 4. Run in QEMU

```
qemu-system-x86_64 -kernel kernel.bin
qemu-system-x86_64 -cdrom os.iso
qemu-system-x86_64 -s -S   # wait for GDB
```

> **KEY:** **The multiboot header must sit in the first 8192 bytes** of the image and be 4-byte aligned, or GRUB refuses to load it. Link it at the top of `.text` with its own section like `*(.multiboot)`.

## Protected mode & GDT {#mode}

Three CPU modes. Protected mode turns on segmentation and privilege rings; long mode adds 64-bit. Both need a GDT.

| Mode | Width | Addressable | Notes |
| --- | --- | --- | --- |
| `real` | 16-bit | 1 MiB (20-bit seg:off) | Where the CPU boots; BIOS services live here. |
| `protected` | 32-bit | 4 GiB | GDT segments + optional paging + rings 0–3. |
| `long` | 64-bit | 48-bit virtual | Paging is mandatory; segmentation mostly flattened. |

### GDT entry (C struct)

```
struct gdt_entry {
  uint16_t limit_low;
  uint16_t base_low;
  uint8_t  base_middle;
  uint8_t  access;      // P, DPL, S, type
  uint8_t  granularity; // limit_high + flags
  uint8_t  base_high;
} __attribute__((packed));
```

### Load the GDT

```
lgdt [gdt_descriptor]  ; load GDTR

jmp 0x08:reload_cs     ; far jump reloads CS
reload_cs:
  mov ax, 0x10         ; data segment
  mov ds, ax
  mov ss, ax
  mov es, ax
```

| Segment | Role |
| --- | --- |
| `CS` | Code segment — also encodes the current privilege level (CPL). |
| `DS` / `ES` / `FS` / `GS` | Data segments; `FS`/`GS` hold per-CPU or thread-local bases. |
| `SS` | Stack segment — must match CPL. |

**real mode** (16-bit) → **protected mode** (CR0.PE = 1) → **PAE paging** (CR4.PAE = 1) → **long mode** (EFER.LME + CR0.PG)

> **!:** **Segment selectors are not just an index.** Bits 0–1 are the requestor privilege level (RPL) and bit 2 is the table indicator (TI). Index bits 3–15 pick the descriptor — 0 is the required null descriptor, so valid entries start at `0x08`.

## Interrupts & IDT {#interrupts}

The IDT routes every interrupt and exception to a handler. Vectors 0–31 are CPU exceptions, 32+ are IRQs and software traps.

### IDT entry (C struct)

```
struct idt_entry {
  uint16_t offset_low;
  uint16_t selector;    // code segment
  uint8_t  ist;         // interrupt stack table
  uint8_t  type_attr;   // 0x8E: present, ring0,
                        // 32-bit interrupt gate
  uint16_t offset_mid;
  uint32_t offset_high;
  uint32_t zero;
} __attribute__((packed));
```

### Remap the PIC

```
outb(0x20, 0x11);  // init primary PIC
outb(0xA0, 0x11);  // init secondary PIC
outb(0x21, 0x20);  // IRQ0-7  → vectors 32-39
outb(0xA1, 0x28);  // IRQ8-15 → vectors 40-47
outb(0x21, 0x04);
outb(0xA1, 0x02);
outb(0x21, 0x01);
outb(0xA1, 0x01);
```

| Vector | Exception | What fires it |
| --- | --- | --- |
| `0` | Divide error | Divide by zero (`DIV`/`IDIV`). |
| `6` | Invalid opcode | Executing an undefined instruction. |
| `8` | Double fault | An exception while handling an exception. |
| `13` | General protection fault | Bad segment, ring violation, privileged write. |
| `14` | Page fault | Bad address; `CR2` holds the faulting address. |

`cli — clear interrupts (disable)` `sti — set interrupts (enable)` `hlt — halt until the next interrupt` `iretq — return from an interrupt`

> **!:** **Remap the PIC before enabling interrupts.** By default IRQ0 maps to vector 8, which collides with the CPU's double-fault exception. Remap to 32–47 and remember to send EOI (`outb(0x20, 0x20)`) at the end of every IRQ handler.

> **NOTE:** **The 8259 PIC is legacy.** It's what QEMU's default `pc` machine and old BIOS boxes expose. Modern firmware and UEFI systems route interrupts through the local APIC + I/O APIC instead — you program the APIC's redirection tables (or use MSI/MSI-X for PCI devices) rather than remapping the 8259.

## Paging & memory {#paging}

Paging translates virtual addresses through a 4-level table into physical frames, and is how you isolate processes and demand-page.

**virtual addr** (48-bit) → **PML4** (CR3) → **PDPT** (512 × 1 GiB) → **PD** (512 × 2 MiB) → **PT** (512 × 4 KiB) → **frame** (physical page)

<kbd>1 KiB</kbd> = <kbd>2^10 bytes</kbd> · <kbd>1 MiB</kbd> = <kbd>2^20 bytes</kbd> · <kbd>1 GiB</kbd> = <kbd>2^30 bytes</kbd> · <kbd>4 KiB page</kbd> = <kbd>2^12 offset bits</kbd>

### Frame allocator (bitmap)

```
#define FRAME_SIZE 4096
static uint32_t frames[FRAMES / 32];

void set_frame(uint32_t i)   { frames[i / 32] |= 1 << (i % 32); }
int  test_frame(uint32_t i)  { return frames[i / 32] & (1 << (i % 32)); }

uint32_t alloc_frame() {
  for (uint32_t i = 0; i < FRAMES; i++)
    if (!test_frame(i)) {
      set_frame(i);
      return i * FRAME_SIZE;
    }
  return 0;  // out of memory
}
```

### kmalloc (bump heap)

```
void *heap_top = (void *)HEAP_START;

void *kmalloc(size_t n) {
  n = (n + 7) & ~7;          // 8-byte align
  void *p = heap_top;
  heap_top += n;             // bump the pointer
  return p;
}
// a real kernel adds free-lists or
// slabs on top of this.
```

> **KEY:** **On a page fault (`int 14`) the faulting virtual address is in `CR2`** and the error code tells you why: bit 0 = protection, bit 1 = write, bit 2 = user-mode, bit 4 = instruction fetch. Use it to grow the stack, COW, or kill the process.

## Processes & scheduling {#scheduler}

A task is a saved register set plus a stack. Scheduling is swapping those between CPU and memory, triggered by a timer IRQ.

- **Ready** — Runnable and waiting for a CPU; sitting in the run queue.
- **Running** — The task currently executing on this CPU.
- **Blocked** — Waiting on I/O, a lock, or a timer before it can run.
- **Exited** — Finished; its resources await reclamation.

### Context switch (x86-64)

```
; void switch_context(ctx_t *old, ctx_t *new)
switch_context:
  push rbp
  push rbx
  push r12
  push r13
  push r14
  push r15
  mov  [rdi], rsp     ; save old stack
  mov  rsp, [rsi]     ; load new stack
  pop  r15
  pop  r14
  pop  r13
  pop  r12
  pop  rbx
  pop  rbp
  ret                 ; jump into new task
```

### Round-robin scheduler

```
void schedule() {
  task_t *next = current->next;
  if (!next) next = run_queue;   // wrap
  if (current->state == RUNNING)
    current->state = READY;
  next->state = RUNNING;
  switch_context(&current->ctx, &next->ctx);
}
```

| ABI | Instruction | Number | Args |
| --- | --- | --- | --- |
| 32-bit | `int 0x80` | `eax` | `ebx, ecx, edx, esi, edi, ebp` |
| 64-bit | `syscall` | `rax` | `rdi, rsi, rdx, r10, r8, r9` → result in `rax` |

> **!:** **`syscall` clobbers `rcx` and `r11`.** The CPU stores the return RIP and RFLAGS there, so do not rely on their values across the call. Kernel entry also swaps to a kernel stack — never use the user stack for kernel state.

## Drivers & hardware {#drivers}

Hardware is reachable two ways: x86 I/O ports (`inb`/`outb`) and memory-mapped registers (MMIO) you read and write like RAM.

### VGA text mode

```
volatile uint16_t *vga = (uint16_t *)0xB8000;
// cell: low byte = char, high byte = color
vga[y * 80 + x] = (0x0F << 8) | 'H';
// 0x0F = white on black;
// blink: 0x8F, red: 0x0C
```

### Keyboard (PS/2)

```
uint8_t sc = inb(0x60);   // scancode
outb(0x20, 0x20);         // EOI to PIC
// 0x1C = Enter, 0x01 = Esc
// bit 7 set → key release
```

### PIT timer

```
outb(0x43, 0x36);   // ch0, lobyte/hibyte,
                    // square wave
uint16_t div = 1193182 / freq;
outb(0x40, div & 0xFF);
outb(0x40, div >> 8);
```

| Port | Device | Purpose |
| --- | --- | --- |
| `0x20` / `0xA0` | PIC | Command register (primary / secondary). |
| `0x21` / `0xA1` | PIC | Data / interrupt mask register. |
| `0x60` / `0x64` | PS/2 | Data port / status & command port. |
| `0x40` / `0x43` | PIT | Counter 0 / mode command. |
| `0xCF8` / `0xCFC` | PCI | Config address / config data. |

### PCI config read

```
// bus/dev/func/reg → 0xCF8, data ← 0xCFC
uint32_t pci_read(int bus, int dev, int func, int reg) {
  uint32_t addr = 0x80000000
    | (bus << 16) | (dev << 11)
    | (func << 8) | (reg & 0xFC);
  outl(0xCF8, addr);
  return inl(0xCFC);
}
```

### Memory-mapped I/O

```
// device registers at a physical address
volatile uint32_t *status =
  (uint32_t *)DEVICE_STATUS;

while (!(*status & READY)) {
  /* spin until the device is ready */
}
*status = COMMAND_START;   // kick it off
```

> **!:** **MMIO writes must be `volatile` and uncached.** The compiler and CPU may reorder or drop plain reads/writes. Mark device pages uncacheable (MTRR/PAT) and use `volatile`, or your register pokes get optimized away.

## Tooling {#tooling}

The toolchain that builds, boots, and debugs a kernel — QEMU, GRUB, a linker script, and GDB over the wire.

- `qemu-system-x86_64 -kernel kernel.bin` — Boot a raw multiboot kernel.
- `qemu-system-x86_64 -cdrom os.iso` — Boot a GRUB ISO.
- `qemu-system-x86_64 -s -S` — Start paused; wait for GDB on `:1234`.
- `qemu-system-x86_64 -d int,cpu_reset` — Log interrupts and resets to stderr.
- `grub-mkrescue -o os.iso isodir` — Build a bootable ISO from a GRUB tree.
- `x86_64-elf-gcc -ffreestanding -c kernel.c` — Compile without a hosted libc.
- `x86_64-elf-ld -T linker.ld -o kernel.bin *.o` — Link with a custom linker script.
- `gdb kernel.bin` — Then `target remote :1234` inside GDB.
- `objdump -d kernel.bin` — Disassemble the final image.
- `nm kernel.bin` — List symbols and their addresses.
- `readelf -l kernel.bin` — Inspect ELF segments and entry point.

### Linker script

```
ENTRY(_start)
SECTIONS {
  . = 1M;                /* load at 1 MiB */
  .text : { *(.multiboot) *(.text) }
  .rodata : { *(.rodata) }
  .data : { *(.data) }
  .bss : { *(COMMON) *(.bss) }
}
```

### GDB remote session

```
(gdb) target remote :1234
(gdb) file kernel.bin
(gdb) break kmain
(gdb) continue
(gdb) info registers
(gdb) x/16bx 0xB8000
```

## Pitfalls {#gotchas}

The mistakes that sink every first kernel: assuming libc, trusting the compiler on MMIO, racing interrupts, forgetting the stack and ABI, skipping the BSS, and enabling paging before mapping the code that does it.

### No libc — freestanding

`printf`, `malloc`, and `memcpy` don't exist. Write them, or bring a minimal subset.

```
void *memset(void *dst, int c, size_t n) {
  unsigned char *p = dst;
  while (n--) *p++ = (unsigned char)c;
  return dst;
}
```

### volatile MMIO

Without `volatile`, the compiler hoists the read out of the loop — the device flag never changes in its view.

```
volatile uint32_t *status = (uint32_t *)REG;
while (!(*status & READY)) {}   // must re-read
*status = START;                // must not be dropped
```

### Interrupts & races

An IRQ can fire between any two instructions. Guard shared state by disabling interrupts around the critical section.

```
cli();               // disable interrupts
count++;             // atomic-ish now
sti();               // re-enable
```

### Stack setup

There is no stack until you make one. Set `esp`/`rsp` before the first `call` or any C code.

```
section .bss
align 16
stack_bottom: resb 16384
stack_top:

; in _start:
mov esp, stack_top     ; 32-bit
; or mov rsp, stack_top (64-bit)
```

### Zero the BSS

The loader hands you an image, not a guarantee that `.bss` is zeroed. Any uninitialized global reads garbage until you clear it before C runs.

```
; in _start, before calling C:
mov edi, bss_start
mov ecx, bss_end - bss_start
xor eax, eax
rep stosb              ; zero it all
```

### Use a real cross-compiler

Your host `gcc` targets your OS, not bare metal — wrong ABI, wrong ELF, and it links libc. Build a freestanding toolchain, or point clang at the right target.

```
x86_64-elf-gcc ...          # crosstool / portable
clang --target=x86_64-none-elf \
  -ffreestanding -c kernel.c
```

### Map the code that enables paging

The instant you set `CR0.PG`, the next instruction fetch goes through the page tables. If your current code isn't mapped at the same virtual address, you triple-fault.

```
; identity-map the kernel (or set up a
; higher half) BEFORE toggling the bit:
mov eax, cr0
or  eax, 0x80000000    ; CR0.PG
mov cr0, eax           ; must be mapped here
; then jump to the higher half
```

> **!:** **Bare metal still follows the platform ABI.** On x86-64 SysV: args go in `rdi, rsi, rdx, rcx, r8, r9`, the stack must be 16-byte aligned before each `call`, and the 128-byte red zone below `rsp` becomes unsafe once interrupts can fire. Your assembly must match the C compiler's expectations.
