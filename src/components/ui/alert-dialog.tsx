import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AlertDialog({ open, children }: { open: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  if (!open) return null;
  return <>{children}</>;
}

export function AlertDialogContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20" />
      <div className={cn("relative w-full max-w-md rounded-lg border border-hairline bg-canvas p-6 text-ink shadow-modal", className)}>{children}</div>
    </div>
  );
}

export function AlertDialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-medium text-ink", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-ink-mute", className)} {...props} />;
}

export function AlertDialogCancel({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-sm border border-hairline-strong bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        className
      )}
      {...props}
    />
  );
}

export function AlertDialogAction({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-sm border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35",
        className
      )}
      {...props}
    />
  );
}
