#define PI 3.1415926535897932384626433832795

uniform float uTime;
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

vec3 ambientLight(vec3 lightColor, float lightIntensity) {
  return lightColor * lightIntensity;
}

vec3 directionalLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower) {
  vec3 lightDirection = normalize(lightPosition);
  float reflection = max(dot(lightDirection, normal), 0.0);

  vec3 lightReflection = reflect(-lightDirection, normal);
  float specular = pow(max(-dot(lightReflection, viewDirection), 0.0), specularPower);

  // return lightColor * lightIntensity * reflection + specular * lightColor * lightIntensity;
  // ↓↓↓式をまとめただけ↓↓↓
  return lightColor * lightIntensity * (reflection + specular);
}

vec3 pointLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 modelPosition, vec3 viewDirection, float specularPower, float decayStrength) {
  vec3 lightDelta = lightPosition - modelPosition;
  float lightDistance = length(lightDelta);
  vec3 lightDirection = normalize(lightDelta);
  float reflection = max(dot(lightDirection, normal), 0.0);

  vec3 reflectLight = reflect(-lightDirection, normal);
  float specular = pow(max(-dot(reflectLight, viewDirection), 0.0), specularPower);

  float decay = max(1.0 - lightDistance * decayStrength, 0.0);
  return lightColor * lightIntensity * (reflection + specular) * decay;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vPosition - cameraPosition);

  vec3 light = vec3(0.0);
  // light += ambientLight(vec3(1.0), 0.2);
  light += directionalLight(vec3(1.0), 1.0, normal, vec3(-1.0, 0.5, 0.0), viewDirection, 30.0);
  // light += pointLight(vec3(1.0), 1.0, normal, pointLightPosition, vPosition, viewDirection, 50.0, 0.2);
  
  float mixStrength = (vElevation + 0.92) * 1.0;
  mixStrength = smoothstep(0.0, 1.0, mixStrength);
  vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
  color *= light;
  gl_FragColor = vec4(color, 1.0);

  #include <colorspace_fragment>
  #include <tonemapping_fragment>
}