import { defineConfig, type Plugin } from "vite";

function productionCsp(): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");

  return {
    name: "production-csp",
    apply: "build",
    transformIndexHtml(html) {
      const meta = `    <meta http-equiv="Content-Security-Policy" content="${policy}">\n`;
      return html.replace("<head>", `<head>\n${meta}`);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [productionCsp()],
  server: {
    host: "127.0.0.1",
    port: 4317,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4317,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    modulePreload: false,
  },
});
