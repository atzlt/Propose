# Propose Syntax

A Propose file consists of **lines**. A line can either be

1. a declaration,
2. a configuration,
3. a drawing instruction, or
4. a save instruction.

## Declaration

The simpliest declaration is defining a point using coordinates:

```
A = (1, 5)
B = (6 : 70deg)
```

If two values are separated using comma `,` then this is the rectangular coordinate. If separated by colon `:`, then this is the polar coordinate.

A more complex declaration looks like this:

```
A = # XY, PQ
```

Before the equal sign `=` is the **target**, the name to be assigned to. In this case it's the name `A`. After that comes the **method**. A method is a pre-defined function; in this case it's `#`, which means _intersection_. After the method is a comma-separated list of **arguments**.

### Identifiers

Notice that the name of a point should always start with a capital letter, and the name for every other thing (a _common_ identifier) should start with a lowercase letter; the following letters should be lowercase letters, underscore or an apostrophe `'`.

Examples of valid point identifiers: `P`, `I1`, `S'`, `Oa3`, `Na1'`.

Examples of valid common identifiers: `l`, `c`, `omega'`, `k4`.

### Target

There are two kinds of declaration: direct and destruct.

Direct declaration assigns the returned value to the single target provided, and destruct declaration assigns the first returned value two the first target, and the second value two the second target. For example, `#` (intersection) returns two points for a line and circle intersection, so we can do this:

```
S, T = # AB, (O, r)
```

If you want to discard one of the value, use an underscore:

```
_, T = # AB, (O, r)
```

Every identifier can be re-assigned, but re-assigning one identifier _does not_ update the objects depending on it.

### Arguments

There are many types of arguments:

1. Identifier; its corresponding value is passed to the method.
2. Line through 2 points: `XY` means the line passing through `X` and `Y`. **There should not be any whitespaces.**
3. Circle with center and radius: `(O, r)` means the circle with center `O` and radius `r`, where `r` can be either a number literal or a common identifier representing a number.
4. Circle with center and point: `(O, A)` means the circle with center `O` and passes through `A`.
5. Circle throught 3 points: `(A B C)` means the circle passing through `A`, `B` and `C`. Whitespaces are not required: `(ABC)` is equivalent to `(A B C)`.
6. A number: either a number literal like `1.3` or an angle in degree like `20deg`. A number literal can also be passed as an angle, but in radians.
7. A triangle: `ABC` means triangle `ABC`. **There should not be any whitespaces.**

## Configuration

```
config conf1=val1, conf1=val2, ...
```

There are multiple configurations available. Changing them only affects the lines after the change.

The value can be a string, a number or a number with `deg` suffix.

1. `width, height` The width and height of the output image. Default: both `300`.
2. `minX, minY` The `minX` and `minY` of the `viewBox`. Default: if not set then `minX = -width / 2`, `minY = -height / 2`.
3. `color, fill, linewidth, dotsize` Very straightfoward. Default: `#000000`, `#00000000`, `1.5`, `2.5`.
4. `dash` Dash line style, set [the `stroke-dasharray` attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray). Default: `undefined`.
5. `loc, dist` The default location (angle) and distance for labels Default: `0`, `0.3` (**in centimeters**).

## Drawing

```
draw A, B, c[label=c,loc=40deg], PQ[color=blue], ...
```

Draw some objects. **Currently does not support drawing (infinite) lines.**

You can inline some temporary configurations in square brackets `[]`. The configurations only work for the current object. For all configurations see the previous section. There's only one additional configuration: `label`, which is the text to be labelled on this object. **Labelling currently only works for points and circles.**

The unit length is 1 centimeter. The y-axis of SVG coordinate system is flipped, so a point `(a, b)` is actually rendered as `x="a cm", y="-b cm"` in the output.

## Save file

```
save ./path/to/file.svg
```

Save the current image to a file. If you want to save several images during different construction progresses this can be helpful.

# A Working Example

Draw a harmonic quadrilateral.

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

# Using the CLI

CLI is currently very simple. You specify input by flag `-i` and output by `-o` (if not present and the input file name ends in `.prs`, the output file is calculated by replacing every `.prs` with `.svg`). For example, `propose -i test_input/incenter.prs` saves the output to `test_input/incenter.svg`.

If `-i` is not present, you enter **REPL mode**. Here you insert codes line by line, and save to a file any time you like using `save` instruction. Type `exit` or press `Ctrl+C` to exit. Any error produced will _not_ stop the REPL.

# Appendix: List of Methods

Methods marked with **destruct** requires destruct declaration.

- `#`, `i` intersection. For intersections with circles, this method requires **destruct declaration**. If a third argument is given, this should be one of the common points, and the another intersection will be placed at the first return value.
- `|-`, `perp` perpendicular. `perp <point>, <line>`
- `//`, `par` parallel. `par <point>, <line>`
- `!`, `proj` projection. `proj <point>, <line>`
- `.|.`, `perpBsct` perpendicular bisector. `.|. <point>, <point>`
- `<-`, `angBsct` **destructs** angle bisector. `<- <point>, <point>, <point>` (interior angle bisector first, exterior second) or `<- <line>, <line>`.
- `tan` **destructs** tangent line. `tan <point>, <circle>`
- `mid` midpoint. `mid <point>, <point>`

---

- `l` constructs a line. `l <point>, <point>` Define a line using two points. `l <a=number>, <b=number>, <point>` Define a line `ax+by+c=0` that passes through a point. `l <a=number>, <b=number>, <c=number>` Define a line `ax+by+c=0`.
- `@` constructs a circle. `@ <point>, <number>` Circle by center and radius. `@ <point>, <point>` Circle by center and point. `@ <point>, <point>, <point>` Circle through 3 points.
- `d` the distance between two objects.

---

- `refl` reflection in another object. When reflecting in a circle, this means inversion.
- `inv` inversion. `inv <object>, <center=point> <power=number>` (`power` can be negative.)
- `rot` rotation. `rot <object>, <center=point> <angle=number>`
- `scale` scale. `scale <object> <center=point>, <ratio=number>` (`ratio` can be nagative.)

---

- `onCirc` Define a point on a circle by angle. `onCirc <circle>, <number>`
- `onSeg` Define a point on a segment by ratio. `onSeg <point> <point> <ratio=number>`

---

## Centers

These methods all accept a triangle as the single input.

Name of method for centers have the format: `c` + `short name of center`, or `c` + `common letter of center`. The following list has the format: `letter`, `short name`, `center`. For example: `cO` is equivalent to `cCirc`, and means circumcenter.

- `O`, `Circ`, circumcenter
- `I`, `In`, incenter
- `J`, `Ex`, excenter **in angle `A`**.
- `H`, `Ortho`, orthocenter
- `G`, `Centr`, centroid
