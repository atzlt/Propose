import { parseFlags } from "./deps.ts";
import { Interpreter } from "./interpreter/mod.ts";

const VERSION = "v0.1.0-alpha";

function main() {
    const { flags } = parseFlags(Deno.args, {
        flags: [
            {
                name: "in",
                aliases: ["i"],
                type: "string",
                optionalValue: true,
            },
            {
                name: "out",
                aliases: ["o"],
                type: "string",
                optionalValue: true,
            },
            {
                name: "version",
                aliases: ["v"],
                standalone: true,
            },
            {
                name: "autolabel",
                aliases: ["L"],
                type: "boolean",
            },
        ],
    });

    if (flags.version) {
        console.log(`Propose ${VERSION}`);
    } else if (flags.in) {
        if (!flags.out) {
            flags.out = flags.in.replaceAll(".prs", ".svg");
        }
        const decoder = new TextDecoder("utf-8");
        const encoder = new TextEncoder();
        const input = decoder.decode(Deno.readFileSync(flags.in));
        const interpreter = new Interpreter(false, {
            autolabel: flags.autolabel,
        });
        interpreter.interpret(input);
        Deno.writeFileSync(flags.out, encoder.encode(interpreter.emit()));
    } else {
        console.log(`This is the Propose REPL, version ${VERSION}.`);
        const interpreter = new Interpreter(true, {
            autolabel: flags.autolabel,
        });
        while (true) {
            const line = prompt(">");
            if (line != null && line.trim() == "exit") break;
            if (line == null || line.trim() == "") continue;
            try {
                interpreter.interpret(line);
            } catch (e) {
                console.log(e.message);
                continue;
            }
            console.log();
        }
    }
}

try {
    main();
} catch (e) {
    console.log(e.message);
}
