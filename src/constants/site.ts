export const siteConfig = {
  name: "BriefVault",
  title: "BriefVault — AI-Powered Legal Intelligence Platform",
  description:
    "Upload judgments, circulars, notifications, contracts, and compliance documents. Get instant summaries, legal insights, deadlines, risks, and citation-backed answers powered by AI.",
  url: "https://briefvault.ai",
  ogImage: "https://briefvault.ai/og.png",
  tagline: "AI That Understands Legal Documents in Minutes, Not Hours.",
  email: "contact.primeinbox@gmail.com",
  salesEmail: "contact.primeinbox@gmail.com",
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
