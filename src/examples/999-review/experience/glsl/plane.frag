void main() {
  vec2 uv = gl_PointCoord;
  float strength = 0.1 / length(uv - 0.5) - 0.2;
  strength = smoothstep(0.0, 1.0, strength);
  gl_FragColor = vec4(vec3(strength), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}