import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CollapsibleSidebar } from "@/components/hr-dashboard/CollapsibleSidebar";
import { BarChart3, Calendar } from "lucide-react";

const primaryItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "vacations", label: "Vacations", icon: Calendar },
];

describe("CollapsibleSidebar", () => {
  it("renders expanded with brand and nav labels", () => {
    render(
      <CollapsibleSidebar
        collapsed={false}
        onToggle={() => {}}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={() => {}}
      />
    );

    expect(screen.getByText("Bloomteq")).toBeInTheDocument();
    expect(screen.getByText("HR Management System")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Vacations/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Profile/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Logout/i })).toBeInTheDocument();
  });

  it("calls onToggle when collapse button is clicked", async () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleSidebar
        collapsed={false}
        onToggle={onToggle}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={() => {}}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Collapse sidebar/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("when collapsed shows expand button", async () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleSidebar
        collapsed={true}
        onToggle={onToggle}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={() => {}}
      />
    );

    expect(
      screen.getByRole("button", { name: /Expand sidebar/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Expand sidebar/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect with module id when nav item is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <CollapsibleSidebar
        collapsed={false}
        onToggle={() => {}}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Vacations/i }));
    expect(onSelect).toHaveBeenCalledWith("vacations");
  });

  it("shows notification count badge when count > 0", () => {
    render(
      <CollapsibleSidebar
        collapsed={false}
        onToggle={() => {}}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={() => {}}
        notificationCounts={{ vacations: 5 }}
      />
    );

    const vacationsButton = screen.getByRole("button", { name: /Vacations/i });
    expect(vacationsButton).toHaveTextContent("5");
  });

  it("shows 9+ when notification count exceeds 9", () => {
    render(
      <CollapsibleSidebar
        collapsed={false}
        onToggle={() => {}}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={() => {}}
        notificationCounts={{ dashboard: 12 }}
      />
    );

    const dashboardButton = screen.getByRole("button", { name: /Dashboard/i });
    expect(dashboardButton).toHaveTextContent("9+");
  });

  it("applies active styling to active nav item", () => {
    render(
      <CollapsibleSidebar
        collapsed={false}
        onToggle={() => {}}
        primaryItems={primaryItems}
        activeId="vacations"
        onSelect={() => {}}
      />
    );

    const vacationsBtn = screen.getByRole("button", { name: /Vacations/i });
    expect(vacationsBtn).toHaveClass("bg-[#262626]");
  });

  it("when collapsed shows tooltip on nav item hover", async () => {
    render(
      <CollapsibleSidebar
        collapsed={true}
        onToggle={() => {}}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={() => {}}
      />
    );

    const expandBtn = await screen.findByRole("button", {
      name: /Expand sidebar/i,
    });
    const navList = expandBtn.closest("aside")?.querySelector("ul");
    const firstNavButton = navList?.querySelector("li button");
    if (firstNavButton) {
      fireEvent.mouseEnter(firstNavButton as HTMLElement);
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/Dashboard|Vacations/);
      });
      fireEvent.mouseLeave(firstNavButton as HTMLElement);
    }
  });

  it("when collapsed supports secondary item hover and logout click", async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <CollapsibleSidebar
        collapsed={true}
        onToggle={() => {}}
        primaryItems={primaryItems}
        activeId="dashboard"
        onSelect={onSelect}
      />
    );

    const secondaryList = container.querySelectorAll("ul")[1];
    const [profileButton, logoutButton] = Array.from(
      secondaryList?.querySelectorAll("button") ?? []
    ) as HTMLElement[];

    fireEvent.mouseEnter(profileButton);
    await waitFor(() => {
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });
    fireEvent.mouseLeave(profileButton);

    fireEvent.mouseEnter(logoutButton);
    await waitFor(() => {
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
    fireEvent.click(logoutButton);
    expect(onSelect).toHaveBeenCalledWith("logout");
  });
});
