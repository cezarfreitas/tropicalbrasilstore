import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },
    base: "/",
    publicDir: "public",
    build: {
      outDir: "dist/spa",
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false,
      minify: "esbuild",
      sourcemap: isDev,
      assetsDir: "assets",
      target: "es2015",
      rollupOptions: {
        output: {
          format: "es",
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "router-vendor": ["react-router-dom"],
            "ui-vendor": [
              "lucide-react",
              "@radix-ui/react-dialog",
              "@radix-ui/react-tabs",
            ],
          },
          assetFileNames: "assets/[name]-[hash].[ext]",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
        },
      },
    },
    plugins: [
      react(),
      // Só carregar plugins do servidor em desenvolvimento
      ...(isDev ? [createExpressPlugin()] : [createBuildPlugin()]),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function createExpressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      // Só em desenvolvimento, importar dinamicamente sem resolver na fase de config
      const serverModule = await import("./server/index.js").catch(() => {
        console.warn("Failed to load server in dev mode");
        return null;
      });

      if (serverModule?.createServer) {
        const app = serverModule.createServer();
        server.middlewares.use(app);
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler: async (html) => {
        return addStoreSettingsScript(html);
      },
    },
  };
}

function createBuildPlugin(): Plugin {
  return {
    name: "build-plugin",
    apply: "build",
    transformIndexHtml: {
      order: "pre",
      handler: async (html) => {
        return addStoreSettingsScript(html);
      },
    },
  };
}

function addStoreSettingsScript(html: string): string {
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
}
