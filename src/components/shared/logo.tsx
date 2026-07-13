import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/constants/site";
import logoImg from "@/assets/bv-logo.png";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <Image 
        src={logoImg} 
        alt={siteConfig.name} 
        width={180} 
        height={50}
        priority
        className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
      />
    </Link>
  );
}
