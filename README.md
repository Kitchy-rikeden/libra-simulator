# libra-simulator

Libra the Processor のシミュレータ

ブログでのブラウザ上での実行と Node でのローカル実行

## 環境構築

- Node, npm のインストール
- `npm install`

## ローカル

### 実行

`npx tsx apps/cli/main.ts <program file> [--asm] [--snap] [-i <in port file>] [--ifmt <format>] [-o <out port file>] [--ofmt <format>]`

- program file: アセンブリ後の機械語ファイル.
- asm: 指定した場合は program file がアセンブリ前のファイルとして解釈する.
- snap: 指定した場合は 1 命令ごとのスナップを標準出力に出力する.
- in port file: 入力命令で読むファイル. フォーマットは機械語ファイルと同じ.
- out port file: 出力命令で書くファイル. 指定しない場合は標準出力に出力する.
- format: ファイルの形式. `ternary`, `decimal`, `ascii` のいずれか. デフォルトは `ternary`.

## ウェブ

### テスト

`npm run dev:web`

### デプロイ

[Notion memo](https://www.notion.so/wordpress-react-144dc1b02bf180ed929ef8682b228157)
