import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Mode } from "@/lib/types";

type RefreshButtonProps = { mode: Mode };

const MODE_NAMES: Record<Mode, string> = {
  daily: "ngày",
  weekly: "tuần",
  monthly: "tháng",
};

export function RefreshButton({ mode }: RefreshButtonProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const isCooldown = now < cooldownUntil;

  useEffect(() => {
    if (!isCooldown) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCooldown]);

  const handleConfirm = async () => {
    await queryClient.invalidateQueries({ queryKey: [mode] });
    setCooldownUntil(Date.now() + 5000);
    setNow(Date.now());
    setConfirmOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isCooldown}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-hairline-strong bg-canvas px-4 text-sm font-medium text-ink transition hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw size={16} aria-hidden />
        Tải lại
      </button>
      <AlertDialog open={confirmOpen}>
        <AlertDialogContent className="rounded-xl border-hairline bg-canvas p-6 shadow-modal">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medium text-ink">Xác nhận tải lại</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-mute">{`Tải lại dữ liệu ${MODE_NAMES[mode]}?`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              className="rounded-md border-hairline-strong bg-canvas px-4 py-2 text-sm font-medium text-ink hover:bg-canvas-soft focus-visible:ring-primary/50"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:border-primary-deep hover:bg-primary-deep focus-visible:ring-primary/50"
            >
              Tải lại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
