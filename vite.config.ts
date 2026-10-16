import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use relative asset paths so the build works regardless of the Pages mount path.
  base: "./",
});
