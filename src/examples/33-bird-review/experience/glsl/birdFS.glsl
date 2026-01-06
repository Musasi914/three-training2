varying vec4 vColor;
varying float z;

void main() {
  float z2 = 0.2 + (300.0 - z) / 300.0;
  gl_FragColor = vec4(vColor.xyz * z2, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}