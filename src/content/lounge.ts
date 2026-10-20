// The Access Lounge. No episodes have been published yet, so every entry is a
// clearly labelled placeholder. The shape matches what an RSS <item> provides
// (title, description, pubDate, enclosure url, duration), so a feed parser can
// replace this array at build time without changing the UI.

export type Episode = {
  slug: string;
  title: string;
  description: string;
  status: "placeholder" | "published";
  pubDate?: string;      // ISO date, from <pubDate>
  audioUrl?: string;     // from <enclosure url>
  duration?: string;     // from <itunes:duration>
  topics: string[];
};

export const lounge = {
  title: "The Access Lounge",
  tagline: "Identity. Cybersecurity. Real conversations.",
  pillars: ["People", "Technology", "Security", "Opportunity"],
  cover: {
    src: "/podcast/optimized/access-lounge-cover-1200.webp",
    srcSmall: "/podcast/optimized/access-lounge-cover-640.webp",
    width: 1200,
    height: 1200,
    alt: "The Access Lounge podcast cover: two hosts with headphones at studio microphones under the show title, with the words Identity, Security, Opportunity and Careers.",
  },
  intro:
    "A planned podcast about identity and access management: how access really gets granted, reviewed and removed, and how people find their way into identity security.",
  // Populated when an RSS feed exists. Leave empty until then.
  rssUrl: null as string | null,
  platforms: [] as { name: string; href: string }[],
};

export const episodes: Episode[] = [
  {
    slug: "placeholder-1",
    title: "Joiner, mover, leaver in plain English",
    description: "Planned topic. Why access should follow the person, and what breaks when it does not.",
    status: "placeholder",
    topics: ["Lifecycle", "Least privilege"],
  },
  {
    slug: "placeholder-2",
    title: "Role versus scope",
    description: "Planned topic. What an Entra role decides, what an Administrative Unit decides, and why both matter.",
    status: "placeholder",
    topics: ["Privileged access", "Delegation"],
  },
  {
    slug: "placeholder-3",
    title: "Break glass, carefully",
    description: "Planned topic. Emergency-access accounts and the cleanup nobody likes to document.",
    status: "placeholder",
    topics: ["Emergency access", "Governance"],
  },
];
