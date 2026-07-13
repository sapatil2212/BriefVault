# BriefVault — AI-Powered Legal Intelligence Platform

A modern, premium, enterprise-grade SaaS marketing website for **BriefVault**, an
AI platform that turns lengthy legal documents into citation-backed summaries,
insights, deadlines, risks, and answers.

> This is the **marketing website only** — architected to be ready for future
> dashboard integration.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a CSS-first design system
- **Shadcn-style UI** primitives (Radix UI)
- **Framer Motion / Motion** for animation
- **Lenis** smooth scroll
- **Embla Carousel**, **React CountUp**
- **React Hook Form** + **Zod** + **Sonner** for the contact form
- **next-themes** (light/dark), **Lucide React** + **React Icons**
- **Figtree** typeface via `next/font/google`

## Getting Started

```bash
npm install --legacy-peer-deps
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production build
```

## Project Structure

```
src/
  app/                     # App Router
    (marketing)/           # Route group with shared Navbar + Footer
      page.tsx             # Home
      features/            # Detailed features page
      solutions/           # Industry solutions
      pricing/             # Pricing + comparison
      about/               # Mission, vision, story, values
      contact/             # Contact form + book a demo
      resources/           # Blog / docs / FAQ placeholders
    (auth)/                # Minimal-chrome auth layout (no navbar/footer)
      signin/  signup/     # Dedicated sign in / sign up pages
    sitemap.ts, robots.ts  # SEO
  components/
    landing/               # Marketing sections & feature components
      navbar/  footer/  hero/  sections/  feature-card/
      pricing-card/  testimonial/  faq/  workflow/  stats/  contact/
    shared/                # Reusable cross-page building blocks
    ui/                    # Design-system primitives (button, card, ...)
  constants/               # Site config + navigation
  data/                    # Content data (features, solutions, testimonials…)
  hooks/                   # Reusable hooks
  lib/                     # Utilities (cn)
  types/                   # Shared TypeScript types
```

## Design System

Defined in `src/app/globals.css` using Tailwind v4 `@theme` tokens.

| Token       | Value     |
| ----------- | --------- |
| Primary     | `#1E40AF` |
| Accent      | `#2563EB` |
| Secondary   | `#0F172A` |
| Success     | `#10B981` |

Typography is **Figtree** via `next/font/google`. The aesthetic is minimal,
professional, and enterprise-grade: white background, subtle gray sections,
rounded cards, **flat borders instead of shadows**, and restrained animation.
Elevation (`shadow-float`) is reserved for genuinely floating elements like the
hero product mockup, dropdown menus, and the primary CTA.

## Features

- Fully responsive (mobile → desktop) with an accessible mega-menu navbar
- Light/dark theme, smooth scrolling, viewport-triggered animations
- SEO: metadata, OpenGraph, Twitter cards, JSON-LD schema, sitemap & robots
- Reusable component architecture with server components by default
- Static rendering across all marketing pages for high performance

## Notes

- Pricing uses **Contact Sales** — no hardcoded prices.
- The contact form is wired with validation and toast feedback; connect it to
  your API/CRM in `src/components/landing/contact/contact-form.tsx`.
