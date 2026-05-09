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
      className="inline-flex items-center rounded-full border border-teal-300/40 bg-white/10 px-4 py-2 text-sm font-medium text-text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-md transition hover:border-teal-200/70 hover:bg-white/15 hover:shadow-[0_0_24px_rgba(45,212,191,0.2)]"
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
        className="fixed inset-0 bg-black/40 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      <DialogContent className="fixed inset-4 z-50 rounded-2xl border border-white/10 bg-bg-elev/80 p-6 backdrop-blur-xl md:inset-8 md:p-8">
        <div className="relative flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-text-primary transition hover:bg-white/20"
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
