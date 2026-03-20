uniform vec2 uResolution;
uniform float uTime;

void main() {
  vec2 pos = gl_FragCoord.xy / uResolution.xy;
  
  vec3[4] colors = vec3[] (
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 1.0, 0.0)
  );
  
  vec3 color = mix(
    mix(colors[0], colors[1], pos.x),
    mix(colors[2], colors[3], pos.x),
    pos.y
  );
  gl_FragColor = vec4(color, 1.0);
}