"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid" | "outline";
  active?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      children,
      className,
      size = "md",
      variant = "ghost",
      active,
      tooltipSide = "bottom",
      ...props
    },
    ref
  ) => {
    const sizeClass: Record<NonNullable<typeof size>, string> = {
      sm: "h-7 w-7",
      md: "h-8 w-8",
      lg: "h-9 w-9"
    };
    const variantClass: Record<NonNullable<typeof variant>, string> = {
      ghost:
        "bg-transparent border border-transparent text-fg-secondary hover:bg-surface-1 hover:text-fg-primary",
      solid:
        "bg-surface-2 border border-border-subtle text-fg-primary hover:bg-surface-3",
      outline:
        "bg-surface-2 border border-border-strong text-fg-primary hover:bg-surface-3"
    };
    const button = (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          sizeClass[size],
          variantClass[variant],
          active && "bg-surface-1 text-fg-primary",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>{label}</TooltipContent>
      </Tooltip>
    );
  }
);
IconButton.displayName = "IconButton";
