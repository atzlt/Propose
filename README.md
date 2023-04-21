# Propose

Propose is a tool to generate geometric figures (SVG format) from text files.

## Examples

### Incircle

```
config width=250, height=200

A = (-3, 2)
B = (3, 2)
C = (1, -2)
I = cI A, B, C
r = d I, AB

draw A, B, C, AB, BC, CA, I

config color=blue
draw (I, r)
```

[Output: Incircle](./test_input/incircle.svg)
