precision highp float;
uniform sampler2D velocity;
varying vec2 vUv;

void main() {
  // 速度テクスチャから値を取得（xy が速度）
  vec2 vel = texture2D(velocity, vUv).xy;

  // 速度の大きさ（長さ）を計算
  float speed = length(vel);

  // 速度を 0.0〜1.0 に収まるように適当にスケーリング
  // float intensity = clamp(speed * 5.0, 0.0, 1.0);

  // intensity をグレースケールとして表示
  gl_FragColor = vec4(vec3(speed), 1.0);
}