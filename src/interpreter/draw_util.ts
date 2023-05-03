import {
    AstArg,
    AstDrawStep,
    isArc,
    isCircle3P,
    isCircleOA,
    isCircleOR,
    isLine2P,
    isPoly,
} from "./ast.ts";
import {
    calcArc,
    drawArc3P,
    drawCircle,
    drawDot,
    drawLabel,
    drawPolygon,
    drawSegment,
} from "./draw.ts";
import { Config, ObjectsRecord } from "./interpreter.ts";
import { metric as m } from "../deps.ts";

export type DrawOutput = {
    layer: "dots" | "line" | "area" | "text";
    content: string;
};

function resolveCircle(arg: AstArg, objs: ObjectsRecord) {
    if (isCircleOR(arg)) {
        if (typeof arg.radius == "number") {
            return m.circle(<m.Point> objs[arg.center], arg.radius);
        } else {
            return m.circle(
                <m.Point> objs[arg.center],
                <number> objs[arg.radius],
            );
        }
    } else if (isCircleOA(arg)) {
        return m.circle(
            <m.Point> objs[arg.center],
            <m.Point> objs[arg.thru],
        );
    }
}

export function draw(
    drawStep: AstDrawStep,
    conf: Config,
    objs: ObjectsRecord,
): DrawOutput {
    const step = drawStep.step;

    if (typeof step == "string") {
        const obj = objs[step];
        if (m.isPoint(obj)) {
            return { layer: "dots", content: drawDot(obj, conf) };
        } else if (m.isCircle(obj)) {
            return { layer: "line", content: drawCircle(obj, conf) };
        }
    } else if (isLine2P(step)) {
        const x = <m.Point> objs[step.a];
        const y = <m.Point> objs[step.b];
        return { layer: "line", content: drawSegment(x, y, conf) };
    } else if (
        isCircleOR(step) || isCircleOA(step) || isCircle3P(step)
    ) {
        const circ = <m.Circle> resolveCircle(step, objs);
        return { layer: "line", content: drawCircle(circ, conf) };
    } else if (isPoly(step)) {
        return {
            layer: "area",
            content: drawPolygon(
                <m.Point[]> step.P.map((val, _) => objs[val]),
                conf,
            ),
        };
    } else if (isArc(step)) {
        const A = <m.Point> objs[step.a];
        const B = <m.Point> objs[step.b];
        const C = <m.Point> objs[step.c];
        const arc = calcArc(A, B, C);
        return { layer: "line", content: drawArc3P(arc, conf) };
    }
    throw Error(`Unrecognized drawing step ${step}`);
}

function decorWith(
    fn: (pos: m.Point, conf: Config) => string,
): (
    drawStep: AstDrawStep,
    conf: Config,
    objs: ObjectsRecord,
) => DrawOutput | undefined {
    return function (
        drawStep,
        conf,
        objs,
    ) {
        const step = drawStep.step;

        // Do autolabelling
        if (
            conf.label === undefined &&
            conf.autolabel &&
            typeof step == "string"
        ) {
            conf.label = step;
        }

        if (typeof step == "string") {
            const obj = objs[step];
            if (m.isPoint(obj)) {
                return { layer: "text", content: fn(obj, conf) };
            } else if (m.isCircle(obj)) {
                return {
                    layer: "text",
                    content: fn(
                        m.calc.point_on.onCircle(
                            obj,
                            conf.loc!,
                        ),
                        conf,
                    ),
                };
            }
        } else if (isLine2P(step)) {
            return {
                layer: "text",
                content: fn(
                    m.calc.point_on.onSegment(
                        [
                            <m.Point> objs[step.a],
                            <m.Point> objs[step.b],
                        ],
                        conf.loc!,
                    ),
                    conf,
                ),
            };
        } else if (
            isCircleOR(step) || isCircleOA(step) || isCircle3P(step)
        ) {
            const circ = <m.Circle> resolveCircle(step, objs);
            return {
                layer: "text",
                content: fn(
                    m.calc.point_on.onCircle(
                        circ,
                        conf.loc!,
                    ),
                    conf,
                ),
            };
        } else if (isArc(step)) {
            const A = <m.Point> objs[step.a];
            const B = <m.Point> objs[step.b];
            const C = <m.Point> objs[step.c];
            const arc = calcArc(A, B, C);
            if (conf.label != undefined) {
                conf.loc = conf.loc! * arc.angle;
                return {
                    layer: "text",
                    content: fn(
                        m.calc.transform.rotate(
                            A,
                            arc.center,
                            conf.loc,
                        ),
                        conf,
                    ),
                };
            }
        }
    };
}

export const label = decorWith(drawLabel);
