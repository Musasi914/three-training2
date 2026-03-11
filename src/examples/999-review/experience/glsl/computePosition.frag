// NOTE: positionVelocityTexture and resolution are provided by the GPUComputationRenderer
uniform vec2 pointerPos;
uniform float pointerForceRadius;
uniform float pointerActive;
// uniform float transitionValue;
uniform sampler2D targetPositionTexture;

const float FRICTION = 0.9;
const float POINTER_FORCE_FACTOR = 3.0;
const float SELF_FORCE_FACTOR = 0.1;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 data = texture2D(positionVelocityTexture, uv);

  vec2 pos = data.xy;
  vec2 vel = data.zw;
  vec2 targetPos = texture2D(targetPositionTexture, uv).xy;

  // 目標へ戻る力
  vec2 acceleration = (targetPos - pos) * SELF_FORCE_FACTOR;

  // ポインター力
  vec2 pointerVector = targetPos - pointerPos;
  float pointerDistance = max(4.0, length(pointerVector));
  float pointerPower = max(0.0, pointerForceRadius - pointerDistance) / pointerForceRadius;
  pointerPower = smoothstep(0.1, 0.9, pointerPower * pointerPower);
  acceleration += normalize(pointerVector) * pointerPower * POINTER_FORCE_FACTOR * pointerActive;
  
  vel = (vel + acceleration) * FRICTION;
  
  gl_FragColor = vec4(pos + vel, vel);
}