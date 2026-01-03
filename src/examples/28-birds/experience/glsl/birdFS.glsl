varying vec4 vColor;
varying float z;

void main() {
  float z2 = 0.2 + (1000.0 - z) / 1000.0 * vColor.x;
  gl_FragColor = vec4(z2,z2,z2, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}