import { metric as m } from "../deps.ts";
import { AstArg, AstExpr, isCircle3P, isCircleOA, isCircleOR, isConf, isCoord, isDecl, isDestruct, isDraw, isLine2P, isTrig } from "./ast.ts";
import { drawCircle, drawDot, drawPointLabel, drawSegment } from "./draw.ts";
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
    } else if (isTrig(arg)) {
        return [<m.Point>objs[arg.a], <m.Point>objs[arg.b], <m.Point>objs[arg.c]]
    } else if (isCircleOR(arg)) {
        if (typeof arg.radius == "number") {
            return m.circle(<m.Point>objs[arg.center], arg.radius);
        } else {
            return m.circle(<m.Point>objs[arg.center], <number>objs[arg.radius]);
        }
    } else if (isCircleOA(arg)) {
        return m.circle(<m.Point>objs[arg.center], <m.Point>objs[arg.thru]);
    } else if (isCircle3P(arg)) {
        return m.circle(<m.Point>objs[arg.a], <m.Point>objs[arg.b], <m.Point>objs[arg.c]);
    } throw Error(`Unrecognized argument ${arg}`);
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
    const objs: ObjectsRecord = {};
    // deno-lint-ignore no-explicit-any
    const config: Record<string, any> = Object.assign({
        width: 300,
        height: 300,
        minX: -150,
        minY: -150,
        color: "#000000",
        fill: "#00000000",
        linewidth: 1.5,
        dotsize: 2.5,
        labelloc: 0,
        labeldist: 0.3,
        labelsize: 15,
    }, options);
    // Split into lines and dots, because dots are always on top of lines
    let lineSvg = "";
    let dotsSvg = "";
    let textSvg = "";
    const parseResult = parse(str);
    if (parseResult.ast == null) {
        throw new Error(`Input is invalid: ${parseResult.errs}`);
    }
    const lines = parseResult.ast.lines;
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
            for (const drawStep of line.steps) {
                const step = drawStep.step;
                let tempConf: Record<string, string> = {};
                for (const conf of drawStep.conf) {
                    tempConf[conf.conf] = conf.value;
                }
                tempConf = {...config, ...tempConf};

                if (typeof step == "string") {
                    const obj = objs[step];
                    console.log(obj);
                    if (m.isPoint(obj)) {
                        dotsSvg += drawDot(obj, tempConf);
                        if (tempConf.label != undefined) {
                            textSvg += drawPointLabel(obj, tempConf);
                        }
                    } else if (m.isCircle(obj)) {
                        lineSvg += drawCircle(obj, tempConf);
                    }
                } else if (isLine2P(step)) {
                    lineSvg += drawSegment(<m.Point>objs[step.a], <m.Point>objs[step.b], tempConf);
                } else if (isCircleOR(step) || isCircleOA(step) || isCircle3P(step)) {
                    lineSvg += drawCircle(<m.Circle>evalArg(step, objs), tempConf);
                } else throw Error(`Unrecognized drawing step ${step}`);
            }
        } else if (isConf(line)) {
            for (const conf of line.confs) {
                config[conf.conf] = conf.value;
            }
        }
    }
    return wrapSVG(lineSvg + dotsSvg + textSvg, config);
}

// deno-lint-ignore no-explicit-any
function wrapSVG(svg: string, config: Record<string, any>) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="${-parseFloat(config.width) / 2} ${-parseFloat(config.height) / 2} ${config.width} ${config.height}">${svg}</svg>`;
}
