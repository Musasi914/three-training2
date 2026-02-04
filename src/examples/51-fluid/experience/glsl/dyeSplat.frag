precision highp float;
uniform vec3 color;
uniform float intensity;
varying vec2 vUv;

void main() {
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d = pow(d, 2.0);
  vec3 c = color * (d * intensity);
  gl_FragColor = vec4(c, 1.0);
}

