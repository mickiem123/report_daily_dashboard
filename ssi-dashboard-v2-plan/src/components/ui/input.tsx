import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn("h-9 w-full rounded-md border border-glass bg-bg-elev px-3 text-sm text-text-primary", className)}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
