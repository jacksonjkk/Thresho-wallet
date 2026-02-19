import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold tracking-tight transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer active:scale-[0.98] uppercase",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-t border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:bg-primary/90 hover:translate-y-[-1px] hover:shadow-[0_8px_16px_rgba(99,102,241,0.3)]",
        destructive:
          "bg-destructive text-white border-t border-white/10 hover:bg-destructive/90 hover:shadow-[0_8px_16px_rgba(244,63,94,0.3)]",
        outline:
          "border border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:border-primary/50 hover:text-primary transition-colors",
        secondary:
          "bg-secondary/50 text-secondary-foreground backdrop-blur-md border border-white/5 hover:bg-secondary/80",
        ghost:
          "hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline lowercase",
      },
      size: {
        default: "h-11 px-6 px-4 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base tracking-widest",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
