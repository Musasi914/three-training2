#define PI 3.1415926535897932384626433832795

uniform vec3 uResolution;
uniform float uTime;
uniform sampler2D iChannel0; 

float plot(vec2 st, float pct){
  return  smoothstep( pct-0.01, pct, st.y) -
          smoothstep( pct, pct+0.01, st.y);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;

  float y = log(st.x) + 1.;
  // float y  = sqrt(st.x);
  // float y = ceil(sin((st.x) * 8.0)) * 0.5 + 0.5;

  vec3 color = vec3(y);

  float pct = plot(st, y);
  color = (1.0 - pct) * color + pct * vec3(0.0, 1.0, 0.0);
  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}