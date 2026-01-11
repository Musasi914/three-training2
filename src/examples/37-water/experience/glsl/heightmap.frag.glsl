#define PI 3.1415926535897932384626433832795

uniform vec2 mousePos;
uniform float mouseSize;
uniform float viscosity;
uniform float deep;

void main() {
  vec2 cellSize = 1.0 / resolution.xy;

  vec2 uv = gl_FragCoord.xy * cellSize;

  // heightmapValue.x == height from previous frame
  // heightmapValue.y == height from penultimate frame
  // heightmapValue.z, heightmapValue.w not used
  vec4 heightmapValue = texture2D( heightmap, uv );

  // Get neighbours
  vec4 north = texture2D( heightmap, uv + vec2( 0.0, cellSize.y ) );
  vec4 south = texture2D( heightmap, uv + vec2( 0.0, - cellSize.y ) );
  vec4 east = texture2D( heightmap, uv + vec2( cellSize.x, 0.0 ) );
  vec4 west = texture2D( heightmap, uv + vec2( - cellSize.x, 0.0 ) );

  // Wave equation: new height based on average of neighbors minus previous height
  // float newHeight = ( ( north.x + south.x + east.x + west.x ) * 0.5 - (heightmapValue.y) );
  float newHeight = heightmapValue.x - heightmapValue.y + ((north.x + south.x + east.x + west.x) / 4.0);
  // newHeight *= viscosity;
  
  // // Mouse influence
  float mousePhase = clamp( length( ( uv - vec2( 0.5 ) ) * BOUNDS - vec2( mousePos.x, - mousePos.y ) ) * PI / mouseSize, 0.0, PI );
  newHeight -= ( cos( mousePhase ) + 1.0 ) * deep;

  heightmapValue.y = heightmapValue.x;
  heightmapValue.x = newHeight;

  gl_FragColor = heightmapValue;
}

