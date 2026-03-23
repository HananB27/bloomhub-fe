import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { describe, it, expect, vi } from "vitest";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        name: "John Doe",
        email: "john.doe@bloomteq.com",
        image: "https://example.com/avatar.jpg",
      },
    },
    status: "authenticated",
  })),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe("Home", () => {
  it("renders the HR dashboard shell", () => {
    render(<Home />);

    // Sidebar brand
    expect(screen.getAllByText(/Bloomteq/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/HR Management System/i)).toBeInTheDocument();

    // One of the main modules (at least one "Vacations" label)
    expect(screen.getAllByText(/Vacations/i).length).toBeGreaterThan(0);
  });
});
