// deno-lint-ignore-file no-explicit-any
import { ExprParser, metric as m } from "../deps.ts";
import {
    AstArg,
    AstDrawStep,
    AstExpr,
    isArc,
    isCircle3P,
    isCircleOA,
    isCircleOR,
    isConf,
    isCoord,
    isDecl,
    isDestruct,
    isDraw,
    isEval,
    isLine2P,
    isPoly,
    isSaveFile,
    isTrig,
} from "./ast.ts";
import {
    calcArc,
    CM,
    drawArc3P,
    drawCircle,
    drawDot,
    drawLabel,
    drawPolygon,
    drawSegment,
} from "./draw.ts";
import { draw, label } from "./draw_util.ts";
import { METHODS } from "./methods.ts";
import { parse } from "./parser.ts";

export type ObjectsRecord = Record<string, m.GObject | number>;

export type Config = {
    width?: number;
    height?: number;
    minX?: number;
    minY?: number;
    color?: string;
    fill?: string;
    linewidth?: number;
    dotsize?: number;
    loc?: number;
    dist?: number;
    angle?: number;
    labelsize?: number;
    autolabel?: false;
    font?: string;
    dash?: string;
    label?: string;
};

export class Interpreter {
    objs: ObjectsRecord;
    config: Config;
    svg: {
        dots: string;
        line: string;
        text: string;
        area: string;
    };
    isRepl: boolean;
    exprParser: ExprParser | null = null;

    constructor(isRepl: boolean = false, options: Config = {}) {
        this.objs = {};
        this.config = Object.assign({
            width: 10,
            height: 10,
            color: "#000000",
            fill: "#00000000",
            linewidth: 1.5,
            dotsize: 2.5,
            loc: 0,
            dist: 10,
            angle: 0,
            labelsize: 15,
            autolabel: false,
            font: "serif",
        }, options);
        this.svg = {
            dots: "",
            line: "",
            text: "",
            area: "",
        };
        this.isRepl = isRepl;
    }

    interpret(str: string) {
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
                } else if (isEval(right)) {
                    this.#initExprParser();
                    value = this.exprParser!.evaluate(
                        right.str,
                        <any> this.objs,
                    );
                } else {
                    value = this.#evalExpr(right);
                    if (!value) {
                        throw new Error(
                            `Evaluating expression gives empty value`,
                        );
                    }
                }
                if (this.isRepl) console.log(value);
                if (isDestruct(left)) {
                    // console.log(left);
                    if (left.tar1 != "_") this.objs[left.tar1] = value[0];
                    if (left.tar2 != "_") this.objs[left.tar2] = value[1];
                } else {
                    this.objs[left.tar] = value;
                }
            } else if (isDraw(line)) {
                // console.log(line.steps);
                for (const drawStep of line.steps) {
                    this.#draw(drawStep);
                }
            } else if (isConf(line)) {
                for (const conf of line.confs) {
                    // @ts-ignore: Cannot infer input type from user content
                    this.config[conf.conf] = conf.value;
                }
            } else if (isSaveFile(line)) {
                // console.log(`Save to file ${line.path}`);
                Deno.writeFileSync(
                    line.path,
                    (new TextEncoder()).encode(this.emit()),
                );
            }
        }
    }

    emit() {
        // console.log(this.config);
        const width = this.config.width! * CM;
        const height = this.config.height! * CM;
        const minX = this.config.minX ? this.config.minX * CM : -width / 2;
        const minY = this.config.minY ? this.config.minY * CM : -height / 2;
        // console.log([width, height, minX, minY]);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">${this.svg.area}${this.svg.line}${this.svg.dots}${this.svg.text}</svg>`;
    }

    #initExprParser() {
        if (this.exprParser == null) {
            this.exprParser = new ExprParser({
                operators: {
                    add: true,
                    conditional: true,
                    divide: true,
                    factorial: true,
                    multiply: true,
                    power: true,
                    remainder: true,
                    subtract: true,
                    "in": false,
                    assignment: false,
                },
            });
        }
    }

    #draw(drawStep: AstDrawStep) {
        let tempConf: Config = {};
        for (const conf of drawStep.conf) {
            // @ts-ignore: Cannot infer input type from user content
            tempConf[conf.conf] = conf.value;
        }
        tempConf = { ...this.config, ...tempConf };

        const output = draw(drawStep, tempConf, this.objs);
        this.svg[output.layer] += output.content;
        if (
            tempConf.label !== undefined ||
            (tempConf.autolabel && typeof drawStep.step == "string")
        ) {
            const output = label(drawStep, tempConf, this.objs);
            if (output) {
                this.svg[output.layer] += output.content;
            }
        }
    }

    #evalExpr(expr: AstExpr) {
        const fn = METHODS[expr.method];
        if (fn == undefined) {
            throw new Error(`Undefined method ${expr.method}`);
        }
        return fn.apply(null, expr.args.map((arg, _) => this.#resolveArg(arg)));
    }

    #resolveArg(arg: AstArg) {
        // console.log(arg);
        if (typeof arg == "string") {
            return this.objs[arg];
        } else if (typeof arg == "number") {
            return arg;
        } else if (isLine2P(arg)) {
            return m.line(
                <m.Point> this.objs[arg.a],
                <m.Point> this.objs[arg.b],
            );
        } else if (isTrig(arg)) {
            return [
                <m.Point> this.objs[arg.a],
                <m.Point> this.objs[arg.b],
                <m.Point> this.objs[arg.c],
            ];
        } else if (isCircleOR(arg)) {
            if (typeof arg.radius == "number") {
                return m.circle(<m.Point> this.objs[arg.center], arg.radius);
            } else {
                return m.circle(
                    <m.Point> this.objs[arg.center],
                    <number> this.objs[arg.radius],
                );
            }
        } else if (isCircleOA(arg)) {
            return m.circle(
                <m.Point> this.objs[arg.center],
                <m.Point> this.objs[arg.thru],
            );
        } else if (isCircle3P(arg)) {
            return m.circle(
                <m.Point> this.objs[arg.a],
                <m.Point> this.objs[arg.b],
                <m.Point> this.objs[arg.c],
            );
        } else if (isEval(arg)) {
            this.#initExprParser();
            return this.exprParser!.evaluate(arg.str, <any> this.objs);
        }
        throw Error(`Unrecognized argument ${arg}`);
    }
}
