uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float strength = 0.1 / length(gl_PointCoord - vec2(0.5)) - 0.2;
  gl_FragColor = vec4(uColor, strength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}