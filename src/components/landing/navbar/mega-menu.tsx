"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { NavColumn, NavItem } from "@/constants/site";
import { Container } from "@/components/shared/container";

interface MegaMenuProps {
  open: boolean;
  variant: "features" | "solutions";
  columns?: NavColumn[];
  items?: NavItem[];
}

export function MegaMenu({ open, variant, columns, items }: MegaMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute inset-x-0 top-full pt-3"
        >
          <Container>
            <div className="overflow-hidden rounded-lg border border-border bg-popover shadow-float">
              {variant === "features" && columns && (
                <div className="grid gap-8 p-6 md:grid-cols-2">
                  {columns.map((col) => (
                    <div key={col.title}>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {col.title}
                      </p>
                      <ul className="space-y-1">
                        {col.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="group flex flex-col rounded-md px-3 py-2 transition-colors hover:bg-muted"
                            >
                              <span className="text-sm font-medium text-foreground">
                                {item.label}
                              </span>
                              {item.description && (
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {variant === "solutions" && items && (
                <div className="grid gap-1 p-6 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex flex-col rounded-md p-3 transition-colors hover:bg-muted"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="mt-0.5 text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border bg-muted/50 px-6 py-3">
                <p className="text-xs text-muted-foreground">
                  {variant === "features"
                    ? "Explore the full intelligence suite"
                    : "Built for every legal and compliance team"}
                </p>
                <Link
                  href={variant === "features" ? "/features" : "/solutions"}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5 transition-all"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
