export const siteConfig = {
  name: "BriefVault",
  title: "BriefVault — Legal Intelligence Platform",
  description:
    "Instantly digest contracts, judgments, compliance reports, and complex documents. Extract key takeaways, risk highlights, deadlines, and citation-backed insights effortlessly.",
  url: "https://briefvault.ai",
  ogImage: "https://briefvault.ai/og.png",
  tagline: "Software that summarizes documents efficiently and saves time.",
  email: "contact.briefvault@gmail.com",
  salesEmail: "contact.briefvault@gmail.com",
  phone: "+91 9168 08 1355",
  location: "Pune, Maharashtra, India",
  twitter: "@briefvault",
  links: {
    twitter: "https://twitter.com/briefvault",
    linkedin: "https://linkedin.com/company/briefvault",
    github: "https://github.com/briefvault",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavColumn = {
  title: string;
  items: NavItem[];
};
