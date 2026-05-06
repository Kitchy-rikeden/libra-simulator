// 入力ポートから読んだ値をそのまま出力するプログラム
        MOVI    B, 0t11111
start:  LD      A, B
        ST      B
        J       start
