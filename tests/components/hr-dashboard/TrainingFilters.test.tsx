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
      screen.getByPlaceholderText(/Search by title, provider/i)
    ).toBeInTheDocument();
    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(2);
    // Reset button only shown when filters are active
    expect(
      screen.queryByRole("button", { name: /Reset/i })
    ).not.toBeInTheDocument();
  });

  it("updates filters when search input changes", () => {
    vi.useFakeTimers();
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      /Search by title, provider/i
    );
    fireEvent.change(searchInput, { target: { value: "Python" } });

    vi.advanceTimersByTime(300);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Python",
      })
    );
    vi.useRealTimers();
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
    };

    render(
      <TrainingFilters
        filters={initialFilters}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    const resetButton = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it("hides reset button when no filters are active", () => {
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    expect(
      screen.queryByRole("button", { name: /Reset/i })
    ).not.toBeInTheDocument();
  });

  it("shows reset button when filters are active", () => {
    render(
      <TrainingFilters
        filters={{ search: "Python" }}
        onFiltersChange={mockOnFiltersChange}
        isLoading={false}
      />
    );

    expect(screen.getByRole("button", { name: /Reset/i })).toBeInTheDocument();
  });

  it("shows loading state — disables selects", () => {
    render(
      <TrainingFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        isLoading={true}
      />
    );

    const selects = screen.getAllByRole("combobox");
    selects.forEach((s) => expect(s).toBeDisabled());
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
      /Search by title, provider/i
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
      /Search by title, provider/i
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("Python");
  });
});
