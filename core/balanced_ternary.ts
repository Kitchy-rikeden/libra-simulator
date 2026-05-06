export class BalancedTernary {
    static strToInt(s: string): number {
        // 先頭の0を取り除く
        while (s.length >= 2 && s[0] === "0") {
            s = s.slice(1);
        }

        let n: number;
        if (s[0] === "0") {
            return 0;
        } else if (s[0] === "1") {
            n = 1;
        } else if (s[0] === "#") {
            n = -1;
        } else {
            throw new Error("Invalid character in input string");
        }

        s = s.slice(1);
        while (s.length > 0) {
            n *= 3;
            if (s[0] === "0") {
                n += 0;
            } else if (s[0] === "1") {
                n += 1;
            } else if (s[0] === "#") {
                n += -1;
            } else {
                throw new Error("Invalid character in input string");
            }

            s = s.slice(1);
        }

        return n;
    }

    static intToStr(n: number): string {
        let base = 1;

        while (true) {
            const [m, _] = balancedDiv(n, base * 3);
            if (m === 0) {
                break;
            }
            base *= 3;
        }

        let res = "";
        while (base >= 1) {
            const [m, r] = balancedDiv(n, base);
            if (m === -1) {
                res += "#";
            } else {
                res += String(m);
            }

            n = r;
            base = Math.floor(base / 3);
        }

        return res;
    }

    static intToAscii(n: number): string {
        const u = n + 121;  // 下駄をはかせてunsignedに
        // if (u === 0) {  // NULL
        //     return "\\0";
        // }
        // else if (u === 13) {   // CR
        //     return "\\r";
        // }
        // else if (0x20 <= u && u <= 127) {
        //     return String.fromCharCode(u);
        // }
        // else {  // 範囲外、非対応制御文字は空文字を返す
        //     return "";
        // }
        if (u <= 127) {
            return String.fromCharCode(u);
        }
        else {
            return "□"
        }
    }

    static asciiToInt(c: string): number {
        return c.charCodeAt(0) - 121;
    }
}

export function balancedDiv(a: number, b: number): [number, number] {
    /**
     * ret -> [m, r]
     * a = b * m + r
     * -b//2 <= r <= b//2 (bが偶数の時は下は<)
     */
    let sign = 1;
    if (a < 0) {
        sign = -1;
        a *= -1;
    }
    let m = Math.floor(a / b);
    let r = a % b;
    if (r > Math.floor(b / 2)) {
        r -= b;
        m += 1;
    }
    return [m * sign, r * sign];
}