type opType_t = "DR" | "DI" | "D" | "R" | "I" | "L" | "N";

type isa_t = {
  [key: string]: {
    opType: opType_t
    opcode: string
  }
};

export const isa: isa_t = {
  AND: {
    opType: "DR",
    opcode: "1r11d",
  },
  OR: {
    opType: "DR",
    opcode: "1r1#d",
  },
  ADD: {
    opType: "DR",
    opcode: "1r01d",
  },
  MOV: {
    opType: "DR",
    opcode: "1r00d",
  },
  SUB: {
    opType: "DR",
    opcode: "1r0#d",
  },
  LD: {
    opType: "DR",
    opcode: "1r#1d",
  },
  CMP: {
    opType: "R",
    opcode: "1r#00",
  },
  ST: {
    opType: "R",
    opcode: "1r##0",
  },
  SL: {
    opType: "D",
    opcode: "0110d",
  },
  NOT: {
    opType: "D",
    opcode: "0100d",
  },
  SR: {
    opType: "D",
    opcode: "01#0d",
  },
  ANDI: {
    opType: "DI",
    opcode: "0011d",
  },
  ORI: {
    opType: "DI",
    opcode: "001#d",
  },
  ADDI: {
    opType: "DI",
    opcode: "0001d",
  },
  MOVI: {
    opType: "DI",
    opcode: "0000d",
  },
  LDI: {
    opType: "DI",
    opcode: "00#1d",
  },
  CMPI: {
    opType: "I",
    opcode: "00#00",
  },
  STI: {
    opType: "I",
    opcode: "00##0",
  },
  PUSH: {
    opType: "N",
    opcode: "0#100",
  },
  POP: {
    opType: "D",
    opcode: "0##0d",
  },
  J: {
    opType: "L",
    opcode: "#0110",
  },
  JP: {
    opType: "L",
    opcode: "#1#10",
  },
  JZ: {
    opType: "L",
    opcode: "#0#10",
  },
  JN: {
    opType: "L",
    opcode: "###10",
  },
  CALL: {
    opType: "L",
    opcode: "#0100",
  },
  RET: {
    opType: "N",
    opcode: "#0#00",
  },
  HALT: {
    opType: "N",
    opcode: "#####",
  },
} as const;
