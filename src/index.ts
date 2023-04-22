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
    ]
});

if (!flags.out) {
    flags.out = flags.in.replaceAll(".prs", ".svg");
}

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();
const input = decoder.decode(Deno.readFileSync(flags.in));
const output = interpret(input, {});
Deno.writeFileSync(flags.out, encoder.encode(output));
