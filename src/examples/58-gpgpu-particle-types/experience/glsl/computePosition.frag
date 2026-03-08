uniform vec2 pointerPos;
uniform float pointerForceRadius;
uniform float pointerActive;
uniform float transitionValue;
uniform sampler2D targetPositionTexture;

const float FRICTION = 0.82;
const float POINTER_FORCE_FACTOR = 5.0;
const float SELF_FORCE_FACTOR = 0.10;
const float TRANSITION_FORCE_FACTOR = 120.0;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 data = texture2D(positionVelocityTexture, uv);

  vec2 pos = data.xy;
  vec2 vel = data.zw;
  vec2 targetPos = texture2D(targetPositionTexture, uv).xy;

  vec2 acceleration = (targetPos - pos) * SELF_FORCE_FACTOR;

  vec2 pointerVector = targetPos - pointerPos;
  float pointerDistance = max(4.0, length(pointerVector));
  float pointerPower = max(0.0, pointerForceRadius - pointerDistance) / pointerForceRadius;
  pointerPower = smoothstep(0.1, 0.9, pointerPower * pointerPower);
  acceleration += normalize(pointerVector) * pointerPower * POINTER_FORCE_FACTOR * pointerActive;
  acceleration += normalize(pointerVector) * TRANSITION_FORCE_FACTOR * transitionValue;

  vel = (vel + acceleration) * FRICTION;
  gl_FragColor = vec4(pos + vel, vel);
}
