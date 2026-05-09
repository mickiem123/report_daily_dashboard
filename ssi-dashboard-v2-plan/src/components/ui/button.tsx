import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-glass px-3 py-2 text-sm text-text-primary",
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };
