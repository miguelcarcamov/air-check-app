import { defineConfig } from "vite";

/** GitHub Pages project site path — override with VITE_BASE_PATH if you rename the repo. */
const pagesBase = process.env.VITE_BASE_PATH ?? "/air-check-app/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? pagesBase : "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));
