import { metric as m } from "../deps.ts";

const CM = 37.795;

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

export function drawArc3P(
    A: m.Point,
    B: m.Point,
    C: m.Point,
    conf: {
        color?: string;
        linewidth?: number;
        dash?: string;
    },
) {
    const [_, r] = m.circle(A, B, C);
    const x1 = B[0] - A[0];
    const x2 = C[0] - B[0];
    const y1 = B[1] - A[1];
    const y2 = C[1] - B[1];
    const large_arc = x1 * x2 + y1 * y2 > 0 ? 0 : 1;
    const sweep = x1 * y2 > x2 * y1 ? 0 : 1;
    const dash = conf.dash ? ` stroke-dasharray="${conf.dash}"` : "";
    return `<path d="M ${A[0] * CM},${-A[1] * CM} A ${r * CM} ${
        r * CM
    } 0 ${large_arc} ${sweep} ${C[0] * CM},${
        -C[1] * CM
    }" fill="none" stroke="${conf.color}" stroke-width="${conf.linewidth}"${dash}/>`;
}

export function drawLabel(
    P: m.Point,
    conf: {
        label?: string;
        labelsize?: string;
        loc?: string;
        dist?: string;
    },
) {
    const loc = parseFloat(conf.loc!);
    const dist = parseFloat(conf.dist!) / CM;
    const x = P[0] + dist * Math.cos(loc);
    const y = P[1] + dist * Math.sin(loc);
    const label = conf.label!;
    const size = parseFloat(conf.labelsize!);
    let text = "";
    if (label.length == 1 || label[0].match(/[A-Z]/) == null) {
        text = label;
    } else {
        text = `${label[0]}<tspan baseline-shift="sub" font-size="${size * 0.7}">${
            label.slice(1)
        }</tspan>`;
    }
    return `<text font-size="${size}" font-family="serif" font-style="italic" text-anchor="middle" dominant-baseline="middle" x="${x}cm" y="${-y}cm">${text}</text>`;
}
