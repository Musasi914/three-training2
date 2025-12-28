void main() {
  vec2 uv = gl_PointCoord;  
  float distanceToCenter = length(uv - vec2(0.5));
  float strength = 1.0 -  step(0.5, distanceToCenter);
  gl_FragColor = vec4(0.5, 0.8 , 1.0, strength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}