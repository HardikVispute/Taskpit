import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent text-xs font-mono tracking-tight whitespace-nowrap transition-colors outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white border border-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:border-white dark:hover:bg-neutral-200 active:translate-y-px",
        outline:
          "border border-black dark:border-white bg-transparent text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black active:translate-y-px",
        secondary:
          "bg-neutral-100 text-neutral-900 border border-neutral-300 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 active:translate-y-px",
        ghost:
          "hover:bg-neutral-100 dark:hover:bg-neutral-900 text-foreground",
        destructive:
          "bg-black text-white border border-black hover:bg-neutral-800 dark:bg-white dark:text-black",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 gap-2",
        xs: "h-6 px-2 text-[10px] gap-1",
        sm: "h-7 px-2.5 text-[11px] gap-1.5",
        lg: "h-11 px-5 text-sm gap-2.5",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
