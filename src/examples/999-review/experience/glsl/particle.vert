attribute float aZIndex;
attribute vec3 aRandom;

uniform float uTime;
uniform float uSizeProgress;
uniform float uRandomProgress;
uniform float uDepth;
uniform float uMaxDepth;
uniform float uRandom;
uniform vec3 uNoisePosOffset;
uniform vec2 uResolution;
uniform float uPointSize;
uniform float uBoxSize;

varying vec3 vPosition;
varying float vDistToCamera;
varying float vAlpha;
varying float vNoiseValue;

#define PI 3.14159265358979323846

vec4 permute(vec4 x) {
  return mod(x * x * 34.0 + x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(0.166666667, 0.33333333333);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)
    ) + i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );
  vec3 ns = 0.142857142857 * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = floor(j - 7.0 * x_) * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(
    vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
  );
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(
    0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)),
    0.0
  );
  m = m * m * m;
  return 42.0 *
    dot(m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float time = 0.0;

vec3 calcOffset(float scale) {
  float offsetRadian = aRandom.x * 2.0 * PI;
  float c = cos(offsetRadian) * scale;
  float s = sin(offsetRadian) * scale;
  return vec3(c, s, 0.0);
}

float calcNoise(vec3 noisePos) {
  float noise =
    snoise(vec3(noisePos.xy, noisePos.z * 0.2 + time) + uNoisePosOffset * 20.0) *
      0.5 +
    0.5;
  noise = smoothstep(0.4, 1.0, noise);
  noise = mix(noise, 1.0, uRandomProgress);
  return noise;
}

const float fogNear = 10.0;
const float fogFar = 3000.0;

void main() {
  time = uTime * 0.2;

  float size = mix(1.0, 0.9, uDepth);
  size = mix(size, 0.15, uSizeProgress);
  size =
    mix(
      size,
      0.0,
      smoothstep(0.5, 1.0, cos(aRandom.z * PI * 2.0 + uTime * 1.0)) *
        uRandomProgress
    );

  float alpha1 = -position.z / uMaxDepth;
  alpha1 = 1.0 - alpha1;
  alpha1 = smoothstep(
    mix(0.6, 0.0, min(1.0, uDepth * 1.4)),
    1.0,
    alpha1
  );

  vec3 pos = position;

  vec3 noisePos = pos * uBoxSize;
  float noise1 = calcNoise(noisePos);
  vNoiseValue = noise1;

  pos.z *= mix(0.0, 1.0, uDepth);
  pos =
    pos +
    calcOffset(mix(0.0, 1.0, uRandomProgress) * uPointSize * smoothstep(0.5, 0.51, aRandom.z));

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  float cameraZ = length(mvPosition.xyz);
  float fogFactor = clamp((fogFar - cameraZ) / (fogFar - fogNear), 0.0, 1.0);

  float pointScale = uResolution.y * uPointSize * noise1 * size;
  float pointScaleRandom = smoothstep(0.8, 0.81, aRandom.y);
  pointScale *= mix(1.0, pointScaleRandom, uRandomProgress);

  vAlpha = mix(alpha1, fogFactor, uRandomProgress);
  gl_PointSize = (1.0 / -mvPosition.z) * pointScale;
  gl_Position = projectionMatrix * mvPosition;

  gl_Position.z -= position.z * 0.00001;

  vDistToCamera = length(gl_Position.z);
  vPosition = pos;
}
