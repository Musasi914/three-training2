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

  st *= 30.0;

  vec2 i_st = floor(st);
  vec2 f_st = fract(st);

  float m_dist = 1.0;

  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = random2(i_st + neighbor);
      point = sin(uTime + point * 6.3465) * 0.5 + 0.5;

      vec2 diff = neighbor + point - f_st;
      float dist = length(diff);

      m_dist = min(m_dist, dist);
    }
  }

  color += m_dist;

  gl_FragColor = vec4(color, 1.0);
}