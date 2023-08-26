import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {

    outDir: "./build/frontend",

    rollupOptions: {

      input: {
        app: "./src/frontend/index.html"
      }
    }
  },
  plugins: [svelte()],
})
