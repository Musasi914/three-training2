import { uniform } from "three/tsl";

export default class GfxConfig {
  subdivisions = 800;
  octaves = uniform(9);
  initialFrequency = uniform(4.0);
  initialAmplitude = uniform(0.25);
  warpStrength = uniform(8.0);
  warpFrequency = uniform(0.1);
}
