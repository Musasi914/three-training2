uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

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

  st *= 10.0;
  vec2 ipos = floor(st);
  vec2 fpos = fract(st);

  vec2 tile = truchetPattern(fpos, random(ipos));

  float color = 0.0;

  color = smoothstep(tile.x - 0.1, tile.x, tile.y) - 
           smoothstep(tile.x, tile.x + 0.1, tile.y);

  gl_FragColor = vec4(vec3(color), 1.0);
}