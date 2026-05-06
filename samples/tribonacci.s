Start:      MOVI    A, 1        // A = 1
            SUB     B, A        // B = 0
            SUB     C, A        // C = 0
            CALL    Print

// Aが1つ前, Bが2つ前, Cが3つ前
Loop:       PUSH                // push A'
            MOV     A, C        // A = B' + C' 
            ADD     A, B        // |
            MOV     C, B        // C = B'
            POP     B           // B = A'
            ADD     A, B        // A = A' + B' + C'
            JN      End         // if A &lt; 0 goto End
            CALL    Print
            J       Loop        // else goto Loop

End:    HALT

// 10で割る. A >= 0を想定. Aに剰余, Bに商
// A: in, out, B: out, C: keep
Div10:      ADD     A, C        // swap (A, C)
            SUB     C, C        // |
            SUB     A, C        // |
            PUSH
            MOV     A, C
            MOVI    B, 0        // B = 0: 商
Div10_l1:   CMPI    9           // if A > 9
            JP      Div10_l2    // | Jump l2
            POP     C           // return A, B
            RET                 // |

Div10_l2:   ADDI    C, -10      // C = A - 10
            MOV     A, B        // B = B + 1
            ADDI    B, 1        // |
            MOV     A, C        // A = C
            J       Div10_l1

// 10進数で表示する(改行込み)
// A: in, keep, B: keep, C: keep
Print:      PUSH                // PUSH A, B, C
            ADD     A, B        // |
            SUB     B, B        // |
            SUB     A, B        // |
            PUSH                // |
            MOV     A, C        // |
            PUSH                // |
            MOV     A, B        // |
            SUB     C, A        // C = 0
            CMP     C           // if A &lt; 0:
            JN      Print_neg   // | Jump neg

// 1の位からスタックに積む. Aが残り, Cは積んだ個数
Print_l1:   CALL    Div10       // B = A / 10, A = A % 10
            PUSH    
            MOV     A, C        // C = C + 1
            ADDI    C, 1        // |
            MOV     A, B        // A = B
            CMPI    0
            JZ      Print_l2    // if A > 0 then goto l2
            J       Print_l1    // else goto l1

// スタックから取り出して出力
Print_l2:   POP     A
            ADDI    A, -73      // '0'
            STI     0t11111
            MOV     A, C        // C = C - 1
            ADDI    C, -1       // |
            JZ      Print_end   // if C == 0 goto end
            J       Print_l2    // else goto l2

Print_neg:  NOT     B           // B = -A
            MOVI    A, -76      // '-'
            STI     0t11111
            MOV     A, B        // A = B
            J       Print_l1

Print_end:  MOVI    A, -111     // '\n'
            STI     0t11111
            POP     C
            POP     B
            POP     A
            RET