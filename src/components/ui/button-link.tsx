import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonLinkProps {
  href: string;
  variant?: "solid" | "outline";
  size?: "md" | "lg";
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** The two button shapes used across the site: filled black and hairline outline. */
export function ButtonLink({ href, variant = "solid", size = "md", external, className, children }: ButtonLinkProps) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors",
    size === "lg" ? "px-5 py-3 text-base" : "px-4 py-2.5 text-sm",
    variant === "solid"
      ? "bg-foreground text-background hover:bg-foreground/90"
      : "border border-border text-foreground hover:bg-black/[0.03]",
    className,
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
