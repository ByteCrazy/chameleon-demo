import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), monacoEditorPlugin({})],
  define: {
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      __RUN_MODE__: JSON.stringify(process.env.BUILD_TYPE),
      __PACKAGE_VERSION__: JSON.stringify(pkg.version),
      __BUILD_VERSION__: JSON.stringify(Date.now())
    }
  }
});
