attribute float particleIndex;
attribute vec4 randomValue;

uniform float pointSize;
uniform sampler2D positionVelocityTexture;
uniform sampler2D colorTexture;
uniform sampler2D pointTexture;
uniform float dataTextureSize;

varying vec4 vColor;

void main() {
  float col = mod(particleIndex, dataTextureSize);
  float row = floor(particleIndex / dataTextureSize);
  vec2 uv = (vec2(col, row) + vec2(0.5)) / dataTextureSize;

  vec4 positionVelocity = texture2D(positionVelocityTexture, uv);
  
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  modelPosition.xy += positionVelocity.xy;

  vColor = texture2D(colorTexture, uv);
  // vColor.a -= randomValue.y * 255.0 * 0.5;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
  gl_PointSize = pointSize;
}