export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "frame",
    type: "texture",
    path: "/square/frame.png",
  },
];
