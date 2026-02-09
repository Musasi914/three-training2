// Projection step: v' = v - grad(p) * dt
// NOTE: `resolution` and `textureVelocityProj` are injected by GPUComputationRenderer.

uniform sampler2D uVelocity;
uniform sampler2D uPressure;
uniform vec2 uPx;
uniform float uDt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  float p0 = texture2D(uPressure, uv + vec2(uPx.x, 0.0)).r;
  float p1 = texture2D(uPressure, uv - vec2(uPx.x, 0.0)).r;
  float p2 = texture2D(uPressure, uv + vec2(0.0, uPx.y)).r;
  float p3 = texture2D(uPressure, uv - vec2(0.0, uPx.y)).r;

  vec2 v = texture2D(uVelocity, uv).xy;
  vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
  v = v - gradP * uDt;

  gl_FragColor = vec4(v, 0.0, 1.0);
}

