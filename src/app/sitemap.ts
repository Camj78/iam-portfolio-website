import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-meta";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/cfg/phase-1", "/cfg/phase-2"].map((path) => ({ url: `${SITE_URL}${path}` }));
}
