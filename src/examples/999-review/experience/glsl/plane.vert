attribute float aRandom;
attribute float aRandomTime;
attribute float aTailOffset;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uHeight;
varying float vBurst;

// [0<=x<=1]
float linearRemap(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

// xは0から1まで線形に増加
float easeOutCubic(float x, float power) {
  return 1.0 - pow(1.0 - x, power);
}

void main() {
  vec3 newPosition = position;
  float progress = uProgress * aRandomTime;

  // firework explosion
  float explosionProgress = linearRemap(0.5, 1.0, progress);
  explosionProgress = easeOutCubic(explosionProgress, 3.0);
  newPosition = newPosition * explosionProgress;

  // firework height
  float upProgress = linearRemap(0.0, 0.6, progress);
  upProgress = easeOutCubic(upProgress, 4.0);
  float downProgress = linearRemap(0.4, 1.0, progress);
  newPosition.y += upProgress * uHeight - downProgress * (uHeight / 10.0);

  // tail
  float burst = smoothstep(0.30, 0.55, progress);
  vBurst = burst;
  float tailLen = mix(6.0, 0.0, burst);
  newPosition.y -= tailLen * aTailOffset;

  // scale
  float scaleUpProgress = linearRemap(0.0, 0.6, progress);
  float scaleDownProgress = 1.0 - linearRemap(0.9, 1.0, progress);
  float scaleProgress = min(scaleUpProgress, scaleDownProgress);
  float scale = scaleProgress;

  //twinkle
  float twinkleProgress = linearRemap(0.7, 1.0, progress);
  float twinkleStrength = sin(progress * 50.0) * 0.5 + 0.5;
  float twinkle = 1.0 - twinkleProgress * twinkleStrength;

  // tail twinkle
  // atailoffsetが1に近いほどした　twinkleを強くする
  float flicker = sin(progress * 120.0 + aRandom * 20.0) * 0.5 + 0.5; // 時間で点滅

  float tailTwinkleStrength = smoothstep(0.3, 1.0, aTailOffset) * 1.0;
  float tailTwinkle = (1.0 - tailTwinkleStrength * flicker);

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

  modelPosition.x += sin(aRandom * 10.0 + progress * 25.0) * 0.1 * (1.0 - burst);
  modelPosition.z += cos(aRandom * 10.0 + progress * 25.0) * 0.1 * (1.0 - burst);
  
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  gl_PointSize = 2.0 * uResolution.y * aRandom * scale * twinkle * tailTwinkle;
  gl_PointSize *= (1.0 / -viewPosition.z);

  if(gl_PointSize < 0.1) {
    gl_Position = vec4(9999.9);
  }
}