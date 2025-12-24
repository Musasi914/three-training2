varying vec2 vUv;
varying vec3 vColor;
void main() {
  vec2 uv = gl_PointCoord;
  float strength = 0.05 / length(uv - 0.5) - 0.1;
  vec3 color = vColor;
  gl_FragColor = vec4(color, strength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}