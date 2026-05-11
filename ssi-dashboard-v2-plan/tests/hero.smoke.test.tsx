import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { Hero } from "../src/components/Hero";

vi.mock("../src/components/BgPattern", () => ({
  BgPattern: () => <div data-testid="bg-pattern" />,
}));
vi.mock("../src/components/Section", () => ({
  Section: ({ mode }: { mode: string }) => <div>{`Section: ${mode}`}</div>,
}));

describe("Hero", () => {
  beforeEach(() => {
    import.meta.env.VITE_WRITE_PASSWORD = "secret";
  });

  it("renders title, subtitle, and password form with focus on mount", () => {
    render(<Hero onUnlock={() => {}} />);

    expect(screen.getByRole("heading", { name: "SSI Báo Cáo" })).toBeInTheDocument();
    expect(screen.getByText("Live dashboard · Báo cáo theo ngày, tuần, tháng")).toBeInTheDocument();

    const input = screen.getByLabelText("Mật khẩu");
    expect(input).toHaveFocus();
  });

  it("shows error, clears input, and marks invalid on wrong password", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();

    render(<Hero onUnlock={onUnlock} />);
    const input = screen.getByLabelText("Mật khẩu");

    await user.type(input, "wrong");
    await user.click(screen.getByRole("button", { name: "Vào hệ thống" }));

    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.getByText("Sai mật khẩu")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("calls onUnlock on correct password", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();

    render(<Hero onUnlock={onUnlock} />);
    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Vào hệ thống" }));

    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});

describe("App", () => {
  beforeEach(() => {
    import.meta.env.VITE_WRITE_PASSWORD = "secret";
  });

  it("shows Hero before unlock, then dashboard layout content after unlock, with background still mounted", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    expect(screen.getByTestId("bg-pattern")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "SSI Báo Cáo" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Vào hệ thống" }));

    expect(screen.getByText("Section: daily")).toBeInTheDocument();
    expect(screen.getByTestId("bg-pattern")).toBeInTheDocument();
  });
});
