import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig(async () => ({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: './dist',
    target: "es2022"
  },
  css: {
    preprocessorOptions : {
      scss: {
        api: "modern",
      }        
    } 
  },
  clearScreen: false,
  plugins: [
    vue(),
    wasm()
  ],
  server: {
    port: 1420,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST,
    hmr: false,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
}));
