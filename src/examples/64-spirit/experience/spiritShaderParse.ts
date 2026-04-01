import * as THREE from "three";

/** The-Spirit 由来の `// chunk(name);` を THREE.ShaderChunk に置換する */
export function parseSpiritShader(shader: string): string {
  return shader.replace(
    /\/\/\s*chunk\(\s*(\w+)\s*\)\s*;/g,
    (_, name: string) => {
      const chunk =
        THREE.ShaderChunk[name as keyof typeof THREE.ShaderChunk];
      if (!chunk) {
        throw new Error(`Unknown ShaderChunk: ${name}`);
      }
      return `${chunk}\n`;
    }
  );
}
