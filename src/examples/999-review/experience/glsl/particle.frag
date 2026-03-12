varying vec3 vPosition;
varying float vDistToCamera;
varying float vAlpha;
varying float vNoiseValue;

uniform vec2 uResolution;
uniform vec3 uCameraPosition;
uniform vec3 uColor;
uniform vec3 uBgColor;
uniform float uDepth;
uniform float uSizeProgress;
uniform float uRandomProgress;

void main() {
  float alpha = vAlpha * smoothstep(0.0, 0.1, vNoiseValue);
  vec2 st = gl_PointCoord - 0.5;
  float l = length(st);
  float a = mix(0.5, 0.701, smoothstep(0.0, 1.0, vNoiseValue));
  float r = smoothstep(a + 0.01, a, l);
  alpha *= mix(r, 1.0, uSizeProgress);

  if (alpha == 0.0) {
    discard;
  }

  vec4 color = vec4(mix(uBgColor, uColor, vAlpha * vAlpha), alpha);
  gl_FragColor = color;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
