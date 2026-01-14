export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "day",
    type: "texture",
    path: "/earth/day.jpg",
  },
  {
    name: "night",
    type: "texture",
    path: "/earth/night.jpg",
  },
  {
    name: "specular",
    type: "texture",
    path: "/earth/specularClouds.jpg",
  },
];
