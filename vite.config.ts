import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },
    build: {
      outDir: "dist/spa",
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false,
      minify: "esbuild",
      sourcemap: isDev,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "router-vendor": ["react-router-dom"],
            "ui-vendor": [
              "lucide-react",
              "@radix-ui/react-dialog",
              "@radix-ui/react-tabs",
            ],
          },
        },
      },
    },
    plugins: [react(), expressPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
    },
    transformIndexHtml: {
      order: "pre",
      handler: async (html) => {
        const injection = `
    <script>
      window.__STORE_SETTINGS__ = null;
      
      (async function() {
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const settings = await response.json();
            window.__STORE_SETTINGS__ = {
              store_name: settings.store_name,
              logo_url: settings.logo_url,
              primary_color: settings.primary_color,
              secondary_color: settings.secondary_color,
              accent_color: settings.accent_color,
              background_color: settings.background_color,
              text_color: settings.text_color
            };
            window.dispatchEvent(new CustomEvent('storeSettingsLoaded', { 
              detail: window.__STORE_SETTINGS__ 
            }));
          }
        } catch (error) {
          console.warn('Failed to load store settings:', error);
        }
      })();
    </script>`;

        return html.replace(
          '<div id="root"></div>',
          `<div id="root"></div>${injection}`,
        );
      },
    },
  };
}
