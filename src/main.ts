import "./style.css";
import { Router } from "./router";



// ルーターの初期化（トップページのみ）
// 例のページ（/src/examples/で始まるパス）では初期化しない
if (!window.location.pathname.includes("/src/examples/")) {
  const router = new Router();
  router.init();
}
