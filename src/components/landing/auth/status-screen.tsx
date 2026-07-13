"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, XCircle, Ban, MessageSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ContactForm } from "@/components/landing/contact/contact-form";

/**
 * Full-page account-status screens shown when a non-active user is blocked from
 * the dashboard (pending approval / rejected / suspended).
 */
type Variant = "pending" | "rejected" | "suspended";

const VARIANTS: Record<
  Variant,
  { icon: LucideIcon; iconClass: string; badge: string; badgeClass: string }
> = {
  pending: {
    icon: Clock,
    iconClass: "bg-amber-500/10 text-amber-600",
    badge: "🟡 Pending approval",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  rejected: {
    icon: XCircle,
    iconClass: "bg-rose-500/10 text-rose-600",
    badge: "🔴 Not approved",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  suspended: {
    icon: Ban,
    iconClass: "bg-rose-500/10 text-rose-600",
    badge: "⛔ Suspended",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
};

export function StatusScreen({
  variant,
  title,
  children,
}: {
  variant: Variant;
  title: string;
  children: React.ReactNode;
}) {
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);
  const v = VARIANTS[variant];
  const Icon = v.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-float sm:p-10">
        <div
          className={cn(
            "mx-auto flex h-20 w-20 items-center justify-center rounded-2xl",
            v.iconClass,
            variant === "pending" && "animate-pulse"
          )}
        >
          <Icon className={cn("h-10 w-10", variant === "pending" && "animate-bounce")} />
        </div>

        <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>

        <div className="mt-6 flex items-center justify-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              v.badgeClass
            )}
          >
            {v.badge}
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/">Go to home</Link>
          </Button>
          <Button onClick={() => setSupportModalOpen(true)} className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Contact support
          </Button>
        </div>
      </div>

      {/* Contact Support Modal */}
      <Dialog open={supportModalOpen} onOpenChange={setSupportModalOpen}>
        <DialogContent className="max-w-lg" onClose={() => setSupportModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Contact Support Team</DialogTitle>
            <DialogDescription>
              Need assistance or want to expedite your approval request? Send our team a message below.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <ContactForm />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
