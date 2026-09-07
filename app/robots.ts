import type { MetadataRoute } from "next";

// Pre-launch: keep the whole site out of search indexes. Flip to allow at launch.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
