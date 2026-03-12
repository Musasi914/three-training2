uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;

  st *= 10.0;
  vec2 ipos = floor(st);
  vec2 fpos = fract(st);

  vec3 color = vec3(random(ipos));

  gl_FragColor = vec4(color, 1.0);
}