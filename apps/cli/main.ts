import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { match } from "ts-pattern";
import * as fs from "fs";
import { assemble } from "../../core/assembler";
import { BalancedTernary as BT } from "../../core/balanced_ternary";
import { Core } from "../../core/simulator";

type format = "ternary" | "decimal" | "ascii";
const EOF_ERROR_MESSAGE = "EOF";

function isFormat(value: string): value is format {
    return value === "ternary" || value === "decimal" || value === "ascii";
}

function makeReader(text: string, fmt: format): () => number {
    let values: number[] = [];
    match(fmt)
        .with("ternary", () => {
            const lines = text ? text.split(/\r?\n/) : [];
            values = lines.map(BT.strToInt);
        })
        .with("decimal", () => {
            const lines = text ? text.split(/\r?\n/) : [];
            values = lines.map(Number);
        })
        .with("ascii", () => {
            for (let i = 0; i < text.length; i++) {
                const n = BT.asciiToInt(text[i]);
                values.push(n);
            }
        })
        .exhaustive();
    let i = 0;
    return () => {
        if (i >= values.length) {
            throw new Error(EOF_ERROR_MESSAGE);
        }
        return values[i++];
    };
}

function readStdinByteOrEof(): string | undefined {
    const buffer = Buffer.alloc(1);
    const bytesRead = fs.readSync(0, buffer, 0, 1, null);
    if (bytesRead === 0) {
        return undefined;
    }
    return buffer.toString("utf-8", 0, bytesRead);
}

function readStdinByte(): string {
    const c = readStdinByteOrEof();
    if (c === undefined) {
        throw new Error(EOF_ERROR_MESSAGE);
    }
    return c;
}

function readStdinLine(): string {
    let line = "";
    while (true) {
        const c = readStdinByteOrEof();
        if (c === undefined) {
            if (line.length === 0) {
                throw new Error(EOF_ERROR_MESSAGE);
            }
            return line.endsWith("\r") ? line.slice(0, -1) : line;
        }
        if (c === "\n") {
            return line.endsWith("\r") ? line.slice(0, -1) : line;
        }
        line += c;
    }
}

function makeStdinReader(fmt: format): () => number {
    return () => match(fmt)
        .with("ternary", () => BT.strToInt(readStdinLine()))
        .with("decimal", () => Number(readStdinLine()))
        .with("ascii", () => BT.asciiToInt(readStdinByte()))
        .exhaustive();
}

function isEofError(e: unknown): boolean {
    return e instanceof Error && e.message === EOF_ERROR_MESSAGE;
}

function makeWriter(outputPath: string | undefined, fmt: format): (value: number) => void {
    let stream: fs.WriteStream | NodeJS.WriteStream;
    if (outputPath) {
        stream = fs.createWriteStream(outputPath, { encoding: "utf-8" });
    }
    else {
        stream = process.stdout;
    }

    return (value: number) => {
        const s = match(fmt)
            .with("ternary", () => BT.intToStr(value, 5) + "\n")
            .with("decimal", () => value.toString() + "\n")
            .with("ascii", () => BT.intToAscii(value))
            .exhaustive();
        stream.write(s);
    };
}

function othelloDebug(mem: number[]) {
    console.log("    A B C D E F G H");
    for (let row = 0; row < 10; row++) {
        let items: string[] = [row.toString()];
        for (let col = 0; col < 9; col++) {
            const pos = row * 9 + col;
            const cell = mem[pos + 121];
            items.push(cell == 1 ? "w" : cell == -1 ? "B" : cell == 0 ? " " : cell.toString());
        }
        console.log(items.join(" "));
    }
}

function main() {
    const argv = yargs(hideBin(process.argv))
        .usage("$0 <program file> [--asm] [--snap] [-i <in port file>] [--ifmt <format>] [-o <out port file>] [--ofmt <format>]")
        .positional("program", {
            describe: "program file",
            type: "string"
        })
        .option("asm", {
            type: "boolean",
            default: false,
            describe: "enable asm mode"
        })
        .option("snap", {
            type: "boolean",
            default: false,
            describe: "enable snapshot mode"
        })
        .option("i", {
            alias: "input",
            type: "string",
            describe: "input file. stdin is used if omitted",
        })
        .option("ifmt", {
            type: "string",
            default: "ternary",
            describe: "input file format"
        })
        .option("o", {
            alias: "output",
            type: "string",
            describe: "output file",
        })
        .option("ofmt", {
            type: "string",
            default: "ternary",
            describe: "output file format"
        })
        .option("othello", {
            type: "boolean",
            default: false,
            describe: "enable othello mode"
        })
        .parseSync();

    // 引数チェック
    if (typeof (argv._[0]) !== "string") {
        console.log("Please specify program file.");
        return;
    }
    if (!isFormat(argv.ofmt) || !isFormat(argv.ifmt)) {
        console.log('format must be "ternary" or "decimal" or "ascii"');
        return;
    }

    // 入力プログラム
    const program_file = argv._[0];
    const program_text = fs.readFileSync(program_file, { encoding: "utf-8" });
    const program = argv.asm ? assemble(program_text).join("\n") : program_text;

    // 入力関数
    const input_func = argv.i === undefined
        ? makeStdinReader(argv.ifmt)
        : makeReader(fs.readFileSync(argv.i, { encoding: "utf-8" }), argv.ifmt);

    // 出力関数
    let output_func = makeWriter(argv.o, argv.ofmt);
    let othelloFlag = false;
    if (argv.othello) {
        output_func = (value: number) => {
            const c = BT.intToAscii(value);
            process.stdout.write(c);
            if (c == '\n') {
                othelloFlag = true;
            }
        };
    }

    // シミュレータ
    const core = new Core(program, output_func, input_func);

    if (argv.snap) {
        console.log("opname,description,pc,sp,sign,a,b,c");
    }
    try {
        while (true) {
            const info = core.step();
            if (argv.snap) {
                const log = [
                    info.opname,
                    info.description,
                    info.snap.pc,
                    info.snap.sp,
                    info.snap.sign,
                    info.snap.a,
                    info.snap.b,
                    info.snap.c
                ].join(",");
                console.log(log)
            }
            if (info.opname === "HALT") {
                break;
            }
            if (othelloFlag) {
                othelloFlag = false;
                othelloDebug(core.memory.heap);
            }
        }
    }
    catch (e) {
        if (!isEofError(e)) {
            throw e;
        }
        console.error("EOF");
    }
    console.log("");    // flush 用
}

main()
