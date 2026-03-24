uniform vec2 uResolution;
uniform float uTime;

// ============================================================
// 【フラクタル (Fractal) とは】
// 部分を拡大すると全体と同じ形が現れる「自己相似」な図形。
// 例: コッホ曲線、マンデルブロ集合、このシェーダーの反復模様
//
// このシェーダーの仕組み:
// 1. UV座標を「折り返し(abs)」→「ずらし(-s)」→「回転」を繰り返す
// 2. 繰り返すたびに空間が細かく分割され、フラクタル模様になる
// 3. 最後に中心付近に円を描く
// ============================================================

const int MAX_ITERATIONS = 6;  // 反復回数（増やすと細かく、重くなる）

// 最後に描く円のサイズ。反復回数に合わせて調整
float circleSize = 1.0 / (3.0 * pow(2.0, float(MAX_ITERATIONS)));

/**
 * 点 mid を中心に uv を rotation ラジアン回転
 */
vec2 rotate(vec2 uv, float rotation, vec2 mid) {
  return vec2(
    cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
    cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
  );
}

void main() {
  // --- UV正規化: 中心(0,0)、アスペクト比補正 [-0.5,0.5] の範囲 ---
  vec2 uv = gl_FragCoord.xy / uResolution.xy - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  // --- 全体の回転（時間でアニメーション）---
  uv = rotate(uv, uTime, vec2(0.0));

  // ちょっと拡大
  uv *=2.0;

  // --- フラクタル生成: 折り返し→ずらし→回転 を繰り返す ---
  // これを繰り返すと、空間が再帰的に細分化されフラクタル模様になる
  float offset = 0.3;  // ずらし量（反復ごとに小さくなる）
  for (int i = 0; i < MAX_ITERATIONS; i++) {
    uv = abs(uv) - offset;           // 折り返してからずらす → 対称な領域を作る
    uv = rotate(uv, uTime, vec2(0.0));  // 回転で複雑さを加える
    offset /= 2.1;                  // 次の反復ではより細かく
  }

  // --- 円を描く（中心付近の点を白に）---
  float dist = length(uv);
  float circle = (dist < circleSize) ? 1.0 : 0.0;

  gl_FragColor = vec4(vec3(circle), 1.0);
}
