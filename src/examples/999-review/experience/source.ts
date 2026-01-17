export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "earth",
    type: "texture",
    path: "/earth/world-dark.png",
  },
];
