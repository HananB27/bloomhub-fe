import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

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
