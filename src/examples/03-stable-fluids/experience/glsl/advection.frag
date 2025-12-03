precision highp float;

uniform sampler2D velocity;
uniform float dt;
uniform vec2 fboSize;
uniform bool isBFECC;
uniform vec2 px;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // アスペクト比の補正
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  
  // 現在の位置での速度を取得
  vec2 vel = texture2D(velocity, uv).xy;
  
  // 時間を逆に戻した位置を計算
  vec2 backPos = uv - vel * dt * ratio;
  
  // 境界処理：範囲外に出ないようにクランプ
  backPos = clamp(backPos, 0.0, 1.0);
  
  // 戻った位置の速度を取得
  vec2 newVel = texture2D(velocity, backPos).xy;
  
  gl_FragColor = vec4(newVel, 0.0, 0.0);
}