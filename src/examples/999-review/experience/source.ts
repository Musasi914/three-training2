export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "duck",
    type: "model",
    path: "/models/duck.glb",
  },
];
