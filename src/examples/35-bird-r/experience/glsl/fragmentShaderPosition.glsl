uniform float time;
uniform float delta;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec4 tmpPos = texture2D(texturePosition, uv);
  vec3 selfVelocity = texture2D(textureVelocity, uv).xyz;
  vec3 position = tmpPos.xyz;

  float phase = tmpPos.w;

  phase = mod(
    phase + delta + 
    length(selfVelocity.xz) * delta * 3.0 + 
    length(selfVelocity.y) * delta * 6.0
    ,31.4
  );

  gl_FragColor = vec4(position + selfVelocity.xyz * delta * 17.0, phase);
}