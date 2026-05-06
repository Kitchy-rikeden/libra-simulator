import { match, P } from "ts-pattern";
import { balancedDiv, BalancedTernary as BT } from "./balanced_ternary";

type btChar = "1" | "0" | "#";
type t5 = number;
type snap = {
    pc: number,
    sp: number,
    sign: btChar,
    a: number,
    b: number,
    c: number,
};
export type stepInfo = {
    opname: string,
    description: string,
    snap: snap,
};

function getByT5<T>(array: T[], address: t5): T {
    const index = address + 121;
    if (index < 0 || index >= array.length) {
        throw Error(`Address out of range! size: ${array.length}, index: ${index}`);
    }
    return array[index];
}

function setByT5<T>(array: T[], address: t5, value: T): void {
    const index = address + 121;
    if (index < 0 || index >= array.length) {
        throw Error(`Address out of range! size: ${array.length}, index: ${index}`);
    }
    array[index] = value;
}

function btCharToReg(c: string): string {
    return c === "1" ? "A" :
        c === "0" ? "B" :
            "C";
}

class ALU {
    static add(a: t5, b: t5): t5 {
        const [_, r] = balancedDiv(a + b, 243); // -121 ~ 121に制限
        return r;
    }
    static sub(a: t5, b: t5): t5 {
        const [_, r] = balancedDiv(a - b, 243);
        return r;
    }
    static and(a: t5, b: t5): t5 {
        const sa = BT.intToStr(a).padStart(5, "0");
        const sb = BT.intToStr(b).padStart(5, "0");
        let s = "";
        for (let i = 0; i < 5; i++) {
            if (sa[i] === "#" || sb[i] === "#") {
                s += "#";
            }
            else if (sa[i] === "0" || sb[i] === "0") {
                s += "0";
            }
            else {
                s += "1";
            }
        }
        return BT.strToInt(s);
    }
    static or(a: t5, b: t5): t5 {
        const sa = BT.intToStr(a).padStart(5, "0");
        const sb = BT.intToStr(b).padStart(5, "0");
        let s = "";
        for (let i = 0; i < 5; i++) {
            if (sa[i] === "1" || sb[i] === "1") {
                s += "1";
            }
            else if (sa[i] === "0" || sb[i] === "0") {
                s += "0";
            }
            else {
                s += "#";
            }
        }
        return BT.strToInt(s);
    }
    static not(a: t5): t5 {
        return -a;
    }
    static sl(a: t5): t5 {
        const [_, r] = balancedDiv(a * 3, 243);
        return r;
    }
    static sr(a: t5): t5 {
        const x = Math.trunc(a / 3);    // ゼロ方向に切り捨て
        const [_, r] = balancedDiv(x, 243);
        return r;
    }
}

export class Core {
    pc: t5;
    sp: t5;
    sign: btChar;
    reg: {
        a: t5;
        b: t5;
        c: t5;
    };
    memory: {
        inst: string[];
        heap: t5[];
        stack: t5[];
    }

    output: (v: t5) => void;
    input: () => t5;

    constructor(program: string, output: (v: t5) => void, input: () => t5) {
        this.pc = -121;
        this.sp = -121;
        this.sign = "0";
        this.reg = {
            a: 0,
            b: 0,
            c: 0,
        };

        this.memory = {
            inst: program.split("\n"),
            heap: Array(243).fill(0),
            stack: Array(243).fill(0),
        };

        this.output = output;
        this.input = input;
    }

    getReg(r: btChar): t5 {
        return match(r)
            .with("1", () => this.reg.a)
            .with("0", () => this.reg.b)
            .with("#", () => this.reg.c)
            .exhaustive();
    }

    setReg(d: btChar, v: t5): void {
        match(d)
            .with("1", () => this.reg.a = v)
            .with("0", () => this.reg.b = v)
            .with("#", () => this.reg.c = v)
            .exhaustive();
    }

    snap(): snap {
        return {
            pc: this.pc,
            sp: this.sp,
            sign: this.sign,
            a: this.reg.a,
            b: this.reg.b,
            c: this.reg.c,
        };
    }

    step(): stepInfo {
        let res: stepInfo = {
            opname: "",
            description: "",
            snap: {
                pc: 0,
                sp: 0,
                sign: "0",
                a: 0,
                b: 0,
                c: 0,
            }
        };
        const op = getByT5(this.memory.inst, this.pc);
        match(op)
            // OP2, OP2I命令
            .with(P.string.regex(/^(1[10#]|00)[10].[10#]$/), () => {
                const a = this.reg.a;
                const immFlag = op[0] == "0";
                let ri: t5;
                if (immFlag) {
                    const imm = getByT5(this.memory.inst, this.pc + 1);
                    ri = BT.strToInt(imm);
                }
                else {
                    ri = this.getReg(op[1] as btChar);
                }

                // タプル化する関数
                const t: (s: string, t: string, v: number) => [string, string, number]
                    = (s, t, v) => [s, t, v]

                let [opname, opsym, v] = match(op.substring(2, 4))
                    .with("11", () => t("AND", "&", ALU.and(a, ri)))
                    .with("1#", () => t("OR", "|", ALU.or(a, ri)))
                    .with("01", () => t("ADD", "+", ALU.add(a, ri)))
                    .with("00", () => t("MOV", "", ri))
                    .with("0#", () => t("SUB", "-", ALU.sub(a, ri)))
                    .otherwise(() => t("undefined", "", 0));

                if (opname === "undefined") {
                    throw Error(`Invalid opcode ${op}`);
                }

                this.setReg(op[4] as btChar, v);
                this.sign = v > 0 ? "1" : v == 0 ? "0" : "#";
                if (immFlag) {
                    this.pc += 2;
                }
                else {
                    this.pc += 1;
                }

                // info
                const destReg = btCharToReg(op[4]);
                const srcReg = btCharToReg(op[1]);
                if (opname == "MOV") {
                    if (immFlag) {
                        res.opname = "MOVI";
                        res.description = `${destReg} = ${ri}`;
                    }
                    else {
                        res.opname = "MOV";
                        res.description = `${destReg} = ${srcReg}`;
                    }
                }
                else {
                    if (immFlag) {
                        res.opname = opname + "I";
                        res.description = `${destReg} = A ${opsym} ${ri}`;
                    }
                    else {
                        res.opname = opname;
                        res.description = `${destReg} = A ${opsym} ${srcReg}`;
                    }
                }
            })

            // LD, LDI
            .with(P.string.regex(/^(1[10#]|00)#1[10#]$/), () => {
                const immFlag = op[0] == "0";
                let ri: t5;
                if (immFlag) {
                    const imm = getByT5(this.memory.inst, this.pc + 1);
                    ri = BT.strToInt(imm);
                }
                else {
                    ri = this.getReg(op[1] as btChar);
                }

                let v: t5;
                // address 121 は MMIO
                if (ri == 121) {
                    v = this.input();
                }
                else {
                    v = getByT5(this.memory.heap, ri);
                }

                this.setReg(op[4] as btChar, v);
                if (immFlag) {
                    this.pc += 2;
                }
                else {
                    this.pc += 1;
                }

                // info
                const destReg = btCharToReg(op[4]);
                const srcReg = btCharToReg(op[1]);
                if (immFlag) {
                    res.opname = "LDI";
                    res.description = `${destReg} = mem[${ri}]`;
                }
                else {
                    res.opname = "LD";
                    res.description = `${destReg} = mem[${srcReg}]`;
                }
            })

            // CMP, CMPI
            .with(P.string.regex(/^(1[10#]|00)#0.$/), () => {
                const immFlag = op[0] == "0";
                const a = this.reg.a;
                let ri: t5;
                if (immFlag) {
                    const imm = getByT5(this.memory.inst, this.pc + 1);
                    ri = BT.strToInt(imm);
                }
                else {
                    ri = this.getReg(op[1] as btChar);
                }
                const v = ALU.sub(a, ri);    // TODO: オーバーフローのことを考えて実機の実装変えなきゃ

                this.sign = v > 0 ? "1" : v == 0 ? "0" : "#";
                if (immFlag) {
                    this.pc += 2;
                }
                else {
                    this.pc += 1;
                }

                // info
                const srcReg = btCharToReg(op[1]);
                if (immFlag) {
                    res.opname = "CMPI";
                    res.description = `A - ${ri}`;
                }
                else {
                    res.opname = "CMP";
                    res.description = `A - ${srcReg}`;
                }
            })

            // ST, STI
            .with(P.string.regex(/^(1[10#]|00)##.$/), () => {
                const immFlag = op[0] == "0";
                const a = this.reg.a;
                let ri: t5;
                if (immFlag) {
                    const imm = getByT5(this.memory.inst, this.pc + 1);
                    ri = BT.strToInt(imm);
                }
                else {
                    ri = this.getReg(op[1] as btChar);
                }

                // address 121 は MMIO
                if (ri == 121) {
                    this.output(a);
                }
                else {
                    setByT5(this.memory.heap, ri, a);
                }

                if (immFlag) {
                    this.pc += 2;
                }
                else {
                    this.pc += 1;
                }

                // info
                const srcReg = btCharToReg(op[1]);
                if (immFlag) {
                    res.opname = "STI";
                    res.description = `mem[${ri}] = A`;
                }
                else {
                    res.opname = "ST";
                    res.description = `mem[${srcReg}] = A`;
                }
            })

            // OP1命令
            .with(P.string.regex(/^01[10#].[10#]$/), () => {
                const a = this.reg.a;

                // タプル化する関数
                const t: (s: string, v: number) => [string, number]
                    = (s, v) => [s, v];
                const [opname, v] = match(op[2] as btChar)
                    .with("1", () => t("SL", ALU.sl(a)))
                    .with("0", () => t("NOT", ALU.not(a)))
                    .with("#", () => t("SR", ALU.sr(a)))
                    .exhaustive();

                this.setReg(op[4] as btChar, v);
                this.sign = v > 0 ? "1" : v == 0 ? "0" : "#";
                this.pc += 1;

                // info
                const destReg = btCharToReg(op[4]);
                res.opname = opname;
                if (opname == "SL") {
                    res.description = `${destReg} = A << 1`;
                }
                else if (opname == "NOT") {
                    res.description = `${destReg} = ~A`;
                }
                else {
                    res.description = `${destReg} = A >> 1`;
                }
            })

            // PUSH
            .with(P.string.regex(/^0#1..$/), () => {
                setByT5(this.memory.stack, this.sp, this.reg.a);
                this.sp += 1;

                this.pc += 1;

                // info
                res.opname = "PUSH";
                res.description = "PUSH(A)";
            })

            // POP
            .with(P.string.regex(/^0##.[10#]$/), () => {
                this.sp -= 1;
                const v = getByT5(this.memory.stack, this.sp);

                this.setReg(op[4] as btChar, v);
                this.pc += 1;

                // info
                res.opname = "POP";
                const destReg = btCharToReg(op[4]);
                res.description = `${destReg} = POP()`;
            })

            // J
            .with(P.string.regex(/^#.11.$/), () => {
                const imm = getByT5(this.memory.inst, this.pc + 1);
                const imm_n = BT.strToInt(imm);
                this.pc = imm_n;

                // info
                res.opname = "J";
                res.description = `PC = ${imm_n}`;
            })

            // JC
            .with(P.string.regex(/^#[10#]#1.$/), () => {
                const imm = getByT5(this.memory.inst, this.pc + 1);
                const imm_n = BT.strToInt(imm);

                if (this.sign === op[1]) {  // 条件成立
                    this.pc = imm_n;
                }
                else {
                    this.pc += 2;
                }

                // info
                res.opname = (op[1] === "1") ? "JP" :
                    (op[1] === "0") ? "JZ" : "JN";
                res.description = `if (sign == ${op[1]}) PC = ${imm_n}`;
            })

            // Call
            .with(P.string.regex(/^#.10.$/), () => {
                const imm = getByT5(this.memory.inst, this.pc + 1);
                const imm_n = BT.strToInt(imm);
                setByT5(this.memory.stack, this.sp, this.pc + 2);
                this.sp += 1;

                this.pc = imm_n;

                // info
                res.opname = "CALL";
                res.description = `PUSH(PC+2); PC = ${imm_n}`;
            })

            // Ret
            .with(P.string.regex(/^#.#0.$/), () => {
                this.sp -= 1;
                const v = getByT5(this.memory.stack, this.sp);

                this.pc = v;

                // info
                res.opname = "RET";
                res.description = `PC = POP()`;
            })

            // Halt
            .with(P.string.regex(/^#####$/), () => {
                res.opname = "HALT";
                res.description = "HALT";
            })

            .otherwise(() => {
                throw Error(`Invalid opcode ${op}`);
            });

        res.snap = this.snap();
        return res;
    }
}

