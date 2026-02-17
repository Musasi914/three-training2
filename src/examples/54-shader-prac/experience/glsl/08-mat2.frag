uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

mat2 get2dRotateMatrix(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

mat2 get2dScaleMatrix(vec2 _scale) {
  return mat2(_scale.x, 0.0, 0.0, _scale.y);
}

float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size,
                        _size+vec2(0.001),
                        _st);
    uv *= smoothstep(_size,
                    _size+vec2(0.001),
                    vec2(1.0)-_st);
    return uv.x*uv.y;
}

float makeCross(in vec2 _st, float _size){
    return  box(_st, vec2(_size,_size/4.)) +
            box(_st, vec2(_size/4.,_size));
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  vec3 color = vec3(0.0);

  vec2 translate = vec2(cos(uTime), sin(uTime));
  st += translate * 0.35;

  st -= vec2(0.5);
  st = st * get2dRotateMatrix(sin(uTime) * PI);
  st += vec2(0.5);

  st -= vec2(0.5);
  st = st * get2dScaleMatrix(vec2(sin(uTime) + 1.0));
  st += vec2(0.5);

  color = vec3(st.x, st.y, 0.0);

  color += vec3(makeCross(st,0.25));

  gl_FragColor = vec4(color, 1.0);
}