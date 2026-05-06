// "ABCDE"と表示するプログラム
    MOVI    C, -56      // 表示文字(-56: 'A')
    MOVI    B, 5        // ループ回数
    
L1: MOV     A, C        // A = C
    STI     0t11111     // A を表示

    ADDI    C, 1        // C に次の文字
    
    MOV     A, B        // B を 1 減らす
    ADDI    B, -1       // ついでに符号レジスタもセットされる

    JP      L1          // B > 0 だったらループ
    HALT                // そうじゃなかったら終了