varying vec3 vColor;

void main() {
  vec2 uv = gl_PointCoord;
  float d = 0.01 / length(uv - 0.5) - 0.02;
  vec3 color = vColor;
  color = mix(vec3(0.0), color, d);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}