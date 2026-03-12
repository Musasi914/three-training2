uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795

vec2 rotate(vec2 uv, float rotation, vec2 mid) {
  return vec2(
    cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
    cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
  );
}

vec2 tile(vec2 _st, float _zoom) {
  _st *= _zoom;

  return fract(_st);
}

vec2 rotateTilePattern(vec2 _st) {
  _st *= 2.0;

  float index = 0.0;
  index += step(1.0, mod(_st.x, 2.0));
  index += step(1.0, mod(_st.y, 2.0)) * 2.0;

  _st = fract(_st);

  if(index == 1.0) {
    _st = rotate(_st, PI * 0.5, vec2(0.5));
  } else if(index == 2.0) {
    _st = rotate(_st, PI * -0.5, vec2(0.5));
  } else if(index == 3.0) {
    _st = rotate(_st, PI, vec2(0.5));
  }

  return _st;
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;

  
  st = tile(st, 3.0);
  st = rotateTilePattern(st);
  
  st = rotate(st, -PI*uTime* 0.25, vec2(0.5));

  gl_FragColor = vec4(vec3(step(st.x, st.y)), 1.0);
}