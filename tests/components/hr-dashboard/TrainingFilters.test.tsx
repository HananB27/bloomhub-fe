import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrainingFilters } from "@/components/hr-dashboard/training/TrainingFilters";

describe("TrainingFilters", () => {
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter controls", () => {
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    expect(
      screen.getByPlaceholderText(/Course title, provider.../i)
    ).toBeInTheDocument();
    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole("button", { name: /Reset Filters/i })
    ).toBeInTheDocument();
  });

  it("updates filters when search input changes", () => {
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      /Course title, provider.../i
    );
    fireEvent.change(searchInput, { target: { value: "Python" } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Python",
      })
    );
  });

  it("updates filters when training type changes", () => {
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    const selects = screen.getAllByRole("combobox");
    const typeSelect = selects[0];
    fireEvent.change(typeSelect, { target: { value: "course" } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        trainingType: "course",
      })
    );
  });

  it("resets all filters when reset button is clicked", () => {
    const initialFilters = {
      search: "Python",
      training_type: "course",
      year: "2025",
    };

    render(
      <TrainingFilters
        filters={initialFilters}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    const resetButton = screen.getByRole("button", { name: /Reset Filters/i });
    fireEvent.click(resetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it("disables reset button when no filters are active", () => {
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    const resetButton = screen.getByRole("button", { name: /Reset Filters/i });
    expect(resetButton).toBeDisabled();
  });

  it("enables reset button when filters are active", () => {
    render(
      <TrainingFilters
        filters={{ search: "Python" }}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    const resetButton = screen.getByRole("button", { name: /Reset Filters/i });
    expect(resetButton).not.toBeDisabled();
  });

  it("shows loading state", () => {
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={true}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      /Course title, provider.../i
    ) as HTMLInputElement;
    expect(searchInput).toBeDisabled();
  });

  it("preserves filter values between renders", () => {
    const filters = { search: "Python", trainingType: "course" as const };
    const { rerender } = render(
      <TrainingFilters
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    let searchInput = screen.getByPlaceholderText(
      /Course title, provider.../i
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("Python");

    rerender(
      <TrainingFilters
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    searchInput = screen.getByPlaceholderText(
      /Course title, provider.../i
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("Python");
  });
});
