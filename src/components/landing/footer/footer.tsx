import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/constants/site";
import { footerNav } from "@/constants/navigation";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          {/* Left Brand Column */}
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              AI-powered legal intelligence that turns lengthy documents into
              citation-backed summaries, risks, deadlines, and answers.
            </p>
          </div>

          {/* Right Navigation & Contact Columns */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* Product & Company Columns */}
            {footerNav.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-foreground">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={`${col.title}-${item.label}`}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Dedicated Contact Column */}
            <div>
              <p className="text-sm font-semibold text-foreground">Contact</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 transition-colors hover:text-foreground"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    <span>{siteConfig.phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="flex items-center gap-2 transition-colors hover:text-foreground"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span>{siteConfig.email}</span>
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>{siteConfig.location}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-14 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Copyright © {new Date().getFullYear()} BriefVault All rights reserved. | A product of Brightwave Digital Products
          </p>
        </div>
      </Container>
    </footer>
  );
}

