varying vec2 vUv;

void main() {
  vec2 uv = gl_PointCoord.xy;
  float strength = step(0.5, 1.0 - length(uv - 0.5));
  gl_FragColor = vec4(1.0, 1.0, 1.0, strength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}