// main.tsからexamples（例の一覧）をインポート
// examplesには、01-animation、02-sphereanimationなどの情報が入っています
// 例の一覧を定義（ここに新しい例を追加していく）
export type ExampleInfo = {
  id: string;
  name: string;
  description?: string;
  path: string;
};

export const examples: ExampleInfo[] = [
  {
    id: "01-animation",
    name: "01. mixamoアニメーション",
    description: "モデルとアニメーション",
    path: "/src/examples/01-animation/index.html",
  },
  {
    id: "02-mouse",
    name: "02. Mouse",
    description: "マウス",
    path: "/src/examples/02-mouse/index.html",
  },
  {
    id: "03-stable-fluids",
    name: "03. Stable Fluids",
    description: "流体",
    path: "/src/examples/03-stable-fluids/index.html",
  },
  {
    id: "04-galaxy",
    name: "04. 銀河",
    description: "銀河",
    path: "/src/examples/04-galaxy/index.html",
  },
  {
    id: "05-woman-sphere",
    name: "05. Woman Sphere",
    description: "球体をもつ女性",
    path: "/src/examples/05-woman-sphere/index.html",
  },
  {
    id: "06-glsl-practice",
    name: "06. GLSL Practice with Plane",
    description: "シェーダーの練習。planeに色々glsl関数使って描画",
    path: "/src/examples/06-glsl-practice/index.html",
  },
  {
    id: "07-wave",
    name: "07. 波",
    description: "Wave",
    path: "/src/examples/07-wave/index.html",
  },
  {
    id: "08-light-shading",
    name: "08. Light Shading",
    description: "シェーダーでライト",
    path: "/src/examples/08-light-shading/index.html",
  },
  {
    id: "09-wave-improved",
    name: "09. 波パターン",
    description: "waveパターン。背景に面白そう",
    path: "/src/examples/09-wave-improve/index.html",
  },
  {
    id: "10-wave-improved2",
    name: "10. 波パターン2",
    description: "Waveパターン",
    path: "/src/examples/10-wave-improve2/index.html",
  },
  {
    id: "11-material-overload",
    name: "11. Material Overload",
    description:
      "onBeforeCompileでの書き換えと、depthShaderMaterialでの影の更新",
    path: "/src/examples/11-material-overload/index.html",
  },
  {
    id: "12-material-overload2",
    name: "12. Material Overload2",
    description:
      "onBeforeCompileでの書き換えと、depthShaderMaterialでの影の更新",
    path: "/src/examples/12-material-overload-play/index.html",
  },
  {
    id: "13-wobbly",
    name: "13. ぐにゃぐにゃ球体",
    description: "Wobbly",
    path: "/src/examples/13-wobbly/index.html",
  },
  {
    id: "14-firework",
    name: "14. 花火",
    description: "Firework",
    path: "/src/examples/14-firework/index.html",
  },
  {
    id: "15-earth",
    name: "15. 地球",
    description: "Earth",
    path: "/src/examples/15-earth/index.html",
  },
  {
    id: "16-manual-light",
    name: "16. カメラのmanual",
    description: "チュートリアルライト",
    path: "/src/examples/16-manual-light/index.html",
  },
  {
    id: "17-cursor",
    name: "17. Cursorアクション",
    description: "canvas2dを用いてマウス移動でアクションを起こす",
    path: "/src/examples/17-cursor/index.html",
  },
  {
    id: "18-skinnedmesh",
    name: "18. SkinnedMesh",
    description: "SkinnedMeshを使用してモデルを動かす",
    path: "/src/examples/18-skinnedmesh/index.html",
  },
  {
    id: "19-land",
    name: "19. Land",
    description: "Land",
    path: "/src/examples/19-land/index.html",
  },
  {
    id: "20-transformplane",
    name: "20. Transform Plane",
    description: "Transform Plane",
    path: "/src/examples/20-transformplane/index.html",
  },
  {
    id: "21-shadow",
    name: "21. Shadow",
    description: "three.js manual shadow",
    path: "/src/examples/21-shadow/index.html",
  },
  {
    id: "22-morph",
    name: "22. Morph",
    description: "Morph",
    path: "/src/examples/22-morph/index.html",
  },
  {
    id: "23-manual-render-target",
    name: "23. Manual Render Target",
    description: "Manual Render Target",
    path: "/src/examples/23-manual-render-target/index.html",
  },
];

// Routerクラス：ページの遷移（ルーティング）を管理するクラス
export class Router {
  // init()メソッド：Routerを初期化して動作を開始するメソッド
  init() {
    // 初期表示の判定
    // ・ハッシュがない（#がない）
    // ・かつ、例のページにいない（/src/examples/を含まない）
    // の場合は、トップページ（一覧）を表示
    if (
      !window.location.hash &&
      !window.location.pathname.includes("/src/examples/")
    ) {
      this.showIndex();
    }
  }

  // showIndex()メソッド：トップページ（例の一覧）を表示する
  private showIndex() {
    // document.querySelector("#app")：HTMLの中からid="app"の要素を探す
    // この要素に一覧ページの内容を表示する
    const app = document.querySelector("#app");

    // app要素が見つからなかった場合は何もしない（エラー防止）
    if (!app) return;

    // innerHTML：要素の中身（HTML）を設定するプロパティ
    // バッククォート（`）を使うと、複数行の文字列を書ける（テンプレートリテラル）
    app.innerHTML = `
      <div class="index-container">
        <h1>Three.js 練習場</h1>
        <div class="examples-grid">
          ${examples
            // map()：配列の各要素を変換して新しい配列を作る
            // ここでは、各例（example）をHTMLのカードに変換している
            .map(
              (example) => `
            <a href="${example.path}" class="example-card" data-example-id="${
                example.id
              }">
              <h2>${example.name}</h2>
              ${example.description ? `<p>${example.description}</p>` : ""}
            </a>
          `
            )
            // join("")：配列の要素を空文字でつなげて1つの文字列にする
            // 例：["<div>1</div>", "<div>2</div>"] → "<div>1</div><div>2</div>"
            .join("")}
        </div>
      </div>
    `;
  }
}
