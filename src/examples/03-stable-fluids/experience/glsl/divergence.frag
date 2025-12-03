precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 vUv;

void main(){
  float x0 = texture2D(velocity, vUv-vec2(px.x, 0)).x; // 左となり
  float x1 = texture2D(velocity, vUv+vec2(px.x, 0)).x; // 右となり
  float y0 = texture2D(velocity, vUv-vec2(0, px.y)).y; // 下となり
  float y1 = texture2D(velocity, vUv+vec2(0, px.y)).y; // 上となり
  float divergence = (x1-x0 + y1-y0) / 2.0;

  gl_FragColor = vec4(divergence / dt);
}