
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  // CORRECTED: Only the official React plugin is needed.
  // The problematic 'componentTagger' has been removed.
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // HARDENING: As per your recommendation, explicitly prevent esbuild overrides.
  esbuild: {
    jsxFactory: undefined,
    jsxFragment: undefined,
  },
  // HARDENING: Enable source maps for better production debugging.
  build: {
    sourcemap: true,
  },
});
