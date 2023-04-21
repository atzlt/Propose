import { metric as m } from "../deps.ts";
import { AstArg, AstExpr, isCircleOA, isCircleOR, isConf, isCoord, isDecl, isDestruct, isDraw, isLine2P } from "./ast.ts";
import { drawCircle, drawDot, drawSegment } from "./draw.ts";
import { METHODS } from "./methods.ts";
import { parse } from "./parser.ts";

type ObjectsRecord = Record<string, m.GObject | number>;

function evalArg(arg: AstArg, objs: ObjectsRecord) {
    console.log(arg);
    if (typeof arg == "string") {
        return objs[arg];
    } else if (typeof arg == "number") {
        return arg;
    } else if (isLine2P(arg)) {
        return m.line(<m.Point>objs[arg.a], <m.Point>objs[arg.b]);
    } else if (isCircleOR(arg)) {
        if (typeof arg.radius == "number") {
            return m.circle(<m.Point>objs[arg.center], arg.radius);
        } else {
            return m.circle(<m.Point>objs[arg.center], <number>objs[arg.radius]);
        }
    } else if (isCircleOA(arg)) {
        return m.circle(<m.Point>objs[arg.center], <m.Point>objs[arg.thru]);
    } else throw Error(`Unrecognized argument ${arg}`);
}

function evalExpr(expr: AstExpr, objs: ObjectsRecord) {
    const fn = METHODS[expr.method];
    if (fn == undefined) {
        throw new Error(`Undefined method ${expr.method}`);
    }
    return fn.apply(null, expr.args.map((arg, _) => evalArg(arg, objs)));
}

type InterpreterOption = {
    // deno-lint-ignore no-explicit-any
    width?: any,
    // deno-lint-ignore no-explicit-any
    height?: any,
    // deno-lint-ignore no-explicit-any
    color?: any,
    // deno-lint-ignore no-explicit-any
    fill?: any,
    // deno-lint-ignore no-explicit-any
    linewidth?: any,
    // deno-lint-ignore no-explicit-any
    dotsize?: any,
};

export default function interpret(str: string, options: InterpreterOption) {
    const objs: ObjectsRecord = {
        "l": m.line(1, 0, -1),
        "k": m.line(0, 1, -1),
    };
    // deno-lint-ignore no-explicit-any
    const config: Record<string, any> = Object.assign({
        width: 300,
        height: 300,
        color: "#000000",
        fill: "#00000000",
        linewidth: 1.5,
        dotsize: 2.5,
    }, options);
    let lineSvg = "";
    let dotsSvg = "";
    const ast = parse(str).ast;
    if (ast == null) {
        throw new Error("Input is invalid");
    }
    const lines = ast.lines;
    for (const line of lines) {
        if (isDecl(line)) {
            const left = line.tar;
            const right = line.val;
            let value;
            if (isCoord(right)) {
                value = m.point(right.x, right.y);
            } else {
                value = evalExpr(right, objs);
                if (!value) throw new Error(`Evaluating expression gives empty value`);
            }
            console.log(value);
            if (isDestruct(left)) {
                console.log(left);
                if (left.tar1 != "_") objs[left.tar1] = value[0];
                if (left.tar2 != "_") objs[left.tar2] = value[1];
            } else {
                objs[left.tar] = value;
            }
        } else if (isDraw(line)) {
            console.log(line);
            for (const step of line.steps) {
                if (typeof step == "string") {
                    const obj = objs[step];
                    console.log(obj);
                    if (m.isPoint(obj)) {
                        dotsSvg += drawDot(obj, config);
                    } else if (m.isCircle(obj)) {
                        lineSvg += drawCircle(obj, config);
                    }
                } else if (isLine2P(step)) {
                    lineSvg += drawSegment(<m.Point>objs[step.a], <m.Point>objs[step.b], config);
                } else if (isCircleOR(step)) {
                    lineSvg += drawCircle(m.circle(<m.Point>objs[step.center], <number>objs[step.radius]), config);
                } else if (isCircleOA(step)) {
                    lineSvg += drawCircle(m.circle(<m.Point>objs[step.center], <m.Point>objs[step.thru]), config);
                } else throw Error(`Unrecognized drawing step ${step}`);
            }
        } else if (isConf(line)) {
            for (const conf of line.confs) {
                config[conf.conf] = conf.value;
            }
        }
    }
    return wrapSVG(lineSvg + dotsSvg, config);
}

// deno-lint-ignore no-explicit-any
function wrapSVG(svg: string, config: Record<string, any>) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="${-parseFloat(config.width) / 2} ${-parseFloat(config.height) / 2} ${config.width} ${config.height}">${svg}</svg>`;
}
