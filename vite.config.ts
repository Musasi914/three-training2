import { defineConfig } from "vite";
import { resolve } from "path";

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
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "01-animation": resolve(
          __dirname,
          "src/examples/01-animation/index.html"
        ),
        "02-sphereanimation": resolve(
          __dirname,
          "src/examples/02-sphereanimation/index.html"
        ),
      },
    },
  },
});
