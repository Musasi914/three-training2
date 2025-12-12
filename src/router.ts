// main.tsからexamples（例の一覧）をインポート
// examplesには、01-animation、02-sphereanimationなどの情報が入っています
import { examples } from "./main";

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
            <a href="${example.path}" class="example-card" data-example-id="${example.id}">
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
