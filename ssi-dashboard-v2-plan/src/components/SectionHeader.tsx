import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
        className="inline-flex items-center rounded-full border border-teal-300/40 bg-white/10 px-4 py-2 text-sm font-medium text-text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-md transition hover:border-teal-200/70 hover:bg-white/15 hover:shadow-[0_0_24px_rgba(45,212,191,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        ↻ Tải lại
      </button>
      <AlertDialog open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận tải lại</AlertDialogTitle>
            <AlertDialogDescription>{`Tải lại dữ liệu ${MODE_NAMES[mode]}?`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Tải lại</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
