"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/constants/navigation";

export function MobileNav({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden border-b border-border glass lg:hidden"
        >
          <div className="max-h-[calc(100vh-4rem)] space-y-4 overflow-y-auto px-6 py-6">
            <div className="space-y-1">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md py-2.5 text-base font-medium text-foreground hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

