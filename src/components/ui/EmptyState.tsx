"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, emoji, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)} role="status" aria-live="polite">
      {emoji && <span className="text-6xl mb-4 animate-breathe">{emoji}</span>}
      {Icon && !emoji && <Icon className="w-12 h-12 text-text-muted mb-4" />}
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      {description && <p className="text-text-secondary text-sm max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
