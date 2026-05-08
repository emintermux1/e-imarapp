"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right" | "bottom";
  width?: number | string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * Lightweight Sheet — uses Radix Dialog for a11y/focus trap and adds a
 * motion-driven slide animation. Used for mobile drawers.
 */
export function Sheet({
  open,
  onOpenChange,
  side = "left",
  width = 320,
  children,
  className,
  ariaLabel
}: SheetProps) {
  const sideStyles = (() => {
    if (side === "left") return { left: 0, top: 0, bottom: 0, width };
    if (side === "right") return { right: 0, top: 0, bottom: 0, width };
    return { left: 0, right: 0, bottom: 0, height: "auto" };
  })();
  const initial = side === "left" ? { x: "-100%" } : side === "right" ? { x: "100%" } : { y: "100%" };
  const animate = side === "bottom" ? { y: 0 } : { x: 0 };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-[rgb(0_0_0/0.45)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              aria-label={ariaLabel}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                style={sideStyles as React.CSSProperties}
                className={cn(
                  "fixed z-50 bg-surface-2 border-border-subtle shadow-pop flex flex-col",
                  side === "left" && "border-r",
                  side === "right" && "border-l",
                  side === "bottom" && "border-t rounded-t-md",
                  className
                )}
                initial={initial}
                animate={animate}
                exit={initial}
                transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export const SheetTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <DialogPrimitive.Title className={cn("text-sm font-semibold text-fg-primary", className)}>
    {children}
  </DialogPrimitive.Title>
);
