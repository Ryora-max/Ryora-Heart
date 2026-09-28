import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 touch-press",
          {
            "btn-gradient": variant === "default",
            "bg-transparent text-heading hover:bg-surface-warm": variant === "ghost",
            "border border-border-strong text-heading hover:bg-surface-warm bg-surface/50 backdrop-blur-sm":
              variant === "outline",
            "h-9 px-4 py-2 text-sm": size === "sm",
            "h-11 px-6 py-2.5 text-base": size === "md",
            "h-14 px-8 py-3 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
