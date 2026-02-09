// Velocity update: advect + pointer force
// NOTE: `resolution` and `textureVelocity` are injected by GPUComputationRenderer.

uniform sampler2D uVelocityPrev;
uniform float uDt;
uniform float uDissipation;

uniform vec2 uPointerUv; // 0..1
uniform vec2 uPointerDeltaUv; // UV delta
uniform float uPointerActive; // 0 or 1
uniform float uSplatRadius; // in cells
uniform float uForceStrength;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec2 fboSize = resolution.xy;
  vec2 ratio = vec2(max(fboSize.x, fboSize.y)) / fboSize;

  vec2 vel = texture2D(uVelocityPrev, uv).xy;
  vec2 backPos = uv - vel * uDt * ratio;
  backPos = clamp(backPos, vec2(0.0), vec2(1.0));

  vec2 advected = texture2D(uVelocityPrev, backPos).xy * uDissipation;

  vec2 px = 1.0 / fboSize;
  // 51はNDC(-1..1)で半径を作っているため、UV(0..1)にすると半径は /2 になる
  vec2 radiusUv = max(vec2(1e-6), uSplatRadius * px * 0.5);
  vec2 centerUv = clamp(uPointerUv, radiusUv, 1.0 - radiusUv);
  vec2 circle = (uv - centerUv) / radiusUv;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;

  vec2 force = (uPointerDeltaUv * uForceStrength) * (uPointerActive * d);

  gl_FragColor = vec4(advected + force, 0.0, 1.0);
}

