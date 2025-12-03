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
    name: "06. shader patterns",
    description: "GLSL Practice with Plane",
    path: "/src/examples/06-glsl-practice/index.html",
  },
];

// ルーターの初期化（トップページのみ）
// 例のページ（/src/examples/で始まるパス）では初期化しない
if (!window.location.pathname.includes("/src/examples/")) {
  const router = new Router();
  router.init();
}
