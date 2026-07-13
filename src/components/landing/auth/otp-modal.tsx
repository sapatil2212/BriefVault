"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, MailCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

interface OtpModalProps {
  open: boolean;
  email: string;
  /** Verification window in seconds (matches server OTP TTL). */
  ttlSeconds?: number;
  onClose: () => void;
  onVerified: () => void;
}

export function OtpModal({
  open,
  email,
  ttlSeconds = 300,
  onClose,
  onVerified,
}: OtpModalProps) {
  const [digits, setDigits] = React.useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const [verifying, setVerifying] = React.useState(false);
  const [succeeded, setSucceeded] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(ttlSeconds);
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const reset = React.useCallback(() => {
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    setNotice(null);
    setSucceeded(false);
    setSecondsLeft(ttlSeconds);
  }, [ttlSeconds]);

  // Reset + focus when the modal opens.
  React.useEffect(() => {
    if (open) {
      reset();
      const t = setTimeout(() => inputsRef.current[0]?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  // Countdown timer.
  React.useEffect(() => {
    if (!open || succeeded || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [open, succeeded, secondsLeft]);

  const code = digits.join("");
  const expired = secondsLeft <= 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const submit = React.useCallback(
    async (value: string) => {
      if (value.length !== OTP_LENGTH || verifying || succeeded) return;
      setVerifying(true);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: value }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Verification failed.");
          setDigits(Array(OTP_LENGTH).fill(""));
          inputsRef.current[0]?.focus();
          return;
        }
        // Show success state on the button, then continue.
        setSucceeded(true);
        setTimeout(onVerified, 1000);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setVerifying(false);
      }
    },
    [email, verifying, succeeded, onVerified]
  );

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }
    const chars = clean.split("");
    setDigits((prev) => {
      const next = [...prev];
      let i = index;
      for (const ch of chars) {
        if (i >= OTP_LENGTH) break;
        next[i] = ch;
        i++;
      }
      const focusIndex = Math.min(i, OTP_LENGTH - 1);
      inputsRef.current[focusIndex]?.focus();
      const joined = next.join("");
      if (joined.length === OTP_LENGTH) setTimeout(() => submit(joined), 50);
      return next;
    });
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (text) setDigit(0, text);
  };

  const resend = async () => {
    if (resending || succeeded) return;
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't resend the code.");
        return;
      }
      reset();
      inputsRef.current[0]?.focus();
      setNotice(`A new code was sent to ${email}.`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-secondary/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="otp-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-float"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
              className={cn(
                "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                succeeded ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
              )}
            >
              {succeeded ? <Check className="h-7 w-7" /> : <MailCheck className="h-7 w-7" />}
            </motion.div>

            <h2
              id="otp-title"
              className="mt-5 text-center text-xl font-semibold tracking-tight text-foreground"
            >
              {succeeded ? "Email verified" : "Verify your email"}
            </h2>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              {succeeded ? (
                "Your email is verified. Redirecting to sign in…"
              ) : (
                <>
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </>
              )}
            </p>

            {/* OTP boxes */}
            <div className="mt-6 flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  disabled={verifying || expired || succeeded}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  className={cn(
                    "h-12 w-11 rounded-lg border bg-background text-center text-lg font-semibold text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring sm:h-14 sm:w-12",
                    succeeded
                      ? "border-success"
                      : error
                        ? "border-destructive"
                        : digit
                          ? "border-primary"
                          : "border-input focus:border-primary"
                  )}
                />
              ))}
            </div>

            <div className="mt-4 flex min-h-[20px] items-center justify-center">
              {error ? (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  className="text-xs font-medium text-destructive"
                >
                  {error}
                </motion.p>
              ) : notice ? (
                <p className="text-xs font-medium text-success">{notice}</p>
              ) : succeeded ? (
                <p className="text-xs font-medium text-success">
                  You&apos;re all set!
                </p>
              ) : expired ? (
                <p className="text-xs font-medium text-destructive">
                  Code expired. Request a new one.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Code expires in{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {mm}:{ss}
                  </span>
                </p>
              )}
            </div>

            <Button
              className={cn(
                "mt-4 h-11 w-full",
                succeeded && "bg-success text-success-foreground hover:bg-success"
              )}
              disabled={code.length !== OTP_LENGTH || verifying || expired || succeeded}
              onClick={() => submit(code)}
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : succeeded ? (
                <>
                  <Check className="h-4 w-4" />
                  Verified!
                </>
              ) : (
                "Verify & continue"
              )}
            </Button>

            {!succeeded && (
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Didn&apos;t get it?{" "}
                <button
                  type="button"
                  onClick={resend}
                  disabled={resending}
                  className="font-semibold text-primary hover:underline disabled:opacity-60"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
