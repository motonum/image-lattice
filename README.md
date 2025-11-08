# Image Lattice

Image Lattice は、ブラウザ上で画像を格子（グリッド）に配置・編集し、ラベル付けや並べ替えを行った上で1枚の PNG に合成してダウンロードできる軽量なツールです。

## 概要

行数・列数を指定してグリッドを生成し、各セルに画像をドラッグ＆ドロップまたはファイル選択で追加できます。セル内の画像をドラッグして入れ替えたり、ラベルを編集したりできます。TIFF ファイルの読み込みもサポートしており、最終的にグリッド全体を 1 枚の PNG としてダウンロードできます。

## 主な機能

- 行×列で定義するグリッドの生成
- 各セルへの画像追加（ドラッグ＆ドロップ / ファイル選択）
- セルごとのラベル編集
- セルの並べ替え（ドラッグ操作）
- TIFF 画像の読み取り（`utif` を利用してデコード）
- 画像の削除や複数ファイルの一括配置
- グリッドを合成して PNG としてエクスポート

## 技術スタック

- フロントエンド: Vite + React + TypeScript
- ドラッグ＆ドロップ: @dnd-kit/core / @dnd-kit/sortable
- スタイリング: Tailwind CSS
- UIコンポーネント: shadcn/ui
- TIFF デコード: utif
- トースト/通知: sonner
- テスト: Vitest

## 主要ファイル

- `src/components/Grid.tsx` — グリッド表示、セル描画、DnD のハンドリング、ファイル読み込み（TIFF と標準画像）
- `src/components/NumericInput.tsx` — 数値入力コンポーネント（整数モード、最小/最大、負数拒否などをサポート）
- `src/components/ExportDialog.tsx` — グリッド合成・ダウンロード UI
- `src/components/ui/*` — 再利用可能な UI コンポーネント（Input, Button など）
- `src/lib/utils.ts` / `src/types/cell.ts` — ユーティリティ関数と型定義

## データ契約（簡易）

- CellItem: `id: string` が必須。画像がある場合は `src`（blob/data URL）、`fileName`、`width`、`height`、`label` を持つことが想定されます。
- グリッドは `rows`, `cols`, `cells: CellItem[]` を親から受け取り、`updateCell`/`replaceCells` で状態を更新します。

## ユーザーフロー

1. Rows/Cols を指定してグリッドを生成
2. セルに画像をドラッグ＆ドロップ、または「Select File」で追加
3. ラベルを編集したり、セル同士をドラッグして並べ替え
4. Export ダイアログから PNG を生成・ダウンロード

## 開発 / ビルド / テスト

依存関係をインストールして開発サーバを起動する:

```bash
npm install
npm run dev
```

プロダクションビルド:

```bash
npm run build
npm run preview
```

テスト (Vitest) の使用例:

- devDependencies に `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` を追加します。
- テストを実行するには:

```bash
npm run test
npm run test:watch
```

テストファイルは `src/**/__tests__/*.test.tsx` のように配置し、DOM API が必要な場合は `jsdom` 環境を利用してください。`src/setupTests.ts` に `@testing-library/jest-dom` を import しておくと便利です。

## 注意点 / 改善案

- 大きな TIFF や大量の画像を扱うとメモリ消費が増えるため、必要に応じてダウンサンプリングやストリーミング処理を検討してください。
- DnD の挙動は `@dnd-kit` に依存しているため、モバイルでの操作性（タッチ）を検証・改善することを推奨します。
- blob URL を使う箇所では不要になったら `URL.revokeObjectURL` で解放していますが、漏れがないか確認してください。

## 貢献

PR・Issue歓迎です。変更は main ブランチに対して PR を作成してください。
