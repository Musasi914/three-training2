precision highp float;
varying vec2 vUv;
uniform vec2 px;
uniform vec2 boundarySpace;

void main() {
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  vUv = vec2(0.5) + pos.xy * 0.5;

  gl_Position = vec4(pos, 1.0);
}