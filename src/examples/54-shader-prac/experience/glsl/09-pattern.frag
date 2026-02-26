uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

float box(in vec2 _st, in vec2 _size) {
  _size = vec2(0.5) - _size * 0.5;
  vec2 uv = smoothstep(_size,
              _size + vec2(0.001),
              _st);
  uv *= smoothstep(_size,
            _size + vec2(0.001),
            vec2(1.0) - _st);
  return uv.x * uv.y;
}

vec2 rotate(vec2 uv, float rotation, vec2 mid) {
  return vec2(
    cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
    cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
  );
}

float plot(vec2 st, float pct){
  return  smoothstep( pct-0.01, pct, st.y) -
          smoothstep( pct, pct+0.01, st.y);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st = fract(st * 2.0);
  float y = st.x;

  float pct = plot(st, y);

  // チェックの大きさ
  vec2 uv = fract(st * 6.0);

  vec3 color = vec3(pct);

  gl_FragColor = vec4(color, 1.0);
}