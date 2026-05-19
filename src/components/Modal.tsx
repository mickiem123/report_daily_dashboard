import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

type NhapLieuButtonProps = {
  onClick: () => void;
};

export function NhapLieuButton({ onClick }: NhapLieuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium leading-none text-on-primary transition hover:border-primary-deep hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      Nhập liệu
    </button>
  );
}

export function Modal({ open, onOpenChange, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <Dialog>
      <div
        role="presentation"
        className="fixed inset-0 z-40 bg-ink/12"
        onClick={() => onOpenChange(false)}
      />
      <DialogContent className="fixed inset-3 z-50 rounded-xl border border-hairline bg-canvas p-5 shadow-modal md:inset-8 md:p-8">
        <div className="relative flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-hairline pb-4">
            <h2 className="text-[22px] font-medium leading-[1.2] text-ink">{title}</h2>
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-hairline-strong bg-canvas text-ink-mute transition hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <X size={20} />
            </button>
          </div>
          <div className="relative flex h-full flex-col">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
