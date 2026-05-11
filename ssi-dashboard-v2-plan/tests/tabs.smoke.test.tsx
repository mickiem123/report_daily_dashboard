import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DashboardLayout } from "../src/components/Layout";

describe("DashboardLayout tabs", () => {
  it("switches mode by click and keyboard with one active tab", async () => {
    const user = userEvent.setup();
    render(
      <DashboardLayout theme="dark" onToggleTheme={() => {}}>
        {(mode) => <div>Section: {mode}</div>}
      </DashboardLayout>
    );

    const dailyTab = screen.getByRole("tab", { name: "Daily" });
    const weeklyTab = screen.getByRole("tab", { name: "Weekly" });
    const monthlyTab = screen.getByRole("tab", { name: "Monthly" });

    expect(screen.getByText("Section: daily")).toBeInTheDocument();
    expect(dailyTab).toHaveAttribute("data-state", "active");
    expect(screen.getAllByRole("tab", { selected: true })).toHaveLength(1);

    await user.click(weeklyTab);
    expect(screen.getByText("Section: weekly")).toBeInTheDocument();
    expect(weeklyTab).toHaveAttribute("data-state", "active");
    expect(screen.getAllByRole("tab", { selected: true })).toHaveLength(1);

    weeklyTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(monthlyTab).toHaveFocus();
    expect(screen.getByText("Section: monthly")).toBeInTheDocument();
    expect(monthlyTab).toHaveAttribute("data-state", "active");
    expect(screen.getAllByRole("tab", { selected: true })).toHaveLength(1);
  });
});
