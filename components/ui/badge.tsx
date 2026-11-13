import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
        secondary:
          "border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
        destructive:
          "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
        outline: "border-black dark:border-white text-foreground bg-transparent",
        success:
          "border-black bg-transparent text-black dark:border-white dark:text-white font-semibold",
        warning:
          "border-black bg-transparent text-black dark:border-white dark:text-white font-semibold",
        danger:
          "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
