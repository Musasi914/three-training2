uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

float random (in float x) { return fract(sin(x)*1e4); }
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec2 truchetPattern(vec2 _st, float _index) {
  _index = fract((_index - 0.5) * 2.0);

  if(_index > 0.75) {
    _st = vec2(1.0) - _st;
  } else if(_index > 0.5) {
    _st = vec2(1.0 - _st.x, _st.y);
  } else if(_index > 0.25) {
    _st = 1.0 - vec2(_st.x, 1.0 - _st.y);
  }
  return _st;
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;

  // Grid
  vec2 grid = vec2(50.0, 25.0);
  st *= grid;

  vec2 ipos = floor(st);

  vec2 vel = floor(vec2(10.0 + uTime * 10.0));
  vel *= vec2(-1.0, 0.0);

  vel *= (step(1.0, mod(ipos.y, 2.0)) - 0.5) * 2.0;
  vel *= random(ipos.y);

  // 100%
  float totalCells = grid.x * grid.y;
  float t = mod(uTime * max(grid.x, grid.y) + floor(1.0 + uTime), totalCells);
  vec2 head = vec2(mod(t, grid.x), floor(t / grid.x));

  vec3 color = vec3(1.0);
  color *= step(grid.y - head.y, ipos.y);
  color += (1.0 - step(head.x, ipos.x)) * step(grid.y - head.y, ipos.y + 1.0);
  color = clamp(color, vec3(0.0), vec3(1.0));

  vec2 offset = vec2(0.1, 0.0);
  color.r *= random(floor(st + vel + offset));
  color.g *= random(floor(st + vel));
  color.b *= random(floor(st + vel - offset));

  // color = smoothstep(0.0, 0.5, color * color);
  color = step(0.5, color);

  color *= step(0.1, fract(st.x + vel.x)) * step(0.1, fract(st.y + vel.y));
  
  gl_FragColor = vec4(color, 1.0);
}