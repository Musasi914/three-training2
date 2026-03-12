attribute vec2 aCenter;
attribute vec2 aUvOffset;
attribute float aRandom;

uniform float uPointerActive;
uniform vec2 uPointer;
uniform vec2 uTileUvSize;
uniform float uPointerRadius;
uniform float uPointerLift;
uniform float uFlipProgress;

varying vec2 vTileUv;
varying float vFlip;

float easeInOutCubic(float x) {
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) * 0.5;
}

void main() {
  vTileUv = aUvOffset + uv * uTileUvSize;

  vec2 tileCenterUv = aUvOffset + 0.5 * uTileUvSize;
  float pointerDist = distance(tileCenterUv, uPointer);
  float pointerPower = 1.0 - smoothstep(0.0, uPointerRadius, pointerDist);
  pointerPower *= uPointerActive;

  float delay = aRandom * 0.45;
  float localProgress = clamp((uFlipProgress - delay) / (1.0 - 0.45), 0.0, 1.0);
  localProgress = easeInOutCubic(localProgress);
  vFlip = localProgress;

  float angle = localProgress * 3.141592653589793;
  float cosA = cos(angle);
  float sinA = sin(angle);

  vec3 transformed = position;
  float x = transformed.x;
  float z = transformed.z;
  transformed.x = x * cosA - z * sinA;
  transformed.z = x * sinA + z * cosA;
  transformed.z += pointerPower * uPointerLift;
  transformed.xy += aCenter;

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
