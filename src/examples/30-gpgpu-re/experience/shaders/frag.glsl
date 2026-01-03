void main() {
  vec2 uv = gl_PointCoord;
  float strength = step(0.5, 1.0 - length(uv - 0.5));
  gl_FragColor = vec4(vec3(1.0), strength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}