uniform vec2 resolution;
uniform sampler2D texturePosition;
uniform sampler2D textureDefaultPosition;
uniform vec3 mouse3d;
uniform float speed;
uniform float dieSpeed;
uniform float radius;
uniform float curlSize;
uniform float attraction;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 positionInfo = texture2D(texturePosition, uv);
  vec4 defaultPosition = texture2D(textureDefaultPosition, uv);
  
  gl_FragColor = vec4(positionInfo.xyz, 1.0);
}