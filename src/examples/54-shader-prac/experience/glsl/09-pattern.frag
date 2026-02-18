uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

float stripe(float x, float center, float width) {
  return 1.0 - smoothstep(width, width + 0.01, abs(x - center));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;

  // チェックの大きさ
  vec2 st = fract(uv * 6.0);

  // 縦線2本、横線2本
  float v = stripe(st.x, 0.5, 0.06);
  float h = stripe(st.y, 0.40, 0.06);

  v = clamp(v, 0.0, 1.0);
  h = clamp(h, 0.0, 1.0);

  vec3 base = vec3(0.08, 0.10, 0.14); // 背景（濃紺）
  vec3 vCol  = vec3(0.75, 0.15, 0.18); // 縦（赤）
  vec3 hCol  = vec3(0.12, 0.35, 0.75); // 横（青）

  vec3 color = base;
  color = mix(color, vCol, v * 0.8);
  color = mix(color, hCol, h * 0.8);

  // 交点を少し明るくしてチェック感アップ
  color += 0.15 * (v * h);

  gl_FragColor = vec4(color, 1.0);
}