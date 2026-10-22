import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { pageMeta, SITE_URL } from "@/lib/site-meta";
import "@/vendor/scrollcraft/scrollcraft.css";
import "./globals.css";
import "./cinematic.css";
import "./privilege.css";
import "./lifecycle.css";
import "./vault.css";
import "./about.css";
import "./portal.css";
import "./lounge.css";

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const text = Geist({ subsets: ["latin"], variable: "--font-text", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const description =
  "Cameron Johnson, Identity & Access Management. Evidence-based Microsoft Entra ID case studies in privileged access, scoped administration and joiner-mover-leaver lifecycle, from the Cashville Financial Group IAM lab.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMeta({ title: "Cameron Johnson | Identity & Access Management", description, path: "/" }),
  authors: [{ name: "Cameron Johnson", url: "https://www.linkedin.com/in/cameron-johnson615/" }],
  keywords: [
    "Identity and Access Management", "IAM", "Microsoft Entra ID", "Identity Governance",
    "Joiner Mover Leaver", "RBAC", "Privileged Identity Management", "Least Privilege", "SC-300",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0c1310",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Lets the hero lay out its pinned form before hydration, so there is no jump. On the home page,
            a #hash load, refresh or return jumps instead of gliding through acts that are not built yet;
            lib/landing.ts lands the position once the engine has sized them and restores smooth scrolling. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(d){d.classList.add('js');try{var n=performance.getEntriesByType('navigation')[0];if(location.pathname==='/'&&(location.hash||(n&&n.type!=='navigate')))d.style.scrollBehavior='auto'}catch(e){}})(document.documentElement)" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
