# Propose

Propose is a tool to generate geometric figures (SVG format) from text files.

For a usage guide see [Usage](./Usage.md).

## Examples

### Incircle

```
config height=340, width=450, minX=-140, minY=-150

O = (0, 0)
c = @ O, 3
A = (3 : -40deg)
B = (3 : 50deg)
C = (3 : 220deg)
l, _ = tan A, c
k, _ = tan C, c
T = # l, k
D, _ = # TB, c, B
l, _ = tan B, c
k, _ = tan D, c
S = # l, k

draw c, A[label=A,loc=-60deg], B[label=B,loc=50deg], C[label=C,loc=220deg,dist=0.4], D[label=D,loc=-65deg,dist=0.4], AB, BC, CD, DA, T, AT, CT, BT, S, CS [color=blue], BS, DS
```

![Output: Harmonic](./test_input/harmonic.svg)

## Features

- [x] Drawing with various styles
- [x] REPL mode
- [x] Evaluate math expressions
- [ ] Labels
- [ ] Text decoration

### Plans

- [ ] Draw infinite lines
- [ ] Draw arcs
