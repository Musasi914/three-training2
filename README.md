# Three.js Examples Collection

このプロジェクトは、Three.js の練習例を管理するマルチエントリーポイント構成の単一プロジェクトです。各例は独立したモジュールとして、独自のカメラ設定、ライティング設定を持ちます。

> **注意**: このプロジェクトは厳密な意味でのモノレポ（各パッケージが独立した`package.json`を持つ構成）ではありません。単一の`package.json`で複数の例を管理するマルチページアプリケーション構成です。

## プロジェクト構造

```
three-monorepo/
├── src/
│   ├── main.ts                 # トップページのエントリーポイント
│   ├── router.ts               # シンプルなルーティング
│   ├── style.css               # 共通スタイル
│   ├── shared/                 # 共有ユーティリティ
│   │   └── utils/
│   │       ├── EventEmitter.ts
│   │       ├── Size.ts
│   │       └── Time.ts
│   └── examples/               # 各例のディレクトリ
│       ├── 01-animation/
│       │   ├── index.html
│       │   ├── main.ts
│       │   ├── Experience.ts
│       │   ├── Camera.ts      # この例専用のカメラ設定
│       │   ├── Renderer.ts
│       │   └── World.ts       # この例専用のライト・オブジェクト
│       └── 02-sphereanimation/
│           ├── index.html
│           ├── main.ts
│           ├── Experience.ts
│           ├── Camera.ts      # 異なるカメラ設定
│           ├── Renderer.ts
│           └── World.ts       # 異なるライト設定
├── index.html                  # トップページ
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## ベストプラクティス

### 1. 各例は独立したモジュール

- 各例は `src/examples/[例名]/` ディレクトリに配置
- 各例は独自の `Experience`, `Camera`, `Renderer`, `World` を持つ
- カメラの位置、FOV、ライトの種類・強度など、各例で自由に設定可能

### 2. 共有ユーティリティ

- `src/shared/utils/` に共通で使うユーティリティを配置
- `EventEmitter`, `Size`, `Time` などは共有
- `@shared/utils/Size` のようにインポート可能（Vite の alias 設定）

### 3. 新しい例の追加方法

1. `src/examples/` 配下に新しいディレクトリを作成（例: `03-myexample/`）

2. 以下のファイルを作成：

   - `index.html` - HTML ファイル
   - `main.ts` - エントリーポイント
   - `Experience.ts` - Experience クラス
   - `Camera.ts` - カメラ設定（FOV、位置など）
   - `Renderer.ts` - レンダラー設定
   - `World.ts` - ライト、3D オブジェクトなど

3. `src/main.ts` の `examples` 配列に新しい例を追加：

```typescript
{
  id: "03-myexample",
  name: "03. My Example",
  description: "説明文",
  path: "/examples/03-myexample/index.html",
}
```

### 4. カメラ・ライトの設定例

各例の `Camera.ts` と `World.ts` で自由に設定できます：

```typescript
// Camera.ts - 例ごとに異なる設定が可能
const FOV = 75; // または 50, 60 など
const CAMERA_POSITION: [number, number, number] = [0, 0, 5]; // 自由な位置

// World.ts - 例ごとに異なるライト設定
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 強度を変える
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```

## 技術スタック

- **Three.js** - 3D グラフィックスライブラリ
- **TypeScript** - 型安全な開発
- **GSAP** - アニメーション
- **Vite** - ビルドツール
- **lil-gui** - GUI デバッグツール

## 開発時の注意点

- React は使用していません（Vanilla TypeScript + Three.js）
- 各例は完全に独立しているため、他の例に影響を与えません
- 共有したいロジックは `src/shared/` に配置してください
