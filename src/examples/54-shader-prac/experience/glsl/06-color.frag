#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

uniform vec2 uResolution;
uniform float uTime;

vec3 blue = vec3(0.15,0.13,0.9);
vec3 yellow = vec3(1.0,0.8,0.2);

float plot(vec2 st, float pct) {
  return smoothstep(pct-0.01, pct, st.y) -
        smoothstep(pct, pct+0.01, st.y);
}

vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  vec3 color = vec3(0.0);

  vec2 toCenter = vec2(0.5) - st;
  float angle = atan(toCenter.y, toCenter.x);
  float radius = length(toCenter) * 2.0;

  float rawHue = fract((angle / TWO_PI) + 0.5);

  float targetHue = 0.;
  float influence = 0.6;
  float localScale = 0.5;

  // 0だと近い [-0.5, 0.5]
  float d = fract(rawHue - targetHue + 0.5) - 0.5;
  // 1だと誓い [0, 1]
  float w = 1.0 - smoothstep(0.0, influence, abs(d));

  float warpedD = d * mix(1.0, localScale, w);

  float hue = fract(targetHue + warpedD);
  color = hsb2rgb(vec3(hue, radius, 1.0));

  gl_FragColor = vec4(color, 1.0);
}