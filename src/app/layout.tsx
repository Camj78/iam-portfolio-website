import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "@/vendor/scrollcraft/scrollcraft.css";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const text = Geist({ subsets: ["latin"], variable: "--font-text", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const description =
  "Cameron Johnson, Identity & Access Management. Evidence-based Microsoft Entra ID case studies in privileged access, joiner-mover-leaver lifecycle, RBAC and access certification.";

export const metadata: Metadata = {
  metadataBase: new URL("https://iam-portfolio-website.vercel.app"),
  title: "Cameron Johnson | Identity & Access Management",
  description,
  authors: [{ name: "Cameron Johnson", url: "https://www.linkedin.com/in/cameron-johnson615/" }],
  keywords: [
    "Identity and Access Management", "IAM", "Microsoft Entra ID", "Identity Governance",
    "Joiner Mover Leaver", "RBAC", "Privileged Identity Management", "Least Privilege", "SC-300",
  ],
  openGraph: {
    title: "Cameron Johnson | Identity & Access Management",
    description,
    type: "profile",
    images: [{ url: "/aria/optimized/aria-front-760.webp", width: 760, height: 941, alt: "A.R.I.A., a felt puppet in a tan suit and green striped tie" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0c1310",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
