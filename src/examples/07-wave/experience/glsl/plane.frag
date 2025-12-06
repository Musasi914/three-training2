#define PI 3.1415926535897932384626433832795

uniform float uTime;
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
varying vec2 vUv;
varying float vElevation;

// ランダム関数
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 泡を描画する関数
float drawBubble(vec2 uv, vec2 bubblePos, float size, float time) {
  vec2 dist = uv - bubblePos;
  float d = length(dist);
  
  // 泡の円形パターン（外側が透明、内側が不透明）
  float bubble = 1.0 - smoothstep(size * 0.3, size, d);
  
  return bubble;
}

void main() {
  vec3 color = mix(uDepthColor, uSurfaceColor, (vElevation + 0.2) * 2.0);
  
  // 泡の描画
  vec3 bubbleColor = vec3(1.0); // 白い泡
  float bubbleMask = 0.0;
  
  // 複数の泡を生成
  float bubbleScale = 5.0; // 泡の密度
  vec2 bubbleGrid = floor(vUv * bubbleScale);
  
  for (float i = -1.0; i <= 1.0; i++) {
    for (float j = -1.0; j <= 1.0; j++) {
      vec2 cell = bubbleGrid + vec2(i, j); //[-1, 5]
      float cellRandom = random(cell);
      
      // 泡が存在するかどうか（確率的に）
      if (cellRandom > 0.4) {
        vec2 bubblePos = cell + vec2(0.5) + (random(cell + vec2(1.0)) - 0.5) * 0.3;
        bubblePos /= bubbleScale; //[-0.13, 1.13]
        
        // 時間とともに泡が上に移動
        bubblePos.y -= uTime * 0.1 * cellRandom;
        bubblePos.y = mod(bubblePos.y , 1.0); // ループ
        
        // 泡のサイズ（ランダム）
        float bubbleSize = 0.02 + random(cell + vec2(2.0)) * 0.03; //[0.02, 0.05]
        
        // 泡の透明度（波の高さに応じて）
        float bubbleAlpha = drawBubble(vUv, bubblePos, bubbleSize, uTime);
        // bubbleAlpha *= smoothstep(-0.05, 0.05, vElevation); // 波の表面付近にのみ表示
        
        bubbleMask = max(bubbleMask, bubbleAlpha);
      }
    }
  }
  
  // 泡の色を海の色にブレンド
  color = mix(color, bubbleColor, bubbleMask * 0.8);
  
  gl_FragColor = vec4(color, 1.0);

  #include <colorspace_fragment>
}