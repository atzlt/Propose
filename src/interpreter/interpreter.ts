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
    CM,
    drawArc3P,
    drawCircle,
    drawDot,
    drawLabel,
    drawPolygon,
    drawSegment,
} from "./draw.ts";
import { METHODS } from "./methods.ts";
import { parse } from "./parser.ts";

type ObjectsRecord = Record<string, m.GObject | number>;

type Config = {
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
    labelsize?: number;
    autolabel?: false;
    font?: string;
    dash?: string;
    label?: string;
};

export default class Interpreter {
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
        const step = drawStep.step;
        let tempConf: Record<string, string | number | boolean> = {};
        for (const conf of drawStep.conf) {
            tempConf[conf.conf] = conf.value;
        }
        tempConf = { ...this.config, ...tempConf };
        if (
            tempConf.label == undefined &&
            tempConf.autolabel &&
            typeof step == "string"
        ) {
            tempConf.label = step;
        }

        if (typeof step == "string") {
            const obj = this.objs[step];
            if (m.isPoint(obj)) {
                this.svg.dots += drawDot(obj, tempConf);
                if (tempConf.label != undefined) {
                    this.svg.text += drawLabel(obj, tempConf);
                }
            } else if (m.isCircle(obj)) {
                this.svg.line += drawCircle(obj, tempConf);
                if (tempConf.label != undefined) {
                    this.svg.text += drawLabel(
                        m.calc.point_on.onCircle(
                            obj,
                            <number> tempConf.loc,
                        ),
                        tempConf,
                    );
                }
            }
        } else if (isLine2P(step)) {
            const x = <m.Point> this.objs[step.a];
            const y = <m.Point> this.objs[step.b];
            this.svg.line += drawSegment(x, y, tempConf);
        } else if (
            isCircleOR(step) || isCircleOA(step) || isCircle3P(step)
        ) {
            const obj = <m.Circle> this.#resolveArg(step);
            this.svg.line += drawCircle(obj, tempConf);
            if (tempConf.label != undefined) {
                this.svg.text += drawLabel(
                    m.calc.point_on.onCircle(
                        obj,
                        <number> tempConf.loc,
                    ),
                    tempConf,
                );
            }
        } else if (isPoly(step)) {
            this.svg.area += drawPolygon(
                <m.Point[]> step.P.map((val, _) => this.objs[val]),
                tempConf,
            );
        } else if (isArc(step)) {
            const A = <m.Point> this.objs[step.a];
            const B = <m.Point> this.objs[step.b];
            const C = <m.Point> this.objs[step.c];
            const obj = m.circle(A, B, C);
            this.svg.line += drawArc3P(A, B, C, tempConf);
            if (tempConf.label != undefined) {
                this.svg.text += drawLabel(
                    m.calc.transform.rotate(
                        A,
                        obj[0],
                        <number> tempConf.loc,
                    ),
                    tempConf,
                );
            }
        } else throw Error(`Unrecognized drawing step ${step}`);
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
