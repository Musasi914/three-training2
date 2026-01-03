import { Fn, mx_noise_vec3 } from "three/tsl";
import * as THREE from "three/webgpu";

export const octavesNoiseVec3 = Fn(
  ({
    p,
    freq,
    amp,
  }: {
    p: THREE.TSL.ShaderNodeObject<THREE.VarNode>;
    freq: THREE.TSL.ShaderNodeObject<THREE.VarNode>;
    amp: THREE.TSL.ShaderNodeObject<THREE.VarNode>;
  }) => {
    return mx_noise_vec3(p.mul(freq)).mul(amp);
  }
);
