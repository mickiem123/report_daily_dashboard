import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AddProductPayload } from "@/data/schema-admin";

type AddProductCardProps = {
  onAddProduct: (payload: AddProductPayload) => void | Promise<void>;
  isSaving: boolean;
};

export function AddProductCard({ onAddProduct, isSaving }: AddProductCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <>
      <button
        type="button"
        aria-label="Thêm card sản phẩm"
        onClick={() => setOpen(true)}
        className="flex min-h-[312px] w-full items-center justify-center rounded-xl border border-dashed border-hairline-strong bg-canvas-soft text-ink-mute transition hover:border-primary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Plus size={18} aria-hidden />
          Thêm card
        </span>
      </button>
      {open ? (
        <Dialog>
          <DialogContent className="mx-auto max-w-md">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = name.trim();
                if (!trimmed) return;
                void onAddProduct({ name: trimmed });
              }}
            >
              <h2 className="text-base font-semibold text-ink">Thêm card sản phẩm</h2>
              <label className="block space-y-2 text-sm text-ink-mute">
                <span>Tên sản phẩm</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm border border-hairline px-4 py-2 text-sm text-ink"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={!name.trim() || isSaving}>
                  Tạo card
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
