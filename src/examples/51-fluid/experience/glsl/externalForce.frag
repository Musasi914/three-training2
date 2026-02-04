precision highp float;
uniform vec2 force;
varying vec2 vUv;

void main() {
  // vUv: 0..1. 円形の減衰を作る
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}

