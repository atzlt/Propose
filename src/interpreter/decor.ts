import { metric as m } from "../deps.ts";
import { CM } from "./draw.ts";

const DECORATIONS: Record<
    string,
    (pos: m.Point, conf: {
        decorsize?: number;
        decorangle?: number;
        decorwidth?: number;
        decorcolor?: string;
        decorfill?: string;
    }) => string
> = {
    "|": (pos, conf) => {
        const size = conf.decorsize!;
        const angle = conf.decorangle!;
        const x1 = pos[0] * CM - size * Math.sin(angle);
        const y1 = pos[1] * CM + size * Math.cos(angle);
        const x2 = pos[0] * CM + size * Math.sin(angle);
        const y2 = pos[1] * CM - size * Math.cos(angle);
        return `<line x1="${x1}" y1="${-y1}" x2="${x2}" y2="${-y2}" stroke="${conf
            .decorcolor!}" stroke-width="${conf.decorwidth!}"/>`;
    },
    "||": (pos, conf) => {
        const size = conf.decorsize!;
        const angle = conf.decorangle!;
        let [x, y] = pos;
        x = x * CM;
        y = y * CM;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const gap = size / 3;
        const x1 = x - gap * cos - size * sin;
        const y1 = y - gap * sin + size * cos;
        const x2 = x - gap * cos + size * sin;
        const y2 = y - gap * sin - size * cos;
        const x3 = x + gap * cos - size * sin;
        const y3 = y + gap * sin + size * cos;
        const x4 = x + gap * cos + size * sin;
        const y4 = y + gap * sin - size * cos;
        return `<line x1="${x1}" y1="${-y1}" x2="${x2}" y2="${-y2}" stroke="${conf
            .decorcolor!}" stroke-width="${conf
            .decorwidth!}"/><line x1="${x3}" y1="${-y3}" x2="${x4}" y2="${-y4}" stroke="${conf
            .decorcolor!}" stroke-width="${conf.decorwidth!}"/>`;
    },
    ">": (pos, conf) => {
        const size = conf.decorsize!;
        const angle = conf.decorangle!;
        let [x, y] = pos;
        x = x * CM;
        y = y * CM;
        const x0 = x + size * Math.cos(angle);
        const y0 = y + size * Math.sin(angle);
        const x1 = x + size * Math.cos(angle + Math.PI * 2 / 3);
        const y1 = y + size * Math.sin(angle + Math.PI * 2 / 3);
        const x2 = x + size * Math.cos(angle - Math.PI * 2 / 3);
        const y2 = y + size * Math.sin(angle - Math.PI * 2 / 3);
        return `<line x1="${x0}" y1="${-y0}" x2="${x1}" y2="${-y1}" stroke="${conf
            .decorcolor!}" stroke-width="${conf
            .decorwidth!}"/><line x1="${x0}" y1="${-y0}" x2="${x2}" y2="${-y2}" stroke="${conf
            .decorcolor!}" stroke-width="${conf.decorwidth!}"/>`;
    },
};

export function drawDecor(
    pos: m.Point,
    conf: {
        decor?: string;
        decorsize?: number;
        decorangle?: number;
    },
) {
    return DECORATIONS[conf.decor!](pos, conf);
}
