import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // This repository is published at /redline-ascension/ on GitHub Pages.
  base: "/redline-ascension/",
});
