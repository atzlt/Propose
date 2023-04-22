import { metric as m } from "../deps.ts";

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
    const dist = parseFloat(conf.dist!);
    const x = P[0] + dist * Math.cos(loc);
    const y = P[1] + dist * Math.sin(loc);
    return `<text font-family="serif" font-style="italic" text-anchor="middle" dominant-baseline="middle" x="${x}cm" y="${-y}cm">${conf.label}</text>`;
}
