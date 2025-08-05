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
      // Plugin para desenvolvimento (só carrega quando necessário)
      isDev ? devServerPlugin() : buildHtmlPlugin(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

// Plugin para desenvolvimento - carrega servidor dinamicamente
function devServerPlugin(): Plugin {
  return {
    name: "dev-server-plugin",
    apply: "serve",
    configureServer(server) {
      // Carrega o servidor apenas quando necessário e de forma assíncrona
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          try {
            // Import dinâmico apenas para requisições de API
            const serverModule = await import('./server/index.js');
            if (serverModule.createServer) {
              const app = serverModule.createServer();
              return app(req, res, next);
            }
          } catch (error) {
            console.warn('Server not available in dev mode:', error.message);
          }
        }
        next();
      });
    },
    transformIndexHtml(html) {
      return addStoreSettingsScript(html);
    },
  };
}

// Plugin para build - apenas injeta script no HTML
function buildHtmlPlugin(): Plugin {
  return {
    name: "build-html-plugin", 
    apply: "build",
    transformIndexHtml(html) {
      return addStoreSettingsScript(html);
    },
  };
}

// Função para injetar script de configurações da loja
function addStoreSettingsScript(html: string): string {
  const storeScript = `
    <script>
      window.__STORE_SETTINGS__ = null;

      (async function loadStoreSettings() {
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const settings = await response.json();
            window.__STORE_SETTINGS__ = {
              store_name: settings.store_name || 'Loja',
              logo_url: settings.logo_url || '',
              primary_color: settings.primary_color || '#1d4ed8',
              secondary_color: settings.secondary_color || '#3b82f6',
              accent_color: settings.accent_color || '#60a5fa',
              background_color: settings.background_color || '#ffffff',
              text_color: settings.text_color || '#000000'
            };
            
            // Disparar evento customizado
            window.dispatchEvent(new CustomEvent('storeSettingsLoaded', {
              detail: window.__STORE_SETTINGS__
            }));
          }
        } catch (error) {
          console.warn('Failed to load store settings:', error);
          // Configurações padrão em caso de erro
          window.__STORE_SETTINGS__ = {
            store_name: 'Loja',
            logo_url: '',
            primary_color: '#1d4ed8',
            secondary_color: '#3b82f6', 
            accent_color: '#60a5fa',
            background_color: '#ffffff',
            text_color: '#000000'
          };
        }
      })();
    </script>`;

  return html.replace(
    '<div id="root"></div>',
    `<div id="root"></div>${storeScript}`,
  );
}
