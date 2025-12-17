export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "earthDay",
    type: "texture",
    path: "/earth/day.jpg",
  },
  {
    name: "earthNight",
    type: "texture",
    path: "/earth/night.jpg",
  },
  {
    name: "earthSpecularClouds",
    type: "texture",
    path: "/earth/specularClouds.jpg",
  },
];
