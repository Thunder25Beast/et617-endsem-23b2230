// One button for the whole app. Big tap targets (min 48px, usually 56px) for an 8 inch tablet.
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const btn = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold select-none transition-transform active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[var(--shadow-press)] active:shadow-none",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_4px_0_0_var(--accent-foreground)] active:shadow-none",
        outline: "bg-card text-foreground border-2 border-input shadow-[var(--shadow-key)] active:shadow-none",
        soft: "bg-accent text-accent-foreground border-2 border-transparent",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        choice: "bg-card text-foreground border-2 border-input shadow-[var(--shadow-key)] active:shadow-none text-2xl",
        chosen: "bg-accent text-accent-foreground border-2 border-secondary shadow-[0_3px_0_0_var(--secondary)]",
      },
      size: {
        lg: "min-h-14 px-6 text-lg",
        md: "min-h-12 px-4 text-base",
        sm: "min-h-10 px-3 text-sm",
        icon: "h-12 w-12 text-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>;

export function Btn({ className, variant, size, type = "button", ...rest }: Props) {
  return <button type={type} className={cn(btn({ variant, size }), className)} {...rest} />;
}
