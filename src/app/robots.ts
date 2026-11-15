import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The link-preview image lives under /api/og, so only the form endpoint is closed.
        disallow: ["/api/contact"],
      },
    ],
    sitemap: "https://rhshoumik.dev/sitemap.xml",
    host: "https://rhshoumik.dev",
  };
}
