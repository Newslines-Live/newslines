import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-base font-normal transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--nl-orange)] text-white hover:bg-[var(--nl-orange-dark)]",
        outline:
          "border border-[var(--nl-orange)] text-[var(--nl-orange)] bg-white hover:bg-[var(--nl-orange)] hover:text-white",
        ghost: "hover:bg-black/5 text-foreground",
        teal: "bg-[var(--nl-teal)] text-white hover:bg-[var(--nl-teal)]/90",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-base",
        sm: "h-9 px-4 text-sm",
        lg: "h-auto px-8 py-3.5 text-xl",
        icon: "size-11",
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
      className={cn("cursor-pointer", buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
