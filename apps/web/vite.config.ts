import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const monorepoRoot = path.resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, monorepoRoot, "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || env.API_URL,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
