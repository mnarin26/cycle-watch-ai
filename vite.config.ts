import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart(),
    // React eklentisi Start eklentisinden sonra gelmeli
    viteReact(),
    tailwindcss(),
  ],
});
