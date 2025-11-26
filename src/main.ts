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
    description: "基本的なアニメーションの例",
    path: "/src/examples/01-animation/index.html",
  },
  {
    id: "02-sphereanimation",
    name: "02. Sphere Animation",
    description: "球体のアニメーション例",
    path: "/src/examples/02-sphereanimation/index.html",
  },
];

// ルーターの初期化（トップページのみ）
// 例のページ（/src/examples/で始まるパス）では初期化しない
if (!window.location.pathname.includes("/src/examples/")) {
  const router = new Router();
  router.init();
}
