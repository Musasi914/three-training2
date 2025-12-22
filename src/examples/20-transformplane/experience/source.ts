export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "plane",
    type: "texture",
    path: "/landscape/a.webp",
  },
];
