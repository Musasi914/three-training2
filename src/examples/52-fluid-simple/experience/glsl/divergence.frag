precision highp float;

uniform sampler2D uVelocity;
uniform vec2 uPx;
uniform float uDt;

varying vec2 vUv;

void main() {
  float x0 = texture2D(uVelocity, vUv - vec2(uPx.x, 0.0)).x;
  float x1 = texture2D(uVelocity, vUv + vec2(uPx.x, 0.0)).x;
  float y0 = texture2D(uVelocity, vUv - vec2(0.0, uPx.y)).y;
  float y1 = texture2D(uVelocity, vUv + vec2(0.0, uPx.y)).y;

  float div = (x1 - x0 + y1 - y0) * 0.5;

  gl_FragColor = vec4(div / max(uDt, 1e-6), 0.0, 0.0, 1.0);
}

