// NOTE: "resolution", "textureVelocity" are injected
// textureVelocityは前フレームの値。今回は「投影済み速度」を読む。

// advectedが流れ。 forceはマウスの外力。
// advected + forceで、今の位置の速度が求まる。

uniform sampler2D uVelocityPrev; //前フレームの「投影済み速度」を読む
uniform float uDt;//0.016
uniform float uDissipation;//0.99

uniform vec2 uPointerUv; // 0..1
uniform vec2 uPointerDeltaUv; // UV delta
uniform float uPointerActive; // 0 or 1
uniform float uSplatRadius; // in cells //80
uniform float uForceStrength; //80

uniform bool isBFECC;

float wallInside(vec2 uv, vec2 wallUv) {
  return
    step(wallUv.x, uv.x) *
    step(wallUv.y, uv.y) *
    step(uv.x, 1.0 - wallUv.x) *
    step(uv.y, 1.0 - wallUv.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec2 fboSize = resolution.xy;
  vec2 px = 1.0 / fboSize;
  vec2 ratio = vec2(max(fboSize.x, fboSize.y)) / fboSize; //１と1.◯になる
  
  float inside = step(px.x, uv.x) * step(px.y, uv.y) * step(uv.x, 1.0 - px.x) * step(uv.y, 1.0 - px.y);

  vec2 advected;

  if(!isBFECC) {
    // 「今ここにある流体は、dt秒前にどこにいたか？」
    // → 現在位置から速度の逆方向に戻った場所(backPos)の値を読む
    vec2 vel = texture2D(uVelocityPrev, uv).xy;
    vec2 backPos = uv - vel * uDt * ratio;
    backPos = clamp(backPos, vec2(0.0), vec2(1.0));
    // 戻った位置の速度を読む dt秒前に底にあった速度が、減衰して流れてきた
    advected = texture2D(uVelocityPrev, backPos).xy * uDissipation;
  } else {
    vec2 vel_old = texture2D(uVelocityPrev, uv).xy;
    vec2 spot_old = uv - vel_old * uDt * ratio;
    vec2 vel_new1 = texture2D(uVelocityPrev, spot_old).xy;

    vec2 spot_new2 = spot_old + vel_new1 * uDt * ratio;

    vec2 error = spot_new2 - uv;

    vec2 spot_new3 = uv - error / 2.0;
    vec2 vel_2 = texture2D(uVelocityPrev, spot_new3).xy;

    vec2 spot_old2 = spot_new3 - vel_2 * uDt * ratio;
    vec2 newVel2 = texture2D(uVelocityPrev, spot_old2).xy;

    advected = newVel2 * uDissipation;
  }
  advected *= inside;

  vec2 radiusUv = max(vec2(1e-6), uSplatRadius * px * 0.5);
  vec2 centerUv = clamp(uPointerUv, radiusUv, 1.0 - radiusUv);
  vec2 circle = (uv - centerUv) / radiusUv; //中心からの距離を半径で割って正規化（半径ちょうどの一が1.0）
  float d = 1.0 - min(length(circle), 1.0); //半径の円の外側は0.0になる
  d *= d;

  vec2 force = uPointerDeltaUv * uForceStrength * uPointerActive * d;

  gl_FragColor = vec4(advected + force, 0.0, 1.0);
}