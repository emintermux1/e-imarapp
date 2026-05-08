import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tabular-nums transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-fg-primary text-bg hover:bg-fg-secondary border border-transparent",
        primary:
          "bg-brand-red text-white border border-brand-red hover:bg-[rgb(var(--accent-red)/0.92)]",
        secondary:
          "bg-surface-2 text-fg-primary border border-border-strong hover:bg-surface-3",
        outline:
          "bg-transparent text-fg-primary border border-border-strong hover:bg-surface-2",
        ghost:
          "bg-transparent text-fg-primary border border-transparent hover:bg-surface-2",
        link: "bg-transparent border-none text-brand-blue underline-offset-4 hover:underline px-0 h-auto",
        danger:
          "bg-status-error text-white border border-status-error hover:bg-[rgb(var(--status-error)/0.9)]"
      },
      size: {
        sm: "h-8 px-2.5 text-xs rounded",
        md: "h-9 px-3 rounded",
        lg: "h-10 px-4 rounded-md",
        icon: "h-8 w-8 rounded"
      }
    },
    defaultVariants: {
      variant: "secondary",
      size: "md"
    }
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
