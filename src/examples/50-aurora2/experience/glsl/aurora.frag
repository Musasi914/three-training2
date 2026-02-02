varying vec3 vRd;
uniform float uBrightness;
uniform float uDecay;
uniform float uSpeed;
uniform float uScale;
uniform float uHfade;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform float uTime;

const int AURORA_STEPS = 24;
const int AURORA_OCTAVES = 3;

mat2 get2dRotateMatrix(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}
mat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);

float tri(float x){ return clamp(abs(fract(x)-.5), 0.01, 0.49); }
vec2  tri2(vec2 p){ return vec2(tri(p.x)+tri(p.y), tri(p.y+tri(p.x))); }

float triNoise2d(vec2 p, mat2 rot) {
  float z  = 1.8;
  float z2 = 2.5;
  float rz = 0.0;

  p *= get2dRotateMatrix(p.x * 0.06);
  vec2 bp = p;

  for (int i = 0; i < AURORA_OCTAVES; i++) {
    vec2 dg = tri2(bp * 1.85) * 0.75;
    dg *= rot;
    p -= dg / z2;

    bp *= 1.3;
    z2 *= 0.45;
    z  *= 0.42;
    p  *= 1.21 + (rz - 1.0) * 0.02;

    rz += tri(p.x + tri(p.y)) * z;
    p *= -m2;
  }

  return clamp(1.0 / pow(rz * 29.0, 1.3), 0.0, 0.55);
}

float hash21(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec4 aurora(vec3 rayDirection) {
  // ---- 出力（RGBA）を積算していく ----
  // accumulatedColorAlpha: これまでのサンプルを足し込んだ最終結果（色+α）
  vec4 accumulatedColorAlpha = vec4(0.0);
  // smoothedSampleColorAlpha: 各サンプルを少し平均化して、急な変化（ノイズのチラつき）を抑える
  vec4 smoothedSampleColorAlpha = vec4(0.0);

  // ---- 模様の「流れ」：ノイズ座標の回転（時間で回す） ----
  // uSpeed を上げると回転が速くなり、オーロラが流れて見える
  mat2 rotationMatrix = get2dRotateMatrix(uTime * uSpeed);

  // ---- 奥行き方向の減衰（ボリューム積分の重み） ----
  // attenuation: 現在ステップの寄与の重み（最初は少し抑えた値から開始）
  float attenuation = exp2(-2.5);
  // attenuationStep: 1ステップ進むごとに attenuation に掛ける倍率（uDecay が大きいほど早く減衰）
  float attenuationStep = exp2(-uDecay);

  // ---- バンディング対策のピクセルごとの微小揺らぎ（同一ピクセル内では一定） ----
  float pixelJitter = hash21(gl_FragCoord.xy);

  // ---- ここが「簡易レイマーチ」：rayDirection 方向に何回もサンプルして足し込む ----
  for (int i = 0; i < AURORA_STEPS; i++) {
    float stepIndexFloat = float(i);

    // ピクセルごとの微小ずらし量（縞模様を減らす）。ステップ序盤ほど効かせる。
    float rayJitterOffset =
      0.006 * pixelJitter * smoothstep(0.0, 15.0, stepIndexFloat);

    // 48っぽい「上空に向かって層を積む」サンプル位置
    // stepIndexWarp: ステップが進むほど非線形に増える（層の配置を少し歪めて自然に見せる）
    float stepIndexWarp = stepIndexFloat * sqrt(stepIndexFloat) * 0.65;
    // rayParameter: レイ上のどこをサンプルするか（距離のようなパラメータ）
    float rayParameter =
      (0.8 + stepIndexWarp * 0.002) / (rayDirection.y * 2.0 + 0.4);
    rayParameter -= rayJitterOffset;

    // サンプル点（rayDirection に沿って進んだ位置）
    vec3 sampleWorldPosition = rayParameter * rayDirection;
    // 2Dノイズ（筋っぽい模様の強度）。zx 平面に投影して模様を作る。
    float noiseStrength =
      triNoise2d(sampleWorldPosition.zx * uScale, rotationMatrix); // 48と同じ zx

    // ステップ進行度（0..1）。色グラデーションの参照に使う。
    float stepProgress =
      stepIndexFloat / max(1.0, float(AURORA_STEPS - 1));
    // オーロラの色：uColor1→uColor4 を段階的に混ぜて決める
    vec3 auroraColor = mix(uColor1, uColor2, smoothstep(0.0, 0.4, stepProgress));
    auroraColor = mix(
      auroraColor,
      uColor3,
      smoothstep(0.4, 0.8, stepProgress)
    );
    auroraColor = mix(
      auroraColor,
      uColor4,
      smoothstep(0.8, 1.0, stepProgress)
    );

    // サンプルの色とα（αは強度そのものを使う）
    vec4 sampleColorAlpha = vec4(auroraColor * noiseStrength, noiseStrength);

    // サンプルを少し平滑化してから足し込む（チラつき軽減）
    smoothedSampleColorAlpha = mix(smoothedSampleColorAlpha, sampleColorAlpha, 0.5);
    // 最終的な足し込み（序盤だけフェードイン、奥ほど減衰させる）
    accumulatedColorAlpha +=
      smoothedSampleColorAlpha * attenuation * smoothstep(0.0, 5.0, stepIndexFloat);
    attenuation *= attenuationStep;

    // もうほぼ見えない寄与になったら打ち切り（軽量化）
    if (attenuation < 1e-4) break; // 48でも入れてる系の軽量化
  }

  // ---- 上空フェード：地平線付近（rayDirection.y が小さい）では消す ----
  accumulatedColorAlpha *= smoothstep(0.0, uHfade, rayDirection.y); // 上空フェード
  // ---- 全体の明るさ調整 ----
  return accumulatedColorAlpha * uBrightness;
}

// vec4 aurora(vec3 rayDirection) {
//   vec3 accumulatedColor = vec3(0.0);
//   float accumulatedAlpha = 0.0;

//   float attenuation = 0.2;
//   float attenuationStep = 0.9;

//   for(int i = 0; i < 16; i++) {
//     float sampleStrength = 1.0;

//     accumulatedColor += vec3(0.2, 0.8, 1.0) * sampleStrength * attenuation;
//     accumulatedAlpha += sampleStrength * attenuation;

//     attenuation *= attenuationStep; // 奥ほど寄与が小さくなる
//   }
  
//   float skyFactor = smoothstep(0.0, 0.4, rayDirection.y);
//   return vec4(accumulatedColor * skyFactor, accumulatedAlpha * skyFactor); 
// }

void main() {
  vec3 rd = normalize(vRd);
  vec3 col = vec3(0.0);

  // 空の色
  vec3 bg = mix(uSkyBottom, uSkyTop, smoothstep(0.0, 1.0, rd.y + .2));
  col += bg;

  // オーロラ
  vec4 aur = aurora(rd);
  col += aur.rgb * aur.a;
  
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}