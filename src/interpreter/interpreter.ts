// deno-lint-ignore-file no-explicit-any
import { metric as m } from "../deps.ts";
import {
    AstArg,
    AstDrawStep,
    AstExpr,
    isCircle3P,
    isCircleOA,
    isCircleOR,
    isConf,
    isCoord,
    isDecl,
    isDestruct,
    isDraw,
    isLine2P,
    isSaveFile,
    isTrig,
} from "./ast.ts";
import { drawCircle, drawDot, drawLabel, drawSegment } from "./draw.ts";
import { METHODS } from "./methods.ts";
import { parse } from "./parser.ts";

type ObjectsRecord = Record<string, m.GObject | number>;

type InterpreterOption = {
    width?: any;
    height?: any;
    color?: any;
    fill?: any;
    linewidth?: any;
    dotsize?: any;
};

export default class Interpreter {
    objs: ObjectsRecord;
    config: Record<string, any>;
    svg: {
        dots: string;
        line: string;
        text: string;
    };

    constructor(options: Record<string, any>) {
        this.objs = {};
        this.config = Object.assign({
            width: 300,
            height: 300,
            minX: -150,
            minY: -150,
            color: "#000000",
            fill: "#00000000",
            linewidth: 1.5,
            dotsize: 2.5,
            loc: 0,
            dist: 0.3,
            labelsize: 15,
        }, options);
        this.svg = {
            dots: "",
            line: "",
            text: "",
        };
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
                } else {
                    value = this.#evalExpr(right);
                    if (!value) {
                        throw new Error(
                            `Evaluating expression gives empty value`,
                        );
                    }
                }
                console.log(value);
                if (isDestruct(left)) {
                    // console.log(left);
                    if (left.tar1 != "_") this.objs[left.tar1] = value[0];
                    if (left.tar2 != "_") this.objs[left.tar2] = value[1];
                } else {
                    this.objs[left.tar] = value;
                }
            } else if (isDraw(line)) {
                // console.log(line);
                for (const drawStep of line.steps) {
                    this.#draw(drawStep);
                }
            } else if (isConf(line)) {
                for (const conf of line.confs) {
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
        const minX = this.config.minX
            ? this.config.minX
            : -parseFloat(this.config.width) / 2;
        const minY = this.config.minY
            ? this.config.minY
            : -parseFloat(this.config.height) / 2;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.config.width}" height="${this.config.height}" viewBox="${minX} ${minY} ${this.config.width} ${this.config.height}">${this.svg.line}${this.svg.dots}${this.svg.text}</svg>`;
    }

    #draw(drawStep: AstDrawStep) {
        const step = drawStep.step;
        let tempConf: Record<string, string> = {};
        for (const conf of drawStep.conf) {
            tempConf[conf.conf] = conf.value;
        }
        tempConf = { ...this.config, ...tempConf };

        if (typeof step == "string") {
            const obj = this.objs[step];
            // console.log(obj);
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
                            parseFloat(tempConf.loc),
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
            this.svg.line += drawCircle(
                <m.Circle> this.#evalArg(step),
                tempConf,
            );
        } else throw Error(`Unrecognized drawing step ${step}`);
    }

    #evalExpr(expr: AstExpr) {
        const fn = METHODS[expr.method];
        if (fn == undefined) {
            throw new Error(`Undefined method ${expr.method}`);
        }
        return fn.apply(null, expr.args.map((arg, _) => this.#evalArg(arg)));
    }

    #evalArg(arg: AstArg) {
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
        }
        throw Error(`Unrecognized argument ${arg}`);
    }
}
