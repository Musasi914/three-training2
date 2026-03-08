uniform sampler2D targetColorTexture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 velocity = texture2D(positionVelocityTexture, uv).zw;

  vec4 currentColor = texture2D(colorTexture, uv);
  vec4 targetColor = texture2D(targetColorTexture, uv);
  vec4 mixedColor = mix(currentColor, targetColor, 0.12);

  float speed = min(1.0, length(velocity) / 20.0);
  vec3 speedTint = vec3(speed, speed * 0.35, 0.0);
  mixedColor.rgb = clamp(mixedColor.rgb + speedTint * 32.0, 0.0, 255.0);

  gl_FragColor = mixedColor;
}
