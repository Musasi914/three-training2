import { defineConfig } from "vite";
import { resolve } from "path";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  plugins: [glsl()],
});
