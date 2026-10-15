import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type RuntimeEnvironment = { process?: { env?: Record<string, string | undefined> } };

function searchArtifacts(): Plugin {
  const environment = (globalThis as unknown as RuntimeEnvironment).process?.env ?? {};
  const configuredOrigin =
    environment.VITE_SITE_URL ??
    environment.VERCEL_PROJECT_PRODUCTION_URL ??
    environment.VERCEL_URL ??
    "http://127.0.0.1:5173";
  const origin = new URL(
    configuredOrigin.startsWith("http") ? configuredOrigin : "https://" + configuredOrigin,
  ).origin;
  const siteUrl = origin + "/";
  const preview = Boolean(environment.VERCEL_ENV && environment.VERCEL_ENV !== "production");
  const robotsDirective = preview ? "noindex, nofollow" : "index, follow";
  const sitemapUrl = siteUrl + "sitemap.xml";

  return {
    name: "is-my-pc-on-search-artifacts",
    transformIndexHtml(html) {
      return html
        .replaceAll("__ROBOTS_DIRECTIVE__", robotsDirective)
        .replaceAll("__SITE_URL__", siteUrl)
        .replaceAll("__OG_IMAGE_URL__", origin + "/social-card.png");
    },
    generateBundle() {
      const robots = preview
        ? "User-agent: *\nDisallow: /\n"
        : "User-agent: *\nAllow: /\nSitemap: " + sitemapUrl + "\n";
      const sitemap =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "  <url><loc>" + siteUrl + "</loc></url>\n" +
        "</urlset>\n";
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
    },
  };
}

export default defineConfig({
  plugins: [react(), searchArtifacts()],
  server: { host: "127.0.0.1" },
});
