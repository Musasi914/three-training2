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

  st *= 3.0;

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

  vec2 mouse_st = uMouse * 3.0;
  float mouse_dist = length(mouse_st - st);
  m_dist = min(m_dist, mouse_dist);

//   float edge = smoothstep(0.0, 0.02, m_dist) * (1.0 - smoothstep(0.02, 0.04, m_dist));
// color = vec3(edge);
// float ripple = sin(mouse_dist * 20.0 - uTime * 5.0) * 0.5 + 0.5;
// color = vec3(ripple);

// float n = random2(st * 10.0).x;
// float distorted = m_dist + n * 0.1;
// color = vec3(distorted);

// float layer1 = smoothstep(0.0, 0.2, m_dist);
// float layer2 = sin(m_dist * 30.0 - uTime) * 0.5 + 0.5;
// color = mix(vec3(0.4), vec3(0.8), layer1 * layer2);

// float hole = smoothstep(0.1, 0.2, mouse_dist);

float contour = fract(m_dist * 8.0);
contour = smoothstep(0.0, 0.05, contour) - smoothstep(0.95, 1.0, contour);
color = vec3(contour);
// color = vec3(m_dist * hole);  // マウス付近は暗く（穴）

  // color += m_dist;

  gl_FragColor = vec4(color, 1.0);
}