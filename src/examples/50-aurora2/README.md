Part 5: `aurora()` — レイマーチングで空間に配置

src/examples/50-aurora2/experience/glsl/aurora.frag lines 55-62

vec4 aurora(vec3 rayDirection) {
vec4 accumulatedColorAlpha = vec4(0.0);
vec4 smoothedSampleColorAlpha = vec4(0.0);
// ...
for(int i = 0; i < 16; i++) {
// ...
}
}

レイパラメータの計算（レイのどの位置をサンプルするか）

src/examples/50-aurora2/experience/glsl/aurora.frag lines 70-73

      float rayJitterOffset = 0.006 * pixelJitter * smoothstep(0.0, 15.0, fi);
      float stepIndexWarp = fi * sqrt(fi) * 0.65;
      float rayParameter = (0.5 + stepIndexWarp * 0.002) / (rayDirection.y * 2.0);
      rayParameter -= rayJitterOffset;

• fi _ sqrt(fi): ステップが進むほど間隔が広がる（等間隔ではなく、手前は密・奥は疎）
• / (rayDirection.y _ 2.0): 上を向いているレイほど短い距離で空に到達。水平に近いレイは遠くまで伸びる（遠近感）
• pixelJitter: ピクセルごとにランダムなオフセット → バンディング（縞模様アーティファクト）を防ぐ

サンプル位置でノイズを評価

src/examples/50-aurora2/experience/glsl/aurora.frag lines 76-77

      vec3 sampleWorldPosition = rayParameter * rayDirection;
      float noiseStrength = triNoise2d(sampleWorldPosition.zx * uScale, rotationMatrix);

• rayParameter \* rayDirection でレイ上の 3D 座標を得る
• .zx（水平面の座標）でノイズを評価 → オーロラは「上空に水平に広がるカーテン」なので、xz 平面でサンプルする

色の決定

src/examples/50-aurora2/experience/glsl/aurora.frag lines 80-83

      float stepProgress = fi / max(1.0, float(16 - 1));
      vec3 auroraColor = mix(uColor1, uColor2, smoothstep(0.0, 0.4, stepProgress));
      auroraColor = mix(auroraColor, uColor3, smoothstep(0.4, 0.8, stepProgress));
      auroraColor = mix(auroraColor, uColor4, smoothstep(0.8, 1.0, stepProgress));

ステップの進行度（0→1）で 4 色をグラデーション。手前のレイヤーと奥のレイヤーで色が変わる →
オーロラ特有の多色のカーテン表現。

蓄積とスムージング

src/examples/50-aurora2/experience/glsl/aurora.frag lines 87-90

      smoothedSampleColorAlpha = mix(smoothedSampleColorAlpha, sampleColorAlpha, 0.5);
      accumulatedColorAlpha += smoothedSampleColorAlpha * attenuation * smoothstep(0.0, 5.0, fi);
      attenuation *= attenuationStep; // 奥ほど寄与が小さくなる

• mix(..., 0.5): 前のサンプルと今のサンプルを半々で混ぜる → 隣接レイヤー間を滑らかに（急激な変化を防ぐ）
• smoothstep(0.0, 5.0, fi): 最初の数ステップはフェードイン（手前がいきなり明るくならない）
• attenuation \*= attenuationStep: 指数関数的減衰。奥のレイヤーほど暗くなる

地平線フェード

src/examples/50-aurora2/experience/glsl/aurora.frag lines 95-96

    accumulatedColorAlpha *= smoothstep(0.0, uHfade, rayDirection.y);
    return accumulatedColorAlpha * uBrightness;

• rayDirection.y が小さい（地平線に近い）ほどフェードアウト → 地面付近でオーロラが消える自然な表現

────────────────────────────────────────

まとめ: 全体の仕組み

カメラ → レイ方向(vRd) → 16 段スライス → 各スライスで triNoise2d を評価
↓
ノイズ値 × 色 × 減衰 を蓄積
↓
空のグラデーション + オーロラを合成

特に重要な概念は 3 つ:

1. 三角波ノイズ (`triNoise2d`) — Perlin ノイズの代わりに三角波を重ねてカーテン状のパターンを作る
2. レイマーチング — 視線方向に沿って空間をサンプリングし、色を蓄積する
3. 指数減衰 + スムージング — 奥のレイヤーを暗くし、隣接レイヤーを滑らかに繋いで自然な見た目に

わからない部分や、もっと深掘りしたい箇所はありますか？たとえば triNoise2d の各オクターブの変化を図で追いたい、m2
行列の意味をもっと知りたい、など何でもどうぞ。

これ全部理解できたほうが良い？

正直に言うと、全部を同じ深さで理解する必要はないです。
レベル分けするとこうなります:

────────────────────────────────────────

必ず理解すべき（汎用的な基礎）

• レイの方向を求める仕組み（vRd = modelPosition.xyz - cameraPosition）
• `smoothstep` / `mix` による色の補間
• レイマーチングの基本構造（ループでレイ上の点をサンプリング → 蓄積）
• 指数減衰 (`attenuation *= step`) の考え方
• `fract` / `abs` で波形を作る考え方（tri 関数）

これらは他のシェーダーでも何度も使う汎用テクニックです。

────────────────────────────────────────

理解しておくと良い（中級）

• `.zx`で水平面をサンプルする理由（オーロラは空に水平に広がるから）
• ジッター（`pixelJitter`）でバンディングを防ぐテクニック
• プリマルチプライドアルファでの加算合成（col += aur.rgb \* aur.a）
• fBM（fractal Brownian Motion）の概念（ノイズを複数オクターブ重ねる）

────────────────────────────────────────

深追いしなくていい（作者の「味付け」）

• triNoise2d 内の具体的なマジックナンバー（1.85, 0.75, 29.0, 1.3 など）
• m2 の固定回転角度が何度かとか
• p _= 1.21 + (rz - 1.0) _ 0.02 のフィードバック係数の意味

これらは作者が見た目を調整しながらチューニングした値です。数学的な必然性があるわけではなく、「こうしたら綺麗だった」と
いう結果です。仕組みの概念（「座標をワープしている」「フィードバックで複雑さを出している」）だけ分かっていれば十分です
。
