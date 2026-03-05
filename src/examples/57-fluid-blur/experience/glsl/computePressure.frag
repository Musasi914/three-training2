//  ヤコビ反復
// NOTE: `resolution` and `texturePressure` are injected

uniform sampler2D uDivergence;
uniform vec2 uPx;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  // 内部のテクスチャを自己参照しているため2px間隔が必要。他のcompute実装では1px間隔で良い。
  float p0 = texture2D(texturePressure, uv + vec2(uPx.x * 2.0, 0.0)).r;
  float p1 = texture2D(texturePressure, uv - vec2(uPx.x * 2.0, 0.0)).r;
  float p2 = texture2D(texturePressure, uv + vec2(0.0, uPx.y * 2.0)).r;
  float p3 = texture2D(texturePressure, uv - vec2(0.0, uPx.y * 2.0)).r;

  float div = texture2D(uDivergence, uv).r;

  float newP = (p0 + p1 + p2 + p3) * 0.25 - div;
  gl_FragColor = vec4(newP, 0.0, 0.0, 1.0);
}