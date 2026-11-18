// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      // Offline first (constraint C1): Workbox generates /sw.js at build time.
      // It precaches the hashed JS/CSS files and keeps a network-first copy of the page,
      // so after one visit the whole tutor opens with no internet.
      // Registration happens only in src/lib/register-sw.ts (never in preview or dev).
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: false,
        // TanStack Start writes browser files to dist/client, so the worker must live there too.
        outDir: "dist/client",
        workbox: {
          globPatterns: ["**/*.{js,css,svg,ico,txt}"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // The page itself: try the network first, use the saved copy when offline.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" &&
                !url.pathname.startsWith("/~oauth") &&
                !url.pathname.startsWith("/api"),
              handler: "NetworkFirst",
              options: { cacheName: "tutor-pages", networkTimeoutSeconds: 4 },
            },
          ],
        },
      }),
    ],
  },
});
