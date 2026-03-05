export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "img",
    type: "texture",
    path: "/landscape/a.webp",
  },
];
