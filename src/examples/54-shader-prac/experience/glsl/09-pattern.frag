uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

vec2 brickTile(vec2 _st, float _zoom) {
  _st *= _zoom;

  // 奇数行に0.5を足す
  // _st.x += step(1.0, mod(_st.y, 2.0)) * 0.5;

  if(fract(uTime) > 0.5) {
    if(fract(_st.y * 0.5) > 0.5) {
      _st.x += fract(uTime) * 2.0;
    } else {
      _st.x -= fract(uTime) * 2.0;
    }
  } else {
    if(fract(_st.x * 0.5) > 0.5) {
      _st.y += fract(uTime) * 2.0;
    } else {
      _st.y -= fract(uTime) * 2.0;
    }
  }

  return fract(_st);
}

float box(vec2 _st, vec2 _size) {
  _size = vec2(0.5) - _size * 0.5;
  vec2 uv = smoothstep(_size, _size + vec2(1e-4), _st);
  uv *= smoothstep(_size, _size + vec2(1e-4), vec2(1.0) - _st);

  return uv.x * uv.y;
}

float circle(in vec2 _st, in float _radius) {
  vec2 l = _st - vec2(0.5);
  return 1.0 - smoothstep(
    _radius - (_radius * 0.01),
    _radius + (_radius * 0.01),
    dot(l, l) * 4.0
  );
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  vec3 color = vec3(0.0);

  st = brickTile(st, 5.0);

  color = vec3(1.0 - circle(st, 0.3));

  // color = vec3(st, 0.0);

  gl_FragColor = vec4(color, 1.0);
}