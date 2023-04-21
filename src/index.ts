import { parseFlags } from "./deps.ts";
import interpret from "./interpreter/interpreter.ts";

const { flags } = parseFlags(Deno.args, {
    flags: [
        {
            name: "in",
            aliases: ["i"],
            type: "string",
        },
        {
            name: "out",
            aliases: ["o"],
            type: "string",
            optionalValue: true,
        },
        {
            name: "width",
            aliases: ["w"],
            equalsSign: true,
            value: (val, _) => parseFloat(val),
            default: 300,
            type: "number",
        },
        {
            name: "height",
            aliases: ["h"],
            equalsSign: true,
            value: (val, _) => parseFloat(val),
            default: 300,
            type: "number",
        },
    ]
});

if (!flags.out) {
    flags.out = flags.in.replace(".prs", ".svg");
}

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();
const input = decoder.decode(Deno.readFileSync(flags.in));
const output = interpret(input, { width: flags.width, height: flags.height });
Deno.writeFileSync(flags.out, encoder.encode(output));
