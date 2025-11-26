// main.tsからexamples（例の一覧）をインポート
// examplesには、01-animation、02-sphereanimationなどの情報が入っています
import { examples } from "./main";

// Routerクラス：ページの遷移（ルーティング）を管理するクラス
export class Router {
  // init()メソッド：Routerを初期化して動作を開始するメソッド
  init() {
    console.log("first");
    // ページが読み込まれた時に、現在のURLを確認して適切なページを表示
    this.handleRoute();

    // ハッシュ（URLの#以降）が変更された時のイベントを監視
    // 例：http://localhost/#01-animation のようにURLが変わった時に反応
    window.addEventListener("hashchange", () => {
      this.handleRoute();
    });

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

  // handleRoute()メソッド：現在のURLを見て、どのページを表示するか決める
  private handleRoute() {
    // window.location.pathname：現在のURLのパス部分を取得
    // 例："/src/examples/01-animation/index.html" など
    const path = window.location.pathname;

    // 既に例のページにいる場合は何もしない（無限ループ防止）
    // 例：/src/examples/01-animation/index.html にいる場合
    // この場合、このページは独自のHTMLファイルなので、Routerは関係ない
    if (path.includes("/src/examples/")) {
      return; // 何もせずに終了
    }

    // window.location.hash：URLの#以降の部分を取得
    // 例：URLが "http://localhost/#01-animation" の場合、hashは "#01-animation"
    // slice(1)で最初の#を削除して "01-animation" にする
    const hash = window.location.hash.slice(1); // #を除去

    // ハッシュがある場合（例：#01-animation）
    if (hash) {
      // examples配列から、idがhashと一致する例を探す
      // find()は配列の中から条件に合う最初の要素を見つけるメソッド
      const example = examples.find((ex) => ex.id === hash);

      // 例が見つかった場合
      if (example) {
        // その例のページに遷移する
        this.navigateToExample(example.id);
        return; // 処理を終了
      }
    }

    // 上記のどれにも該当しない場合、デフォルトで一覧ページを表示
    this.showIndex();
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
        <h1>Three.js Examples</h1>
        <div class="examples-grid">
          ${examples
            // map()：配列の各要素を変換して新しい配列を作る
            // ここでは、各例（example）をHTMLのカードに変換している
            .map(
              (example) => `
            <div class="example-card" data-example-id="${example.id}">
              <h2>${example.name}</h2>
              ${example.description ? `<p>${example.description}</p>` : ""}
              <a href="${example.path}" class="example-link">実行する</a>
            </div>
          `
            )
            // join("")：配列の要素を空文字でつなげて1つの文字列にする
            // 例：["<div>1</div>", "<div>2</div>"] → "<div>1</div><div>2</div>"
            .join("")}
        </div>
      </div>
    `;
  }

  // navigateToExample()メソッド：指定された例のページに遷移する
  private navigateToExample(exampleId: string) {
    // examples配列から、指定されたIDの例を探す
    const example = examples.find((ex) => ex.id === exampleId);

    // 例が見つからなかった場合
    if (!example) {
      // 一覧ページを表示（フォールバック）
      this.showIndex();
      return; // 処理を終了
    }

    // window.location.hrefに新しいURLを設定すると、そのページに移動する
    // 例：example.pathが "/src/examples/01-animation/index.html" の場合
    // そのページに遷移する
    window.location.href = example.path;
  }
}
