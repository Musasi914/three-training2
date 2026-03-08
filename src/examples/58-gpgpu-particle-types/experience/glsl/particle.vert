precision highp float;
precision highp int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform sampler2D positionVelocityTexture;
uniform sampler2D colorTexture;
uniform float dataTextureSize;
uniform float drawScale;
uniform float pointSize;

attribute vec3 position;
attribute float particleIndex;
attribute vec4 randomValue;

varying vec4 vColor;

void main() {
  vec4 modelPos = modelMatrix * vec4(vec3(0.0), 1.0);

  float col = mod(particleIndex, dataTextureSize);
  float row = floor(particleIndex / dataTextureSize);
  vec2 uv = (vec2(col, row) + vec2(0.5)) / dataTextureSize;

  vec4 positionVelocity = texture2D(positionVelocityTexture, uv);
  modelPos.xy += positionVelocity.xy * drawScale;

  vColor = texture2D(colorTexture, uv);
  vColor.a -= randomValue.y * 255.0 * 0.5;

  gl_Position = projectionMatrix * viewMatrix * modelPos;
  gl_PointSize = pointSize * (1.0 + 0.4 * randomValue.x + min(1.0, length(positionVelocity.zw) / 10.0));
}
