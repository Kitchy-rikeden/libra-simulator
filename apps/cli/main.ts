import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { match } from "ts-pattern";
import fs from "fs";
import { assemble } from "../../core/assembler";
import { BalancedTernary as BT } from "../../core/balanced_ternary";
import { Core } from "../../core/simulator";

type format = "ternary" | "decimal" | "ascii";

function isFormat(value: string): value is format {
    return value === "ternary" || value === "decimal" || value === "ascii";
}

function makeReader(text: string, fmt: format): () => number {
    let values: number[];
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
            throw new Error("No more input");
        }
        return values[i];
    };
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
            .with("ternary", () => BT.intToStr(value) + "\n")
            .with("decimal", () => value.toString() + "\n")
            .with("ascii", () => BT.intToAscii(value))
            .exhaustive();
        stream.write(s);
    };
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
            describe: "input file",
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
    const input_text = argv.i === undefined ? "" : fs.readFileSync(argv.i, { encoding: "utf-8" });
    const input_func = makeReader(input_text, argv.ifmt);

    // 出力関数
    const output_func = makeWriter(argv.o, argv.ofmt);

    // シミュレータ
    const core = new Core(program, output_func, input_func);

    if (argv.snap) {
        console.log("opname,description,pc,sp,sign,a,b,c");
    }
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
    }
    console.log("");    // flush 用
}

main()