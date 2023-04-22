import { metric as m } from "../deps.ts";

// deno-lint-ignore ban-types
export const METHODS: Record<string, Function> = {
    "#": m.inter,
    i: m.inter,
    "|-": m.perp,
    perp: m.perp,
    "//": m.parallel,
    par: m.parallel,
    "!": m.projection,
    proj: m.projection,
    ".|.": m.perpBisect,
    perpBsct: m.perpBisect,
    "<-": m.angleBisect,
    angBsct: m.angleBisect,
    tan: m.tangent,
    mid: m.midpoint,
    "@": m.circle,
    l: m.line,
    d: m.distance,

    refl: m.refl,
    inv: m.calc.transform.invert,
    rot: m.calc.transform.rotate,
    scale: m.calc.transform.scale,

    onCirc: m.calc.point_on.onCircle,
    onSeg: (x: m.Point, y: m.Point, z: number) => m.calc.point_on.onSegment([x, y], z),

    cO: m.centers.circumcenter,
    cCirc: m.centers.circumcenter,
    cI: m.centers.incenter,
    cIn: m.centers.incenter,
    cJ: m.centers.excenter,
    cEx: m.centers.excenter,
    cH: m.centers.orthocenter,
    cOrtho: m.centers.orthocenter,
    cG: m.centers.centroid,
    cCentr: m.centers.centroid,
}
