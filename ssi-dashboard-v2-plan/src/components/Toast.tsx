import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast as ToastCard } from "@/components/ui/toast";

type ToastVariant = "saved" | "error";
type ToastItem = { id: number; message: string; variant: ToastVariant };
type ToastContextValue = {
  toastSaved: () => void;
  toastError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function useToastInternal() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toastSaved: () => {},
      toastError: () => {},
    };
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const enqueue = useCallback((message: string, variant: ToastVariant) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 2400);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toastSaved: () => enqueue("Đã lưu", "saved"),
      toastError: (message: string) => enqueue(message, "error"),
    }),
    [enqueue]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col items-end gap-2">
        {items.map((item) => (
          <ToastCard
            key={item.id}
            className={`pointer-events-auto min-w-[200px] rounded-md border bg-canvas shadow-panel ${
              item.variant === "error" ? "border-status-down/35 text-status-down" : "border-hairline text-ink"
            }`}
          >
            {item.message}
          </ToastCard>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToastHelpers() {
  const { toastSaved, toastError } = useToastInternal();
  return { toastSaved, toastError };
}
