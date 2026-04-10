
attribute vec3 positionFlip;
attribute vec2 fboUV;

uniform sampler2D texturePosition;
uniform float flipRatio;
uniform vec3 color1;
uniform vec3 color2;
uniform mat4 cameraMatrix;

void main() {
  vec4 positionInfo = texture2D(texturePosition, fboUV);
  vec3 pos = positionInfo.xyz;

  // pos += position;

  // FBO の座標は三角形の「中心」。各頂点はローカル三角形 shape（position / positionFlip）でずらす。
  // これが無いと 3 頂点が同一点になり、面積 0 で描画されない。
  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  // mvPosition += vec4(
  //   (position + (positionFlip - position) * flipRatio) *
  //     smoothstep(0.0, 0.2, positionInfo.w),
  //   0.0
  // );
  mvPosition += vec4(position, 0.0);
  gl_Position = projectionMatrix * mvPosition;
}