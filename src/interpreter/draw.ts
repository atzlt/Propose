import { metric as m } from "../deps.ts";

export function drawSegment(
    A: m.Point,
    B: m.Point,
    conf: {
        color?: string,
        linewidth?: number,
    },
) {
    return `<line x1="${A[0]}cm" y1="${A[1]}cm" x2="${B[0]}cm" y2="${B[1]
        }cm" stroke="${conf.color}" stroke-width="${conf.linewidth}"/>`;
}

export function drawCircle(
    c: m.Circle,
    conf: {
        fill?: string,
        color?: string,
        linewidth?: number,
    },
) {
    return `<circle cx="${c[0][0]}cm" cy="${c[0][1]}cm" r="${c[1]
        }cm" stroke="${conf.color
        }" fill="${conf.fill
        }" stroke-width="${conf.linewidth
        }"/>`;
}

export function drawDot(
    P: m.Point,
    conf: {
        color?: string,
        dotsize?: number,
    },
) {
    return `<circle cx="${P[0]}cm" cy="${P[1]}cm" r="${conf.dotsize}" fill="${conf.color}"/>`;
}
