import { metric as m } from "../deps.ts";
import { Arc } from "./parser.ts";

export const CM = 37.795;

export function drawSegment(
    A: m.Point,
    B: m.Point,
    conf: {
        color?: string;
        linewidth?: number;
        dash?: string;
    },
) {
    const dash = conf.dash ? ` stroke-dasharray="${conf.dash}"` : "";
    return `<line x1="${A[0]}cm" y1="${-A[1]}cm" x2="${B[0]}cm" y2="${-B[
        1
    ]}cm" stroke="${conf.color}" stroke-width="${conf.linewidth}"${dash}/>`;
}

export function drawCircle(
    c: m.Circle,
    conf: {
        fill?: string;
        color?: string;
        linewidth?: number;
        dash?: string;
    },
) {
    const dash = conf.dash ? ` stroke-dasharray="${conf.dash}"` : "";
    return `<circle cx="${c[0][0]}cm" cy="${-c[0][1]}cm" r="${
        c[1]
    }cm" stroke="${conf.color}" fill="${conf.fill}" stroke-width="${conf.linewidth}"${dash}/>`;
}

export function drawDot(
    P: m.Point,
    conf: {
        color?: string;
        dotsize?: number;
    },
) {
    return `<circle cx="${
        P[0]
    }cm" cy="${-P[1]}cm" r="${conf.dotsize}" fill="${conf.color}"/>`;
}

export function drawPolygon(
    P: m.Point[],
    conf: {
        fill?: string;
    },
) {
    return `<polygon points="${
        P.map((v, _) => v[0] * CM + "," + v[1] * -CM).join(" ")
    }" fill="${conf.fill}"/>`;
}

type ArcData = {
    start: m.Point;
    end: m.Point;
    radius: number;
    center: m.Point;
    large_arc: boolean;
    sweep: boolean; // true = counterclockwise
    angle: number;
};

export function calcArc(A: m.Point, B: m.Point, C: m.Point): ArcData {
    const [O, r] = m.circle(A, B, C);
    const x1 = B[0] - A[0];
    const x2 = C[0] - B[0];
    const y1 = B[1] - A[1];
    const y2 = C[1] - B[1];
    const large_arc = x1 * x2 + y1 * y2 < 0;
    const sweep = x1 * y2 > x2 * y1;
    let angle = m.angle(A, O, C);
    angle = large_arc ? 2 * Math.PI - angle : angle;
    angle = sweep ? angle : -angle;
    return {
        start: A,
        end: C,
        radius: r,
        center: O,
        large_arc,
        sweep,
        angle,
    };
}

export function drawArc3P(
    arc: ArcData,
    conf: {
        color?: string;
        linewidth?: number;
        dash?: string;
    },
) {
    const {
        radius,
        large_arc,
        sweep,
        start,
        end,
    } = arc;
    const dash = conf.dash ? ` stroke-dasharray="${conf.dash}"` : "";
    return `<path d="M ${start[0] * CM},${-start[1] * CM} A ${radius * CM} ${
        radius * CM
    } 0 ${large_arc ? 1 : 0} ${sweep ? 0 : 1} ${end[0] * CM},${
        -end[1] * CM
    }" fill="none" stroke="${conf.color}" stroke-width="${conf.linewidth}"${dash}/>`;
}

export function drawLabel(
    P: m.Point,
    conf: {
        label?: string;
        labelsize?: number;
        dist?: number;
        angle?: number;
        font?: string;
    },
) {
    const dist = conf.dist! / CM;
    const angle = conf.angle!;
    const x = P[0] + dist * Math.cos(angle);
    const y = P[1] + dist * Math.sin(angle);
    const label = conf.label!;
    const size = conf.labelsize!;
    let text = "";
    if (label.length == 1 || label[0].match(/[A-Z]/) == null) {
        text = label;
    } else {
        text = `${label[0]}<tspan baseline-shift="sub" font-size="${
            size * 0.7
        }">${label.slice(1)}</tspan>`;
    }
    return `<text font-size="${size}" font-family="${conf.font}" font-style="italic" text-anchor="middle" dominant-baseline="middle" x="${x}cm" y="${-y}cm">${text}</text>`;
}
