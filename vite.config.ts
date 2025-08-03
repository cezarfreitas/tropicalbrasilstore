import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDeployBuild =
    process.env.VITE_BUILD_FAST === "true" || process.env.CI === "true";

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: [
        "localhost",
        ".easypanel.host",
        ".jzo3qo.easypanel.host"
      ],
    },
    build: {
      outDir: "dist/spa",
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false, // Skip gzip analysis for faster build
      minify: "esbuild", // Use esbuild for all builds (faster and no extra deps)
      sourcemap: isDeployBuild ? false : true, // Skip sourcemaps for deploy
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
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
    transformIndexHtml: {
      order: "pre",
      handler: async (html, context) => {
        // Inject store settings script into HTML
        const injection = `
    <script>
      // Store settings will be injected here by the server
      window.__STORE_SETTINGS__ = null;

      // Try to fetch settings immediately
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

            // Dispatch event for components to update
            window.dispatchEvent(new CustomEvent('storeSettingsLoaded', { detail: window.__STORE_SETTINGS__ }));
          }
        } catch (error) {
          console.warn('Failed to load initial store settings:', error);
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
