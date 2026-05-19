import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-sm border border-hairline bg-canvas px-3 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-faint focus:border-hairline-strong focus:outline-none focus:ring-2 focus:ring-primary/35 disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-ink-faint",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
