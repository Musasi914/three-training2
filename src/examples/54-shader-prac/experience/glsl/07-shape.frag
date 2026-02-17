uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  st *= uResolution.x / uResolution.y;
  st = st * 2.0 - 1.0;
  vec3 color = vec3(0.0);
  float d = 0.0;
  int N = 5;

  float a = atan(st.x, st.y) + PI; // 0 ~ 2PI
  float r = TWO_PI / float(N); // 1角形の角度

  // Shaping function that modulate the distance
  d = cos(floor(.5+a/r)*r-a)*length(st);

  color = vec3(1.0-smoothstep(.4,.41,d));
  gl_FragColor = vec4(color, 1.0);
}