import "./style.css";
import { Router } from "./router";

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
    name: "01. Animation",
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
    name: "04. Galaxy",
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
    name: "07. Wave",
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
    name: "09. Wave Improved",
    description: "waveパターン。背景に面白そう",
    path: "/src/examples/09-wave-improve/index.html",
  },
  {
    id: "10-wave-improved2",
    name: "10. Wave Improved2",
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
  }
];

// ルーターの初期化（トップページのみ）
// 例のページ（/src/examples/で始まるパス）では初期化しない
if (!window.location.pathname.includes("/src/examples/")) {
  const router = new Router();
  router.init();
}
