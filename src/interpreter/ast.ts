export type AstLine2P = {
    kind: "line2p",
    a: string,
    b: string,
};

export type AstTriangle = {
    kind: "trig",
    a: string,
    b: string,
    c: string,
};

export type AstCircleOR = {
    kind: "or",
    center: string,
    radius: string | number,
};

export type AstCircleOA = {
    kind: "oa",
    center: string,
    thru: string,
};

export type AstCircle3P = {
    kind: "o3p",
    a: string,
    b: string,
    c: string,
};

export type AstArg =
    string | AstLine2P | AstTriangle | AstCircle3P | AstCircleOA | AstCircleOR | AstTriangle | number;

export type AstExpr = {
    method: string,
    args: AstArg[],
};

export type AstCoord = {
    x: number,
    y: number,
};

export type AstDestruct = {
    kind: "destruct",
    tar1: string,
    tar2: string,
};

export type AstDirect = {
    kind: "direct",
    tar: string,
};

export type AstDeclLeft = AstDestruct | AstDirect;

export type AstDecl = {
    kind: "decl",
    tar: AstDeclLeft,
    val: AstExpr | AstCoord,
};

export type AstDrawStep = {
    step: AstLine2P | AstCircleOA | AstCircleOR | AstCircle3P | string,
    conf: AstConfig[],
};

export type AstDraw = {
    kind: "draw",
    steps: AstDrawStep[],
};

export type AstConfig = {
    conf: string,
    value: string,
};

export type AstConfigLine = {
    kind: "config",
    confs: AstConfig[];
};

export type AstFileLine = AstDecl | AstDraw | AstConfigLine;

// deno-lint-ignore no-explicit-any
export function isDestruct(x: any): x is AstDestruct {
    return x.kind == "destruct";
}

// deno-lint-ignore no-explicit-any
export function isLine2P(x: any): x is AstLine2P {
    return x.kind == "line2p";
}

// deno-lint-ignore no-explicit-any
export function isTrig(x: any): x is AstTriangle {
    return x.kind == "trig";
}

// deno-lint-ignore no-explicit-any
export function isCircleOR(x: any): x is AstCircleOR {
    return x.kind == "or";
}

// deno-lint-ignore no-explicit-any
export function isCircleOA(x: any): x is AstCircleOA {
    return x.kind == "oa";
}

// deno-lint-ignore no-explicit-any
export function isCircle3P(x: any): x is AstCircle3P {
    return x.kind == "o3p";
}

// deno-lint-ignore no-explicit-any
export function isDecl(x: any): x is AstDecl {
    return x.kind == "decl";
}

// deno-lint-ignore no-explicit-any
export function isDraw(x: any): x is AstDraw {
    return x.kind == "draw";
}

// deno-lint-ignore no-explicit-any
export function isConf(x: any): x is AstConfigLine {
    return x.kind == "config";
}

// deno-lint-ignore no-explicit-any
export function isCoord(x: any): x is AstCoord {
    return x.x != undefined && x.y != undefined;
}