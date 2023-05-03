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
import { drawDecor } from "./decor.ts";

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
    withAngle = false,
): (
    drawStep: AstDrawStep,
    conf: Config,
    objs: ObjectsRecord,
) => string | undefined {
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
                return fn(obj, conf);
            } else if (m.isCircle(obj)) {
                return fn(
                    m.calc.point_on.onCircle(
                        obj,
                        conf.loc!,
                    ),
                    conf,
                );
            }
        } else if (isLine2P(step)) {
            const A = <m.Point> objs[step.a];
            const B = <m.Point> objs[step.b];
            if (withAngle) {
                conf.decorangle = Math.atan2(B[1] - A[1], B[0] - A[0]);
            }
            return fn(
                m.calc.point_on.onSegment([A, B], conf.loc!),
                conf,
            );
        } else if (
            isCircleOR(step) || isCircleOA(step) || isCircle3P(step)
        ) {
            const circ = <m.Circle> resolveCircle(step, objs);
            const pos = m.calc.point_on.onCircle(
                circ,
                conf.loc!,
            );
            if (withAngle) {
                const O = circ[0];
                conf.decorangle = Math.atan2(pos[0] - O[0], O[1] - pos[1]);
            }
            return fn(pos, conf);
        } else if (isArc(step)) {
            const A = <m.Point> objs[step.a];
            const B = <m.Point> objs[step.b];
            const C = <m.Point> objs[step.c];
            const arc = calcArc(A, B, C);
            conf.loc = conf.loc! * arc.angle;
            const pos = m.calc.transform.rotate(
                A,
                arc.center,
                conf.loc,
            );
            if (withAngle) {
                const O = arc.center;
                conf.decorangle = Math.atan2(pos[0] - O[0], O[1] - pos[1]);
            }
            return fn(pos, conf);
        }
    };
}

export const label = decorWith(drawLabel);
export const decor = decorWith(drawDecor, true);
