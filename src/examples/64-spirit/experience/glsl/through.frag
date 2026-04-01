uniform vec2 resolution;
uniform sampler2D uTex;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  gl_FragColor = texture2D(uTex, uv);
}
