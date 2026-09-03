---
title: "Embedded dev"
description: "Bare-metal and RTOS: registers, interrupts, timers, FreeRTOS, RP2040/Pico, and debugging."
category: "Embedded & hardware"
tags: ["embedded", "FreeRTOS", "PIO", "interrupts"]
weight: 270
lead: "Code that talks to hardware."
version: "bare metal · RTOS"
---
Bare-metal and RTOS development on ARM Cortex-M: memory-mapped registers, interrupts and timers, linker scripts and boot code, FreeRTOS, and SWD debugging — from first flash to HardFault.

## Quick reference {#quickref}

The commands and idioms you reach for most — the fast path into every section below.

### Compile

```
arm-none-eabi-gcc -mcpu=cortex-m4 \
  -mthumb -Os -ffreestanding \
  -c main.c -o main.o
```

### MMIO register

```
#define GPIOA_ODR \
  (*(volatile uint32_t *)0x40020014UL)
GPIOA_ODR |= (1UL << 5);    // set pin
GPIOA_ODR &= ~(1UL << 5);  // clear pin
```

### Interrupt & NVIC

```
void USART1_IRQHandler(void) {
  if (USART1->SR & USART_SR_RXNE)
    rx_byte = USART1->DR;  // read clears
}
NVIC_EnableIRQ(USART1_IRQn);
```

### Linker sections

```
MEMORY {
  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 512K
  RAM  (rwx): ORIGIN = 0x20000000, LENGTH = 128K
}
SECTIONS {
  .text : { *(.text*) } > FLASH
  .data : { *(.data*) } > RAM AT> FLASH
  .bss  : { *(.bss*) }  > RAM
}
```

### FreeRTOS task

```
xTaskCreate(task, "blink", 256, NULL, 1, NULL);
vTaskStartScheduler();
void task(void *arg) {
  while (1) {
    toggle_led();
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}
```

### SWD + GDB

```
openocd -f interface/stlink.cfg \
  -f target/stm32f4x.cfg
arm-none-eabi-gdb firmware.elf
(gdb) target remote :3333
(gdb) monitor reset halt
(gdb) load
```

### Inspect binary

```
arm-none-eabi-size firmware.elf       # sizes
arm-none-eabi-objdump -h firmware.elf # sections
arm-none-eabi-nm firmware.elf         # symbols
```

### SysTick 1 ms

```
SysTick_Config(SystemCoreClock / 1000);
void SysTick_Handler(void) { ms_ticks++; }
```

> **REF:** **Everything here is expanded below.** Compile flags in [Toolchain](#start), MMIO in [Registers](#registers), ISRs in [Interrupts](#interrupts), sections in [Memory](#memory), tasks in [RTOS](#rtos), and flashing in [Debug](#debug).

## Toolchain & build {#start}

One cross-toolchain compiles, links, inspects, and flashes firmware for any Cortex-M target. The same four tools appear in every workflow.

### 1. Cross-compile

```
arm-none-eabi-gcc \
  -mcpu=cortex-m4 -mthumb \
  -Os -ffreestanding \
  -c main.c -o main.o
```

### 2. Inspect the binary

```
arm-none-eabi-objdump -h firmware.elf   # sections
arm-none-eabi-objdump -d firmware.elf   # disasm
arm-none-eabi-nm firmware.elf           # symbols
arm-none-eabi-size firmware.elf         # text/data/bss
```

### 3. Linker script

```
/* stm32f4.ld */
MEMORY {
  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 512K
  RAM  (rwx): ORIGIN = 0x20000000, LENGTH = 128K
}
```

### 4. Flash it

```
openocd -f interface/stlink.cfg \
  -f target/stm32f4x.cfg \
  -c "program firmware.elf verify reset exit"

st-flash write firmware.bin 0x8000000
```

> **KEY:** **Startup runs before `main()`.** The vector table's `Reset_Handler` (in `startup_stm32f4xx.s`) sets the stack pointer, copies `.data` from flash to RAM, zeroes `.bss`, then calls `main()`. Your `main` never returns.

### Make

Recipes need a real <kbd>Tab</kbd>, not spaces.

```
CC = arm-none-eabi-gcc
CFLAGS = -mcpu=cortex-m4 -mthumb -Os

firmware.elf: main.o startup.o
	$(CC) -T stm32f4.ld $^ -o $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

### CMake

Cross-compile by naming a generic target.

```
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER arm-none-eabi-gcc)
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

add_executable(firmware main.c startup.s)
target_compile_options(firmware PRIVATE
  -mcpu=cortex-m4 -mthumb -Os)
target_link_options(firmware PRIVATE
  -T ${CMAKE_SOURCE_DIR}/stm32f4.ld)
```

> **VER:** **Current toolchain.** `arm-none-eabi-gcc` tracks upstream GCC — the Arm GNU Toolchain ships 14.x (`14.2.rel1`) in 2025. Prefer `-mcpu=cortex-m4` over `-march` (it pulls the right multilib), keep `-ffreestanding`, and match `-mfloat-abi` to your core's FPU. The same targets build in Rust: `embedded-hal` 1.0 + `probe-rs` (see the [Rust guide](rust/)).

## Registers & MMIO {#registers}

Peripherals live at fixed addresses. You talk to them by casting an address to a `volatile` pointer and reading or writing it.

### Memory-mapped register

Cast the peripheral address once, then use it like a variable.

```
#define GPIOA_ODR (*(volatile uint32_t *)0x40020014UL)

GPIOA_ODR = 0x20;            // write pin 5
uint32_t v = GPIOA_ODR;      // read it back
```

### Read-modify-write

Change one bit without disturbing its neighbors.

```
GPIOA_ODR |=  (1UL << 5);   // set bit 5
GPIOA_ODR &= ~(1UL << 5);   // clear bit 5
GPIOA_ODR ^=  (1UL << 5);   // toggle bit 5
```

| Goal | Idiom |
| --- | --- |
| Set bit n | `reg \|= (1UL << n)` |
| Clear bit n | `reg &= ~(1UL << n)` |
| Toggle bit n | `reg ^= (1UL << n)` |
| Test bit n | `if (reg & (1UL << n))` |
| Write a bit field | `reg = (reg & ~MASK) \| (val << SHIFT)` |

### #define macros

Each register is a named, typed pointer. Simple and fast, but verbose for many registers.

```
#define GPIOA_ODR (*(volatile uint32_t *)0x40020014UL)
#define LED_PIN   (1UL << 5)

GPIOA_ODR |= LED_PIN;
```

### Struct overlay

One struct mirrors the peripheral's layout; a pointer maps it over the base address.

```
typedef struct {
  volatile uint32_t MODER;   // 0x00 mode
  volatile uint32_t OTYPER;  // 0x04 type
  volatile uint32_t OSPEEDR; // 0x08 speed
  volatile uint32_t PUPDR;   // 0x0C pull
  volatile uint32_t IDR;     // 0x10 input
  volatile uint32_t ODR;     // 0x14 output
} GPIO_TypeDef;

#define GPIOA ((GPIO_TypeDef *)0x40020000UL)
GPIOA->ODR |= (1U << 5);
```

`volatile` `MMIO` `overlay` `Cortex-M`

> **!:** **`volatile` stops the optimizer.** Without it, the compiler may cache a register read, delete a “redundant” write, or reorder accesses. Read-modify-write is also **not atomic**: an ISR touching the same register mid-sequence can lose a bit — guard shared registers with a critical section.

## Interrupts & ISRs {#interrupts}

A peripheral raises an IRQ; the NVIC runs the matching handler. Keep ISRs short, signal through volatile flags, and mask interrupts only for the smallest window.

1. **Peripheral event** — The UART receives a byte and sets its `RXNE` flag in `SR`.
1. **NVIC pends the IRQ** — The flag maps to an interrupt line; the NVIC compares its priority against whatever is running.
1. **ISR entry** — The CPU pushes context (R0–R3, R12, LR, PC, xPSR) and jumps to the vector-table entry.
1. **Clear + signal** — The ISR reads `DR` (which clears `RXNE`), sets a volatile flag, and returns to the main loop.

| Task | CMSIS call |
| --- | --- |
| Enable an IRQ | `NVIC_EnableIRQ(USART1_IRQn)` |
| Disable an IRQ | `NVIC_DisableIRQ(USART1_IRQn)` |
| Set priority | `NVIC_SetPriority(USART1_IRQn, 3)` — 0 is highest |
| Force it pending | `NVIC_SetPendingIRQ(USART1_IRQn)` |
| Global gate | `__enable_irq()` / `__disable_irq()` |

### Volatile-flag ISR

The ISR does the minimum; `main` does the work.

```
volatile uint8_t rx_byte;
volatile int    rx_ready = 0;

void USART1_IRQHandler(void) {
  if (USART1->SR & USART_SR_RXNE) {
    rx_byte  = USART1->DR;   // read clears the flag
    rx_ready = 1;
  }
}

int main(void) {
  while (1) {
    if (rx_ready) {
      rx_ready = 0;
      /* handle rx_byte quickly */
    }
  }
}
```

### Critical section

Mask interrupts around a non-atomic read-modify-write.

```
__disable_irq();          // suspend all IRQs
shared |= (1U << 3);     // now atomic
__enable_irq();

// Cortex-M priority masking:
__set_PRIMASK(1);         // block everything
__set_BASEPRI(2 << 5);   // block ≤ priority 2
```

> **!:** **ISR rules:** short, no blocking calls, no `printf` to a slow UART, no `delay()`. Set a flag or queue an event and let the main loop finish the job. Use `volatile` for anything shared with main code, and clear the peripheral's flag before returning.

## Timers & peripherals {#timers}

SysTick gives you a millisecond heartbeat; hardware timers generate PWM; the UART and ADC move bytes and samples in or out of the chip.

### SysTick 1 ms tick

The core timer fires an interrupt every millisecond.

```
volatile uint32_t ms_ticks = 0;

void SysTick_Handler(void) { ms_ticks++; }

int main(void) {
  SysTick_Config(SystemCoreClock / 1000);
  while (1) {
    uint32_t now = ms_ticks;
    /* count elapsed milliseconds */
  }
}
```

### PWM via a timer

Prescaler + auto-reload set the frequency; the capture/compare register sets the duty cycle.

```
TIM2->PSC  = 84 - 1;          // 84 MHz → 1 MHz
TIM2->ARR  = 1000 - 1;        // 1 kHz period
TIM2->CCR1 = 500;             // 50% duty on CH1
TIM2->CCMR1 |= TIM_CCMR1_OC1M_PWM1;
TIM2->CCER  |= TIM_CCER_CC1E;
TIM2->CR1   |= TIM_CR1_CEN;
```

| UART method | How it works | Best for |
| --- | --- | --- |
| Polling | loop while `!(SR & RXNE)`, then read `DR` | simple, blocking code |
| Interrupt | enable `RXNEIE`; the ISR reads `DR` | low latency, event-driven |
| DMA | a DMA channel streams `DR` → buffer | bulk, CPU-free transfer |

### ADC single conversion

Software-trigger one sample and wait for end-of-conversion.

```
ADC1->CR2 |= ADC_CR2_ADON;        // power on
ADC1->SQR3 = 0;                   // channel 0 first
ADC1->CR2 |= ADC_CR2_SWSTART;     // start
while (!(ADC1->SR & ADC_SR_EOC)); // wait
uint16_t v = ADC1->DR;            // 12-bit result
```

### DMA basics

Point a stream at source, destination, and count, then enable it.

```
DMA1_Stream0->PAR  = (uint32_t)src;
DMA1_Stream0->M0AR = (uint32_t)dst;
DMA1_Stream0->NDTR = N;          // count
DMA1_Stream0->CR   = DMA_SxCR_MINC
                   | DMA_SxCR_TCIE
                   | DMA_SxCR_EN;
```

> **⌁:** **Timer math:** output frequency = `timer_clk / (PSC + 1) / (ARR + 1)`. On an 84 MHz STM32, `PSC = 83` and `ARR = 999` give a clean 1 kHz, and `CCR1` sets the duty as a fraction of `ARR + 1`.

## Memory map & sections {#memory}

Code lives in flash, variables in RAM. The linker script decides what goes where; the startup code makes it true before `main()` runs.

**FLASH** (0x08000000) → **.text** (code + .rodata) → **.data** (init globals) → **.bss** (zero globals) → **stack & heap** (grow toward each other)

| Section | Holds | Initialized by |
| --- | --- | --- |
| `.text` | machine instructions | flashed |
| `.rodata` | consts, string literals | flashed |
| `.data` | initialized globals/statics | startup copies from flash |
| `.bss` | zero-initialized globals | startup zeroes |
| stack | locals, call frames | SP set at reset |
| heap | `malloc()` / `new` | runtime |

### Startup: copy .data

Initial values are stored in flash and copied into RAM at boot.

```
extern uint32_t _sidata, _sdata, _edata;
uint32_t *src = &_sidata;
uint32_t *dst = &_sdata;
while (dst < &_edata) {
  *dst++ = *src++;
}
```

### Startup: zero .bss

Uninitialized globals must start at zero, never garbage.

```
extern uint32_t _sbss, _ebss;
for (uint32_t *p = &_sbss; p < &_ebss; p++) {
  *p = 0;
}
```

> **!:** **The stack grows down from the top of RAM; the heap grows up.** When they meet you get silent corruption, not a clean error. Size `.stack` in the linker script, keep a watermark, and use the MPU to trap overflow on parts that have one.

## RTOS basics {#rtos}

A scheduler runs tasks by priority and preempts lower ones. Semaphores, mutexes, and queues synchronize them without busy-waiting.

- **Running** — The highest-priority ready task, actually on the CPU. Only one at a time.
- **Ready** — Waiting for CPU time; runs when nothing higher-priority is ready.
- **Blocked** — Waiting on a queue, semaphore, or `vTaskDelay()`. Consumes no CPU.
- **Suspended** — Explicitly paused with `vTaskSuspend()`; only `vTaskResume()` wakes it.

### Create + delay a task

Every task is a function that never returns, plus a stack.

```
void task(void *arg) {
  while (1) {
    toggle_led();
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}

xTaskCreate(task, "blink", 256, NULL, 1, NULL);
vTaskStartScheduler();
```

### Mutex, semaphore, queue

Mutexes protect shared state; queues pass data between tasks.

```
SemaphoreHandle_t m = xSemaphoreCreateMutex();
if (xSemaphoreTake(m, pdMS_TO_TICKS(100))) {
  /* critical region */
  xSemaphoreGive(m);
}

QueueHandle_t q = xQueueCreate(8, sizeof(int));
xQueueSend(q, &val, portMAX_DELAY);
xQueueReceive(q, &val, portMAX_DELAY);
```

- `xTaskCreate(fn, name, stack, arg, prio, handle)` — create a task.
- `vTaskDelay(pdMS_TO_TICKS(ms))` — block for a time.
- `xSemaphoreTake / xSemaphoreGive` — mutex lock / unlock.
- `xQueueSend / xQueueReceive` — message passing.
- `taskENTER_CRITICAL / taskEXIT_CRITICAL` — disable scheduler preemption.
- `vTaskStartScheduler()` — start the tick and scheduler.

<details>
<summary>More FreeRTOS</summary>

#### Software timers

One-shot or periodic callbacks that run in the timer task, not yours.

```
xTimerCreate("t", pdMS_TO_TICKS(1000), pdTRUE,
             NULL, onTick);
xTimerStart(t, 0);
```

#### Event groups & task notifications

Wait for a set of flags, or wake one task directly without a queue.

```
xEventGroupWaitBits(g, BIT_READY, pdFALSE,
                    pdTRUE, portMAX_DELAY);
xTaskNotifyGive(task);           // signal
ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
```

#### ISR-safe calls

From an ISR, only the `…FromISR` variants are legal — they never block.

```
xSemaphoreGiveFromISR(m, &woken);
xQueueSendFromISR(q, &v, &woken);
portYIELD_FROM_ISR(woken);
```

#### Binary semaphore vs mutex

A mutex has ownership + priority inheritance; a binary semaphore is just a signal. Never use a semaphore as a mutex.

```
xSemaphoreCreateBinary();  // signal
xSemaphoreCreateMutex();   // lock
```

</details>

> **!:** **Priority inversion:** a low-priority task holding a mutex blocks a high-priority task, which then waits behind the medium tasks. Fix it by using a **mutex with priority inheritance** — never a binary semaphore — for resources shared across priority levels.

> **V11:** **FreeRTOS Kernel is now V11.** V11 added official **SMP** scheduling so the same `xTaskCreate` API runs tasks across cores (RP2040, ESP32). Recent releases use date-based tags (e.g. `v202411.00`). The single-core API above is unchanged and still the right starting point; SMP is opt-in via `configNUMBER_OF_CORES`.

## Debugging {#debug}

SWD gives you a hardware debugger: breakpoints, watchpoints, and register inspection — without touching production code.

### OpenOCD + GDB

One terminal hosts the probe; another drives the target.

```
# terminal 1
openocd -f interface/stlink.cfg \
  -f target/stm32f4x.cfg

# terminal 2
arm-none-eabi-gdb firmware.elf
(gdb) target remote :3333
(gdb) monitor reset halt
(gdb) load
```

### HardFault handler

Recover the faulting PC from the stacked frame on the MSP.

```
void HardFault_Handler(void) {
  uint32_t *msp = (uint32_t *)__get_MSP();
  uint32_t pc   = msp[6];   // stacked PC
  uint32_t lr   = msp[5];   // stacked LR
  (void)pc; (void)lr;
  __asm volatile("bkpt #0"); // trap for GDB
}
```

- `break main` — stop at main.
- `continue` — run to the next breakpoint.
- `next / step` — step over / into.
- `print x` — print a variable.
- `info registers` — dump CPU registers.
- `x/10wx 0x20000000` — dump 10 words of RAM.
- `monitor reset halt` — reset and halt via OpenOCD.
- `watch x` — break when x changes.

<details>
<summary>printf vs semihosting</summary>

A UART `printf` needs a driver and is slow; **semihosting** routes syscalls to the host GDB through a breakpoint instruction — no extra hardware, but it stalls whenever no debugger is attached. Use semihosting for development, a buffered UART/DMA logger in production.

</details>

<details>
<summary>Logic analyzer</summary>

For timing bugs — bit-banged protocols, PWM edges, bus contention — capture GPIO transitions with a logic analyzer (Saleae, DSLogic). A scope shows analog shape; a logic analyzer shows digital state and timing at MHz.

</details>

> **SWD:** **SWD beats JTAG on modern parts:** two pins (`SWDIO` + `SWCLK`) plus power and ground, versus four or five for JTAG (`TMS/TCK/TDI/TDO`). Both expose the same debug access; SWD is the default on Cortex-M.

## RP2040 & Raspberry Pi Pico {#rp2040}

The RP2040 is a dual-core Cortex-M0+ with a standout trick: PIO — tiny programmable state machines that bit-bang any protocol without touching the CPU.

### Pico SDK setup

```
cmake_minimum_required(VERSION 3.13)
include(pico_sdk_import.cmake)
pico_sdk_init()
add_executable(blink blink.c)
target_link_libraries(blink pico_stdlib)
pico_add_extra_outputs(blink)
```

### GPIO

```
gpio_init(25);
gpio_set_dir(25, GPIO_OUT);
gpio_put(25, 1);
gpio_pull_up(2);
gpio_set_irq_enabled_with_callback(
  2, GPIO_IRQ_EDGE_FALL, true, &cb);
```

### PWM & ADC

```
pwm_set_wrap(slice, 65535);
pwm_set_gpio_level(25, 32768);
pwm_set_enabled(slice, true);
adc_select_input(0);
uint16_t v = adc_read();
```

### PIO — bit-bang anything

8 state machines, each a tiny program that toggles pins with deterministic timing, independent of the cores. Perfect for WS2812, DPI, or custom one-wire protocols.

```
# PIO asm: square wave
set pindirs, 1
.wrap_target
  set pins, 1
  set pins, 0
.wrap
```

### UART / I2C / SPI / DMA

```
uart_init(uart0, 115200);
uart_puts(uart0, "hi\n");
i2c_init(i2c0, 100 * 1000);
spi_init(spi0, 1 * 1000 * 1000);
// DMA moves memory ↔ peripheral
dma_channel_configure(...)
```

> **KEY:** **PIO is the RP2040's superpower.** Two modest M0+ cores, but eight PIO state machines with deterministic timing. When a protocol is too fast or too weird for the CPU — WS2812 LEDs, VGA, DVI, odd one-wire buses — throw it at PIO.

## Pitfalls {#gotchas}

Nine failures that look like hardware problems but are almost always software.

<details>
<summary>Missing volatile</summary>

The compiler caches a register read or deletes a write it thinks is redundant. Mark every MMIO pointer and every variable shared with an ISR `volatile`.

```
volatile uint32_t *const REG = (uint32_t *)0x40021000UL;
volatile int flag;   // shared with an ISR
```

</details>

<details>
<summary>Non-atomic read-modify-write</summary>

`REG |= (1 << 3)` reads, modifies, and writes. If an ISR writes the same register in between, its change is lost. Wrap shared RMW in a critical section (`__disable_irq()` / `__enable_irq()`).

```
__disable_irq();
REG |= (1U << 3);   // load-modify-store, now safe
__enable_irq();
```

</details>

<details>
<summary>Stack overflow</summary>

Deep recursion, large locals, or a too-small `.stack` overruns into `.data`/heap and faults elsewhere. Raise the stack, avoid deep recursion, and add a watermark or MPU guard.

</details>

<details>
<summary>ISR latency</summary>

A long or blocking ISR delays every other interrupt and can overflow a queue. Keep ISRs tiny — set a flag, queue an event, return — and do the work in the main loop or a task.

</details>

<details>
<summary>Watchdog resets</summary>

The independent watchdog (IWDG) resets the chip when its counter isn't fed. Kick it from the main loop after real progress, not from inside an ISR, so a hung loop still trips the reset.

</details>

<details>
<summary>Uninitialized memory</summary>

`.bss` is zeroed at boot, but stack memory is not — a local variable holds whatever was there before. Initialize every variable before reading it, or make it `static` to get guaranteed zero-init.

```
uint32_t x;         // stack: garbage
static uint32_t y;  // .bss: zeroed at boot
```

</details>

<details>
<summary>Volatile is not atomic or ordered</summary>

`volatile` stops the optimizer from caching or dropping that single access, but it does **not** make a read-modify-write atomic, and it gives no ordering guarantee across cores or against DMA. Guard shared RMW with a critical section, use `__DSB()`/`__DMB()` for ordering, or C11 atomics where the toolchain supports them.

</details>

<details>
<summary>Unhandled IRQ = silent hang</summary>

Enable an interrupt but forget its handler and the vector table points at a default handler that loops forever — the chip looks dead with no clue why. Every `IRQn` you enable needs a matching `IRQHandler`; make the default handler trap with `__asm volatile("bkpt #0")` instead of `while(1)`.

</details>

<details>
<summary>Priority bits are shifted</summary>

On Cortex-M, lower numeric priority is higher urgency, and the NVIC only reads the top `configPRIO_BITS` bits of the 8-bit priority field (often 4). Write an unshifted value and your “low” priority reads as 0 (highest). Stick to `NVIC_SetPriority()`, which shifts for you, and remember 0 = highest.

</details>
