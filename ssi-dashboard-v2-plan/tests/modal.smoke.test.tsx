import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/Modal";

describe("Modal", () => {
  it("does not render content when closed", () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()} title="Nhập liệu ngày">
        <div>Grid goes here (T14)</div>
      </Modal>,
    );

    expect(screen.queryByText("Nhập liệu ngày")).not.toBeInTheDocument();
    expect(screen.queryByText("Grid goes here (T14)")).not.toBeInTheDocument();
  });

  it("renders title and children when open", () => {
    render(
      <Modal open onOpenChange={vi.fn()} title="Nhập liệu tuần">
        <div>Grid goes here (T14)</div>
      </Modal>,
    );

    expect(screen.getByText("Nhập liệu tuần")).toBeInTheDocument();
    expect(screen.getByText("Grid goes here (T14)")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) on X click", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Modal open onOpenChange={onOpenChange} title="Nhập liệu tháng">
        <div>Grid goes here (T14)</div>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) on Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Modal open onOpenChange={onOpenChange} title="Nhập liệu ngày">
        <div>Grid goes here (T14)</div>
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders light modal panel chrome", () => {
    const { container } = render(
      <Modal open onOpenChange={vi.fn()} title="Nhập liệu ngày">
        <div>Grid goes here (T14)</div>
      </Modal>,
    );

    expect(container.querySelector(".bg-canvas")).toBeInTheDocument();
    expect(container.querySelector(".shadow-modal")).toBeInTheDocument();
    expect(container.querySelector(".md\\:inset-8")).toBeInTheDocument();
  });
});
