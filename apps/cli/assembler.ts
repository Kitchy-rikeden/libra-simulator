import { assemble } from "../../core/assembler";
import * as fs from "fs";

function main() {
    const programPath = process.argv[2];
    if (programPath === undefined) {
        console.error("Usage: assemble <program file>");
        process.exit(1);
    }

    const programText = fs.readFileSync(programPath, { encoding: "utf-8" });
    const machineCode = assemble(programText);
    process.stdout.write(machineCode.join("\n") + "\n");
}

main();
