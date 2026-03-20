import * as React from "react";

import { cn } from "@/lib/utils";

const variants = {
  default: "bg-white/10 text-white hover:bg-white/15",
  success: "bg-emerald-500/15 text-emerald-200",
  warning: "bg-amber-500/15 text-amber-200",
  danger: "bg-red-500/15 text-red-200",
} as const;

export type BadgeVariant = keyof typeof variants;

export function Badge({
  variant = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-white/10",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

