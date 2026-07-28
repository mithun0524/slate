import type { MetadataRoute } from "next";

const ROUTES = [
  "", "/download", "/docs", "/docs/concepts", "/docs/views", "/docs/shortcuts",
  "/docs/config", "/docs/api", "/docs/troubleshooting", "/changelog",
  "/privacy", "/terms", "/accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `https://slate.tools${r}`,
    lastModified: new Date("2026-07-27"),
    priority: r === "" ? 1 : r === "/download" || r === "/docs" ? 0.8 : 0.5,
  }));
}
