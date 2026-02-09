precision highp float;

varying vec2 vUv;

uniform sampler2D backgroundTex;
uniform sampler2D bottleTex;
uniform sampler2D filterTex;
uniform sampler2D maskTex;
uniform sampler2D noiseTex;

uniform vec2 resolution;      // px
uniform vec2 pointerUv;       // 0..1
uniform float time;           // sec

uniform vec2 backgroundCoveredScale;
uniform vec2 filterCoveredScale;
uniform vec2 maskCoveredScale;

uniform float bottleAspect;   // w/h
uniform float bottleHeight;   // 0..1 (screen height ratio)
// 球体の位置オフセット（UV基準、0で中央）
// ※JS側で未設定でも uniform の初期値は 0 なので挙動は変わらない
uniform vec2 bubbleOffset;

vec2 coverUv(vec2 uv, vec2 coveredScale) {
  return (uv - 0.5) * coveredScale + 0.5;
}

// three.js 側で `saturate(a)` マクロが定義される場合があるため、
// 関数名は衝突しないものにする。
float sat01(float x) {
  return clamp(x, 0.0, 1.0);
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
  return mix(base, blendScreen(base, blend), clamp(opacity, 0.0, 1.0));
}

void main() {
  float screenAspect = resolution.x / max(resolution.y, 1.0);

  // --- bubble: ふわふわ浮く球体 + 縁の屈折 ---
  // 画面中心付近でゆっくり漂う（マウスは“追従”ではなく軽い影響に留める）
  vec2 floatOffset = vec2(
    sin(time * 0.35) * 0.018 + sin(time * 0.12) * 0.010,
    cos(time * 0.28) * 0.018 + sin(time * 0.16) * 0.010
  );
  vec2 mouseInfluence = (pointerUv - 0.5) * 0.02;
  vec2 bubbleCenter = vec2(0.5, 0.5) + bubbleOffset + floatOffset + mouseInfluence;

  // 球体半径（UV空間の高さ基準）
  float radius = 0.46;
  vec2 q = (vUv - bubbleCenter) * vec2(screenAspect, 1.0);
  float dist = length(q);

  // 1.0: 内側 / 0.0: 外側（エッジは少しフェード）
  float inside = smoothstep(radius, radius - 0.01, dist);
  float r01 = dist / max(radius, 1e-6);
  float z = sqrt(max(1.0 - r01 * r01, 0.0));

  // 球体法線（スクリーン空間近似）
  vec3 N = normalize(vec3(q / max(radius, 1e-6), z));
  vec3 V = vec3(0.0, 0.0, 1.0);

  // ノイズで表面を少し揺らす（“水”っぽい縁のゆらぎ）
  vec2 nUv = vUv * vec2(screenAspect, 1.0);
  float n1 = texture2D(noiseTex, nUv * 1.20 + vec2(time * 0.04, -time * 0.03)).r;
  float n2 = texture2D(noiseTex, nUv * 2.10 + vec2(-time * 0.03, time * 0.05)).r;
  float n = (n1 * 0.6 + n2 * 0.4);
  N.xy += (n - 0.5) * 0.18 * inside;
  N = normalize(N);

  // 屈折（縁ほど強く）
  float fresnel = pow(1.0 - sat01(dot(N, V)), 3.0);
  float rim = pow(1.0 - z, 2.0);
  float refStrength = (0.02 + 0.10 * rim) * inside;

  vec3 I = vec3(0.0, 0.0, -1.0);
  vec3 R = refract(I, N, 1.0 / 1.12);
  vec2 refrUv = clamp(vUv + R.xy * refStrength, 0.001, 0.999);

  vec2 uvBgBase = coverUv(vUv, backgroundCoveredScale);
  vec2 uvBgRefr = coverUv(refrUv, backgroundCoveredScale);
  vec2 uvFilter = coverUv(vUv, filterCoveredScale);

  // 軽い色ズレ（屈折のそれっぽさ）
  vec2 ca = (refrUv - vUv) * 0.9;
  vec3 bgBase = texture2D(backgroundTex, uvBgBase).rgb;
  vec3 bgR = texture2D(backgroundTex, coverUv(clamp(refrUv + ca * 0.60, 0.001, 0.999), backgroundCoveredScale)).rgb;
  vec3 bgG = texture2D(backgroundTex, uvBgRefr).rgb;
  vec3 bgB = texture2D(backgroundTex, coverUv(clamp(refrUv - ca * 0.60, 0.001, 0.999), backgroundCoveredScale)).rgb;
  vec3 bgRefr = vec3(bgR.r, bgG.g, bgB.b);

  vec3 col = mix(bgBase, bgRefr, inside * (0.55 + 0.45 * rim));

  // フィルターで少しトーン調整
  vec3 filterCol = texture2D(filterTex, uvFilter).rgb;
  col = mix(col, col * (0.70 + filterCol * 0.85), 0.30);

  // ボトルを中央に配置（スプライト的に描画）
  vec2 centered = (vUv - vec2(0.5, 0.5)) * vec2(screenAspect, 1.0);
  vec2 halfSize = vec2(bottleHeight * bottleAspect * 0.5, bottleHeight * 0.5);
  vec2 local = centered / max(halfSize, vec2(1e-6));
  vec2 uvBottle = local * 0.5 + 0.5;

  float inBottle = step(max(abs(local.x), abs(local.y)), 1.0);
  vec4 bottle = texture2D(bottleTex, uvBottle) * inBottle;

  // バブルの中で少しだけ強調（“瓶の光沢感”を出す）
  vec3 bottleLit = blendScreen(bottle.rgb, vec3(0.25 + 0.75 * n), inside * 0.25);
  col = mix(col, bottleLit, bottle.a);

  // 上から指すライト（ハイライトを上側に寄せる）
  vec3 L = normalize(vec3(0.0, 1.0, 0.8));
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 90.0);
  float diff = max(dot(N, L), 0.0);
  vec3 lightCol = vec3(1.0, 1.0, 1.0);
  col += lightCol * (spec * 0.9 + diff * 0.08) * inside;

  // 縁の“水っぽい”強調（フレネルで細いリムを作る）
  col = blendScreen(col, vec3(0.9, 1.0, 1.0), fresnel * 0.55 * inside);

  // bubble 外側は背景
  col = mix(bgBase, col, inside);

  gl_FragColor = vec4(col, 1.0);
}

