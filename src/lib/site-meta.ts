import type { Metadata } from "next";

// Production metadata. The temporary Vercel domain until a custom domain is bought:
// change SITE_URL here and every canonical, Open Graph and sitemap URL follows.
export const SITE_URL = "https://iam-portfolio-website.vercel.app";
export const SITE_NAME = "Cameron Johnson · Identity & Access Management";

// 1200×630 frame of the live hero (lab: lab/qa-og.mjs), shared by every page.
const shareImage = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "Identity Secured. Access Governed. Cameron Johnson's IAM portfolio, with A.R.I.A., a felt puppet host, at a studio desk.",
};

/** Canonical URL, Open Graph and Twitter card for one page. `path` starts with "/". */
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title, description, url: path, siteName: SITE_NAME, locale: "en_US",
      type: path === "/" ? "website" : "article",
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
  };
}
