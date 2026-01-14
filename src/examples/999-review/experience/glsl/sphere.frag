uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularTexture;
uniform vec3 uSunPosition;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;


void main() {
  vec4 dayTexture = texture2D(uDayTexture, vUv);
  vec4 nightTexture = texture2D(uNightTexture, vUv);
  vec4 specularTexture = texture2D(uSpecularTexture, vUv);
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vPosition - cameraPosition);

  vec4 color = vec4(0.0);

  // base
  float sunStrength = dot(normal, uSunPosition);
  sunStrength = smoothstep(-0.5,  1.0, sunStrength);
  color += mix(nightTexture, dayTexture, sunStrength);

  // atmosphere
  float fresnel = dot(normal, viewDirection) + 1.0;
  fresnel = smoothstep(0.3, 1.0, fresnel);
  vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, sunStrength);
  color += vec4(atmosphereColor, 1.0) * fresnel;

  // specular
  vec3 reflection = reflect(normalize(-uSunPosition), normal);
  float specular = pow(max(dot(reflection, -viewDirection), 0.0), 50.0);
  color += specular;

  
  // color = vec4(atmosphereColor, 1.0);
  
  gl_FragColor = color;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}