import type * as THREE from "three";

export type ShaderPassMaterial = {
  uniforms: Record<string, THREE.IUniform>;
  vertexShader: string;
  fragmentShader: string;
  transparent?: boolean;
  blending?: THREE.Blending;
  depthTest?: boolean;
  depthWrite?: boolean;
};

export type ShaderPassProps = {
  material?: ShaderPassMaterial;
  output: THREE.WebGLRenderTarget;
  output0?: THREE.WebGLRenderTarget;
  output1?: THREE.WebGLRenderTarget;
};
