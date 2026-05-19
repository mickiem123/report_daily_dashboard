import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddProductCard } from "@/components/AddProductCard";
import { StructureDialog } from "@/components/StructureDialog";
import type { ProductDefinition } from "@/lib/product-metadata";

describe("structure editing UI", () => {
  it("submits a product name from the add-product tile", () => {
    const onAddProduct = vi.fn();

    render(<AddProductCard onAddProduct={onAddProduct} isSaving={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Thêm card sản phẩm" }));
    fireEvent.change(screen.getByLabelText("Tên sản phẩm"), { target: { value: "VIP" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo card" }));

    expect(onAddProduct).toHaveBeenCalledWith({ name: "VIP" });
  });

  it("submits a metric for a product", () => {
    const onAddMetric = vi.fn();
    const product: ProductDefinition = {
      id: "p1",
      key: "vip",
      name: "VIP",
      headline_metric_id: null,
      sort_order: 1,
      is_visible: true,
    };

    render(
      <StructureDialog
        open
        mode="add_metric"
        product={product}
        isSaving={false}
        onOpenChange={vi.fn()}
        onAddMetric={onAddMetric}
        onDeleteMetric={vi.fn()}
        onDeleteProduct={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Tên metric"), { target: { value: "Dư nợ VIP" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo metric" }));

    expect(onAddMetric).toHaveBeenCalledWith({
      label: "Dư nợ VIP",
      unit: "tỷ",
      product_id: "p1",
      placement: "normal",
      is_inverse: false,
    });
  });
});
