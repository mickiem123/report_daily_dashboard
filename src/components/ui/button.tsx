import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium leading-none text-on-primary shadow-subtle transition-colors hover:border-primary-deep hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };
