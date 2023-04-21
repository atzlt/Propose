export type AstLine2P = {
    a: string,
    b: string,
};

export type AstCircleOR = {
    center: string,
    radius: string | number,
};

export type AstCircleOA = {
    center: string,
    thru: string,
};

export type AstArg = string | AstLine2P | AstCircleOA | AstCircleOR | number;

export type AstExpr = {
    method: string,
    args: AstArg[],
};

export type AstCoord = {
    x: number,
    y: number,
}

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

export type AstDrawStep = AstLine2P | AstCircleOA | AstCircleOR | string;

export type AstDraw = {
    kind: "draw",
    steps: AstDrawStep[],
};

export type AstConfig = {
    conf: string,
    value: string,
}

export type AstConfigLine = {
    kind: "config",
    confs: AstConfig[]
};

export type AstFileLine = AstDecl | AstDraw | AstConfigLine;

// deno-lint-ignore no-explicit-any
export function isDestruct(x: any): x is AstDestruct {
    return x.kind == "destruct";
}

// deno-lint-ignore no-explicit-any
export function isLine2P(x: any): x is AstLine2P {
    return x.a && x.b;
}

// deno-lint-ignore no-explicit-any
export function isCircleOR(x: any): x is AstCircleOR {
    return x.center && x.radius;
}

// deno-lint-ignore no-explicit-any
export function isCircleOA(x: any): x is AstCircleOA {
    return x.center && x.thru;
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
