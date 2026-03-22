uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uTime;

vec2 random2(vec2 p) {
  return fract(sin(vec2(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3))
  )) * 43758.5453);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;

  vec3 color = vec3(0.0);

  st *= 5.0;

  vec2 i_st = floor(st);
  vec2 f_st = fract(st);

  float m_dist = 1.0;

  for (int j = -1; j <= 1; j++) {
    for(int i = -1; i <= 1; i++) {
      vec2 neighbor = vec2(float(i), float(j));

      vec2 offset = random2(i_st + neighbor);
      offset = sin(uTime + offset * 6.2346) * 0.5 + 0.5;

      vec2 pos = neighbor + offset - f_st;
      float dist = length(pos);

      m_dist = min(m_dist, dist * m_dist);
    }
  }

  color += step(0.06, m_dist);

  gl_FragColor = vec4(color, 1.0);
}