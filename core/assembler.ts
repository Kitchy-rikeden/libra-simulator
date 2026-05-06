import { isa } from "./isa";
import { match } from "ts-pattern";

function balanceDiv3(a: number): [number, number] {
  let m = Math.floor(a / 3);
  let r = a - m * 3;
  if (r == 2) {
    m += 1;
    r = -1;
  }

  return [m, r];
}

function numberToTernary(n: number, digits: number): string {
  const max = Math.floor(Math.pow(3, digits) / 2);
  if (n < -max || max < n) {
    throw Error("number out of ternary range");
  }

  let res: string = "";
  for (let i = 0; i < digits; i++) {
    const [m, r] = balanceDiv3(n);
    switch (r) {
      case 1:
        res = "1" + res;
        break;
      case 0:
        res = "0" + res;
        break;
      case -1:
        res = "#" + res;
        break;
    }
    n = m;
  }
  return res;
}

function readRegister(exp: string): string {
  if (exp == "A") return "1";
  else if (exp == "B") return "0";
  else if (exp == "C") return "#";
  else throw Error("register error");
}

function readImmediate(exp: string): string {
  // 10進表記
  const n = Number(exp);
  if (!Number.isNaN(n)) {
    return numberToTernary(n, 5);
  }

  // 3進表記(0t...)
  const re = /^0T([10#]{5})$/;
  const match = re.exec(exp);
  if (match === null) {
    throw Error("immediate error");
  }
  return match[1];
}

function readline(
  line: string,
  linenNmber: number
): { res: string[], label: string | null } {
  //コメントの除去, 整形
  line = line.split("//")[0].trim().toUpperCase();

  if (line.length == 0) {
    return {
      res: [],
      label: null,
    };
  }

  //ラベル
  const labelRe = /^([A-Z]\w*):/g;
  const labelRes = labelRe.exec(line);
  const label = labelRes !== null ? labelRes[1] : null;
  line = line.substring(labelRe.lastIndex).trim();

  if (line.length == 0) {
    return {
      res: [],
      label: label,
    };
  }

  //ニーモニック
  const mnemonicRe = /^([A-Z]\w*)/g;
  const mnemonicRes = mnemonicRe.exec(line);
  if (mnemonicRes === null) {
    throw Error(`mnemonic error in line ${linenNmber}`);
  }
  const mnemonic = mnemonicRes[0];
  line = line.substring(mnemonicRe.lastIndex);

  //引数
  const args = line.split(",").map((s) => s.trim());

  //引数の処理
  try {
    const inst = isa[mnemonic];
    const res = match(inst.opType)
      .with("DR", () => {
        const d = readRegister(args[0]);
        const r = readRegister(args[1]);
        const opcode = inst.opcode.replace("d", d).replace("r", r);
        return [opcode];
      })
      .with("DI", () => {
        const d = readRegister(args[0]);
        const opcode = inst.opcode.replace("d", d);
        const imm = readImmediate(args[1]);
        return [opcode, imm];
      })
      .with("D", () => {
        const d = readRegister(args[0]);
        const opcode = inst.opcode.replace("d", d);
        return [opcode];
      })
      .with("R", () => {
        const r = readRegister(args[0]);
        const opcode = inst.opcode.replace("r", r);
        return [opcode];
      })
      .with("I", () => {
        const imm = readImmediate(args[0]);
        return [inst.opcode, imm];
      })
      .with("L", () => {
        const label = args[0];
        return [inst.opcode, label];
      })
      .with("N", () => {
        return [inst.opcode];
      })
      .exhaustive();

    return {
      res: res,
      label: label,
    };
  }
  catch (error) {
    throw Error(`error in line ${linenNmber}. \nmessage: ${error}`);
  }
}

export function assemble(text: string): string[] {
  const lines = text.split("\n");

  // 各行を処理, ラベルの収集
  let result: string[] = [];
  const labelMap = new Map<string, number>();
  for (let i = 0; i < lines.length; i++) {
    const res = readline(lines[i], i + 1);
    if (res.label !== null) {
      labelMap.set(res.label, result.length - 121); //プログラムは-121から並べると仮定
    }
    result.push(...res.res);
  }

  if (result.length > 243) {
    throw Error(`Program is too long! size: ${result.length}, max: 243`);
  }
  // ラベルを即値に置き換え
  for (let i = 0; i < result.length; i++) {
    if ("10#".includes(result[i][0])) {
      continue;
    }
    const pos = labelMap.get(result[i]);
    if (pos === undefined) {
      throw Error(`Undefined label "${result[i]}".`);
    }
    result[i] = numberToTernary(pos, 5);
  }

  return result;
}
