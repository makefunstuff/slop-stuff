---
title: "Mathematics"
description: "Linear algebra, probability, calculus, discrete, and signal/DSP math for programmers."
category: "Quantitative"
tags: ["math", "linear algebra", "probability", "Fourier"]
weight: 530
lead: "The math behind the code."
version: "applied"
---
Mathematics is the hidden runtime of software: the linear algebra in ML, the probability in analytics, the calculus in optimization, and the DSP behind every signal. Here's the toolkit, in one place.

## Quick reference {#quickref}

The eight formulas you'll reach for most — scan this before anything else.

- `a · b = |a||b| cos θ` — **Dot & cross product.** Dot → scalar (alignment); cross → vector perpendicular to both (3D only).
- `C[i][j] = Σ A[i][k] · B[k][j]` — **Matrix multiplication.** `(m×n)·(n×p) = (m×p)`; entry `(i, j)` is row `i` of A dotted with column `j` of B.
- `d/dx x^n = n·x^(n−1)` — **Derivative — power rule.** Bring the exponent down and drop it by one; `d/dx e^x = e^x`, `d/dx ln x = 1/x`.
- `d/dx f(g(x)) = f'(g(x)) · g'(x)` — **Chain rule.** Derivative of a composition = outside × inside. Backpropagation is exactly this, layered backward.
- `P(A|B) = P(B|A) · P(A) / P(B)` — **Bayes' theorem.** Update a belief with evidence; the denominator normalizes over all outcomes.
- `X(f) = ∫ x(t) e^(−j2πft) dt` — **Fourier transform.** Time ↔ frequency; convolution in time becomes multiplication in frequency (FFT: `O(N log N)`).
- `θ = θ − α · ∇J(θ)` — **Gradient descent.** Step downhill against the gradient; `α` is the learning rate (step size).
- `a ≡ b (mod m)` — **Modular arithmetic.** Clock arithmetic — `(a+b) mod m = (a mod m + b mod m) mod m`. Basis of hashing and crypto.

## Notation & constants {#start}

The symbols you'll meet in every area below, the constants that keep appearing, and the rules that keep expressions unambiguous.

### 1. Greek letters

`α β γ θ λ μ π σ φ ω` stand for angles, means, weights, rates, and frequencies.

### 2. Sum & product

`∑ xi` adds a sequence; `∏ xi` multiplies it. The index goes under the symbol.

### 3. Calculus ops

`∫` integrates, `∂` is a partial derivative, and `∇` is the gradient (vector of partials).

### 4. Sets & logic

`∈` "in", `∀` "for all", `∃` "exists", `⇒` "implies".

| Symbol | Meaning | Example |
| --- | --- | --- |
| `∑` | Summation | `∑ xi = x1 + x2 + … + xn` |
| `∏` | Product | `∏ xi = x1 · x2 · … · xn` |
| `∫` | Integral | `∫ f(x) dx` |
| `∂` | Partial derivative | `∂f/∂x` |
| `∇` | Nabla — gradient | `∇f = (∂f/∂x, ∂f/∂y)` |
| `∈` | Element of | `x ∈ {1, 2, 3}` |
| `∀` | For all | `∀x > 0` |
| `∃` | There exists | `∃x : f(x) = 0` |
| `⇒` | Implies | `a = b ⇒ a + c = b + c` |
| `\|x\|` | Absolute value / magnitude | `\|−3\| = 3` |
| `‖x‖` | Vector norm (length) | `‖x‖ = √(x1² + x2²)` |
| `≈ ≠` | Approximately / not equal | `π ≈ 3.14`, `1 ≠ 2` |

### Constants

```
π ≈ 3.14159    # circle: C = 2πr
e ≈ 2.71828    # Euler: d/dx e^x = e^x
φ ≈ 1.61803    # golden ratio (1 + √5)/2
√2 ≈ 1.41421   # unit-square diagonal
γ ≈ 0.57721    # Euler–Mascheroni
```

### Order of operations

```
P — Parentheses     ( )
E — Exponents       2^3 = 8
M — Multiply / Divide  (left → right)
A — Add / Subtract     (left → right)

(2 + 3) × 4² = 5 × 16 = 80
2 + 3 × 4   = 2 + 12 = 14
```

### Log identities

```
log(ab)  = log a + log b
log(a/b) = log a − log b
log(a^n) = n · log a
log_b a  = log a / log b   # change base
ln e = 1      log 1 = 0
```

> **∑:** **Read the notation.** Juxtaposition means multiply (`2x` is `2·x`, `ab` is `a·b`), and powers bind tighter than negation: `−x² = −(x²)`. When in doubt, add parentheses.

## Linear algebra {#linear}

Vectors and matrices are the machinery behind ML weights and 3D graphics. A matrix is a linear transform: it maps vectors to vectors.

**Vector** (n components) → **Matrix A** (m×n numbers) → **Transform** (y = Ax) → **Eigenvector** (Av = λv) → **Result** (mapped vector)

### Dot & cross product

```
# dot → scalar (alignment)
a · b = |a||b| cos θ
      = a1 b1 + a2 b2 + a3 b3

# cross → vector (3D only, ⊥ to both)
a × b = (a2b3 − a3b2,
         a3b1 − a1b3,
         a1b2 − a2b1)
```

### Matrix multiplication

```
# (m×n) · (n×p) = (m×p)
# entry (i,j) = row i · column j

A = [[1, 2],
     [3, 4]]
B = [[5], [6]]
A·B = [[1·5+2·6],
       [3·5+4·6]] = [[17], [39]]
```

### Transpose / inverse / det

```
A^T     # rows ↔ cols: (A^T)[i][j] = A[j][i]
A^-1    # inverse: A·A^-1 = I
det(A)  # volume scale of the transform
        # invertible ⟺ det(A) ≠ 0
```

| Operation | Definition | Use in practice |
| --- | --- | --- |
| `A^T` | Transpose — flip rows and columns | Switch basis; dot product `a·b = a^T b` |
| `A^-1` | Inverse — undo the transform | Solve `Ax = b` → `x = A^-1 b` |
| `det(A)` | Determinant — volume scale factor | Invertibility test; change of variables |
| `λ` | Eigenvalue — `Av = λv` | PCA, vibration modes, stability |
| `rank(A)` | Dimension of the column space | Linear independence, solvability |

> **M:** **ML & 3D:** a neural-net layer's weights are a matrix, and the forward pass is `y = Ax + b`. In 3D graphics, rotation, scale, and translation are 4×4 matrices multiplied into every vertex.

`matrix` `eigenvalue` `transform` `tensor` `quaternion` `PCA`

## Probability & statistics {#prob}

Quantifying uncertainty: rules for combining events, the distributions that model real data, and the summaries that describe it.

### Probability rules

```
0 ≤ P(A) ≤ 1
P(not A)  = 1 − P(A)
P(A ∪ B)  = P(A) + P(B) − P(A ∩ B)
P(A ∩ B)  = P(A) · P(B)   # if independent
```

### Conditional & Bayes

```
P(A|B) = P(A ∩ B) / P(B)     # conditional
P(A ∩ B) = P(A|B) · P(B)     # chain rule

# Bayes' theorem
P(A|B) = P(B|A) · P(A) / P(B)
```

### Expectation & variance

```
E[X]    = Σ x · p(x)      # mean
Var(X)  = E[X²] − E[X]²   # variance
σ       = √Var(X)         # std deviation
Cov(X,Y) = E[XY] − E[X]E[Y]
```

| Distribution | Notation | Models | Mean, Variance |
| --- | --- | --- | --- |
| Uniform | `U(a, b)` | Equally likely in `[a, b]` | `(a+b)/2`, `(b−a)²/12` |
| Bernoulli | `Ber(p)` | Single success/failure | `p`, `p(1−p)` |
| Binomial | `Bin(n, p)` | Successes in `n` trials | `np`, `np(1−p)` |
| Poisson | `Pois(λ)` | Events per interval | `λ`, `λ` |
| Normal | `N(μ, σ²)` | Sums, measurement noise | `μ`, `σ²` |
| Exponential | `Exp(λ)` | Wait time to next event | `1/λ`, `1/λ²` |

### Bayes' theorem, worked

A rare disease hits 1% of people; a test is 99% accurate. A positive result is still only a coin flip.

```
P(disease)   = 0.01
P(+|disease) = 0.99
P(+|healthy) = 0.01
P(+) = 0.99·0.01 + 0.01·0.99 = 0.0198
P(disease|+) = 0.99·0.01 / 0.0198 ≈ 0.5
```

### Hypothesis testing

Frame the claim as the null hypothesis `H0`. The p-value is `P(data | H0 true)`; if it's below `α`, reject `H0`.

```
H0: no effect
α  = 0.05    # significance level
if p-value < α: reject H0
```

<details>
<summary>Hypothesis testing in one picture</summary>

Every decision lands in one of four boxes. The two error types trade off — tightening one loosens the other.

- **Reject H0, H0 false** — Correct — true positive, the test's power `1 − β`.
- **Reject H0, H0 true** — Type I error — false positive, rate `α`.
- **Keep H0, H0 false** — Type II error — false negative, rate `β`.
- **Keep H0, H0 true** — Correct — true negative.

</details>

## Calculus & optimization {#calc}

Derivatives measure change, gradients point uphill, and gradient descent steps downhill to the minimum — the engine of ML training.

### Derivative

```
f'(x) = lim h→0 (f(x+h) − f(x)) / h

d/dx x^n   = n x^(n−1)
d/dx e^x   = e^x
d/dx ln x  = 1/x
d/dx sin x = cos x
```

### Chain rule & partial

```
# chain rule: derivative of a composition
d/dx f(g(x)) = f'(g(x)) · g'(x)

# partial: treat other vars as constants
∂/∂x (x² + xy + y²) = 2x + y
```

### Integral

```
# definite integral = area under the curve
∫[a,b] f(x) dx = F(b) − F(a)    # F' = f

∫ x^n dx = x^(n+1)/(n+1) + C
∫ e^x dx = e^x + C
∫ 1/x dx = ln|x| + C
```

### Gradient & descent

```
# gradient: vector of partials, points uphill
∇J = (∂J/∂θ1, ∂J/∂θ2, …)

# gradient descent: step downhill
θ = θ − α ∇J(θ)
# α = learning rate (step size)
```

### Convexity

A convex function is a bowl: any chord lies above the graph, and a local minimum is the global minimum. Gradient descent is safe on convex losses.

```
f''(x) ≥ 0  → convex  (bowl)
f''(x) ≤ 0  → concave (hill)
f''(x) = 0  → inflection point
```

- `f'(x)` — derivative — instantaneous rate of change.
- `∂f/∂x` — partial derivative — change along one axis.
- `∇J(θ)` — gradient — all partials; points uphill.
- `θ = θ − α∇J` — gradient descent — step against the gradient.

<details>
<summary>The backprop connection</summary>

Backpropagation is the chain rule applied across a network: compute the gradient of the loss with respect to every weight by multiplying local derivatives backward from the output.

```
# forward:  y = f3(w3 · f2(w2 · f1(w1 · x)))
# backward: dL/dw1 = dL/dy · dy/dh2 · dh2/dh1 · dh1/dw1
#           (chain rule, layer by layer)
# update:   w = w − α · dL/dw
```

</details>

> **α:** **Learning rate:** too big and you overshoot and diverge; too small and you crawl. `0.1`, `0.01`, and `0.001` are common starting points — schedule it down as training converges.

## Discrete math {#discrete}

Counting, divisibility, and graphs — the math of algorithms, cryptography, and data structures.

### Permutations & combinations

```
# permutations: order matters
P(n, k) = n! / (n − k)!

# combinations: order doesn't matter
C(n, k) = n! / (k!(n − k)!)
        = (n choose k)
```

### Modular arithmetic

```
a ≡ b (mod m)   # a − b divisible by m
7 ≡ 1 (mod 3)

(a + b) mod m = (a mod m + b mod m) mod m
(a · b) mod m = (a mod m · b mod m) mod m
# clock arithmetic: 14:00 = 2:00
```

### Number theory

```
gcd(a, b)            # greatest common divisor
lcm(a, b) = a·b / gcd(a, b)
prime: divisible only by 1 and itself
# Euclid's algorithm
gcd(a, b) = gcd(b, a mod b)
```

### Graph theory

```
G = (V, E)       # vertices + edges
degree(v) = # edges touching v
Σ degrees = 2·|E|           # handshaking lemma
tree: connected, no cycles, |E| = |V| − 1
```

### Boolean logic

```
AND:  A ∧ B   # true only if both
OR:   A ∨ B   # false only if neither
NOT:  ¬A      # flip
XOR:  A ⊕ B   # true if exactly one

De Morgan: ¬(A ∧ B) = ¬A ∨ ¬B
           ¬(A ∨ B) = ¬A ∧ ¬B
```

<details>
<summary>Binomial coefficients & Pascal's triangle</summary>

Each entry is the sum of the two above it, and row `n` lists the coefficients of `(x + y)^n`.

```
        1
      1   1
    1   2   1
  1   3   3   1
1   4   6   4   1

# (x + y)^4 = x⁴ + 4x³y + 6x²y² + 4xy³ + y⁴
```

</details>

## Signal/DSP math {#dsp}

The bridge between continuous reality and sampled data: complex numbers, the Fourier transform, and the sampling rules that keep a digital signal faithful. (Companion to the SDR page.)

<kbd>1 GHz</kbd> = <kbd>1000 MHz</kbd> = <kbd>10⁶ kHz</kbd> = <kbd>10⁹ Hz</kbd>

### Complex numbers

```
z = a + jb            # rectangular
  = r e^(jθ)          # polar
  = r(cos θ + j sin θ)
r = |z| = √(a² + b²)  # magnitude
θ = atan2(b, a)       # phase
conjugate: a − jb
```

### Euler's formula

```
e^(jθ) = cos θ + j sin θ

e^(jπ) + 1 = 0      # Euler identity
cos θ = (e^(jθ) + e^(−jθ)) / 2
sin θ = (e^(jθ) − e^(−jθ)) / (2j)
```

### Fourier transform

```
# continuous → spectrum
X(f) = ∫ x(t) e^(−j2πft) dt

# discrete (DFT / FFT)
X[k] = Σ_n x[n] e^(−j2πkn/N)
# k = frequency bin, N = samples
```

1. An ADC turns the continuous signal into discrete samples `x[n]`.
1. Multiply by a Hann window to reduce spectral leakage from the edges.
1. Transform time-domain samples into frequency bins `X[k]`.
1. Convolve with a kernel to pass a band and reject the rest.
1. Threshold, demodulate, or extract features from the result.

### Sampling & Nyquist

```
fs > 2 · f_max   # Nyquist rate
# sample too slowly → aliasing
# (high freqs fold back as low freqs)

Δt = 1/fs         # sample period
# 44.1 kHz audio captures up to 22.05 kHz
```

### Convolution

```
# blur / echo = convolution with a kernel
(y * h)[n] = Σ_k x[k] h[n − k]

# convolution ⟺ multiplication in frequency
FFT(x * h) = X(f) · H(f)   # filtering
```

<details>
<summary>Z-transform basics</summary>

The Z-transform is the discrete-time analogue of the Laplace transform: a polynomial in `z^-1` that encodes a filter's response and reveals stability through its poles.

```
X(z) = Σ x[n] z^(−n)      # z = e^(jω)

# one-sample delay
x[n−1]  ↔  z^-1 X(z)

# transfer function; stable iff poles inside |z| = 1
H(z) = Y(z) / X(z) = B(z) / A(z)
```

</details>

> **∫:** **Time vs frequency:** a signal is easier to read in one domain than the other — a filter is a convolution in time but a simple multiplication in frequency. The FFT is the shortcut between them, at `O(N log N)`.

`FFT` `convolution` `Nyquist` `IQ` `Z-transform` `DFT`

## Pitfalls {#gotchas}

Small mistakes that silently corrupt a calculation or a model.

### Order of operations

`−x²` means `−(x²)`, not `(−x)²`. Division and multiplication bind equally and evaluate left to right.

```
−2² = −4    (not 4)
(−2)² = 4
2/3·4 = (2/3)·4 = 8/3 ≈ 2.667
```

### Units & dimensions

Carry units through the whole calculation. A mismatched unit (meters vs feet, seconds vs milliseconds) silently scales the answer wrong.

```
# 60 km / 1.5 h = 40 km/h
# 60 m  / 1.5 s = 40 m/s   ← different!
```

### Floating-point error

`0.1 + 0.2` is not exactly `0.3`. Never compare floats with `==`; use a tolerance.

```
0.1 + 0.2     # 0.30000000000000004
abs(a − b) < 1e-9   # compare this way
```

### Mean vs median

The mean is dragged by outliers; the median is not. For skewed data like income or latency, report the median — or both.

```
# [1, 2, 3, 4, 100]
mean   = 22    # outlier pulled it up
median = 3     # robust
```

### Integer overflow

A signed 32-bit int wraps at `2,147,483,647`. Multiplication or summing can overflow silently and wrap negative.

```
# int32 max = 2^31 − 1 = 2147483647
2_000_000_000 + 2_000_000_000  # overflows
# use int64 / bigint for large counts
```

### Correlation ≠ causation

Two series moving together doesn't mean one causes the other — a third factor or pure coincidence is common.

```
# ice cream sales ↑ and drownings ↑
# both driven by summer, not each other
# control for confounders, run experiments
```

### Radians vs degrees

Trig functions (`sin`, `cos`, `tan`) take **radians** in code, not degrees. Forgetting to convert silently distorts angles, rotations, and FFT phases.

```
# 2π rad = 360°
rad = deg × π / 180
deg = rad × 180 / π
sin(90)    # 0.894…  ← radians, NOT 1
sin(π/2)   # 1        ← what you meant
```

### Percent vs percentage points

A change from `1%` to `2%` is +1 **percentage point** but a +100% **relative** change. Mixing them up mangles rates and A/B results.

```
1% → 2%     # +1 pp,  +100% relative
50% → 55%   # +5 pp,  +10% relative
# state which one you mean
```

> **⚠:** **Check your inputs.** Most "math bugs" aren't the formula — they're a wrong unit, an off-by-one index, a silent overflow, or comparing floats with `==`. Sanity-check the magnitude of every result.
