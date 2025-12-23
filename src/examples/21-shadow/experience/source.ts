export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "board",
    type: "texture",
    path: "/checker.png",
  },
  {
    name: "shadow",
    type: "texture",
    path: "/shadow/image.png",
  },
];
