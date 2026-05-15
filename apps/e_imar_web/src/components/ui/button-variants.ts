import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tabular-nums transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:translate-y-px active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-fg-primary text-bg hover:bg-fg-secondary border border-transparent",
        primary:
          "bg-brand-green text-white border border-brand-green hover:bg-[rgb(var(--accent-green)/0.92)] shadow-[0_16px_36px_-24px_rgb(var(--accent-green)/0.95)]",
        secondary:
          "bg-surface-2 text-fg-primary border border-border-strong hover:bg-white",
        outline:
          "bg-transparent text-fg-primary border border-border-strong hover:bg-surface-2",
        ghost:
          "bg-transparent text-fg-primary border border-transparent hover:bg-surface-2",
        link: "bg-transparent border-none text-brand-blue underline-offset-4 hover:underline px-0 h-auto",
        danger:
          "bg-status-error text-white border border-status-error hover:bg-[rgb(var(--status-error)/0.9)]"
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-full",
        md: "h-10 px-4 rounded-full",
        lg: "h-12 px-5 rounded-full",
        icon: "h-9 w-9 rounded-full"
      }
    },
    defaultVariants: {
      variant: "secondary",
      size: "md"
    }
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
