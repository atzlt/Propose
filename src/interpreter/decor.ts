import { metric as m } from "../deps.ts";

const DECORATIONS: Record<string, (pos: m.Point, angle: number, size: number) => string> = {
    "|": (pos, angle, size) => {
        const x1 = pos[0] - size * Math.sin(angle);
        const y1 = pos[1] + size * Math.cos(angle);
        const x2 = pos[0] + size * Math.sin(angle);
        const y2 = pos[1] - size * Math.cos(angle);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}>`
    }
}

export function drawLabel(
    P: m.Point,
    conf: {
        decor?: string;
        decorsize?: number;
        angle?: number;
    },
) {
    return DECORATIONS[conf.decor!](P, conf.angle!, conf.decorsize!);
}
