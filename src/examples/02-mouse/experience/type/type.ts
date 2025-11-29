import * as THREE from "three";

export type Props = {
  cellScale?: THREE.Vector2;
  cursorSize: number;
  fboSize?: THREE.Vector2;
  boundarySpace?: THREE.Vector2;
  viscos?: number;
  dt?: number;
  src?: THREE.WebGLRenderTarget;
  dst: THREE.WebGLRenderTarget;
  dst_?: THREE.WebGLRenderTarget;
};

export type ShaderPassProps = {
  material?: {
    uniforms: Record<string, THREE.IUniform>;
    vertexShader: string;
    fragmentShader: string;
  };
  output: THREE.WebGLRenderTarget;

  output0?: THREE.WebGLRenderTarget;
  output1?: THREE.WebGLRenderTarget;
};
