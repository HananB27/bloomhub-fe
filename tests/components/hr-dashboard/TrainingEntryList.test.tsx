import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrainingEntryList } from "@/components/hr-dashboard/training/TrainingEntryList";
import type { TrainingEntry } from "@/types/training";

describe("TrainingEntryList", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockEntries: TrainingEntry[] = [
    {
      id: 1,
      courseTitle: "Python Course",
      provider: "Udemy",
      trainingType: "course",
      trainingTypeDisplay: "Course",
      trainingDate: "2025-01-15",
      cost: 50,
      status: "completed",
      createdAt: "2025-01-20T10:00:00Z",
      updatedAt: "2025-01-20T10:00:00Z",
      employeeId: 1,
      employeeName: "John Doe",
      completedAt: "2025-01-20T10:00:00Z",
      description: "Learned Python basics",
    },
    {
      id: 2,
      courseTitle: "React Workshop",
      provider: "Frontend Masters",
      trainingType: "workshop",
      trainingTypeDisplay: "Workshop",
      trainingDate: "2025-02-10",
      cost: 100,
      status: "in-progress",
      createdAt: "2025-02-11T10:00:00Z",
      updatedAt: "2025-02-11T10:00:00Z",
      employeeId: 1,
      employeeName: "John Doe",
      completedAt: undefined,
      description: "Learning React fundamentals",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders training entries in a table", () => {
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText("Python Course")).toBeInTheDocument();
    expect(screen.getByText("React Workshop")).toBeInTheDocument();
  });

  it("displays provider information", () => {
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText("Udemy")).toBeInTheDocument();
    expect(screen.getByText("Frontend Masters")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={true}
        canDelete={true}
      />
    );

    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockEntries[0]);
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={true}
        canDelete={true}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockEntries[0]);
  });

  it("hides edit and delete buttons when canEdit and canDelete are false", () => {
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={false}
        canDelete={false}
      />
    );

    const editButtons = screen.queryAllByRole("button", { name: /Edit/i });
    const deleteButtons = screen.queryAllByRole("button", { name: /Delete/i });

    expect(editButtons.length).toBe(0);
    expect(deleteButtons.length).toBe(0);
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText("Loading training entries...")).toBeInTheDocument();
  });

  it("displays empty state message when no entries", () => {
    render(
      <TrainingEntryList
        entries={[]}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText(/No training entries found/i)).toBeInTheDocument();
  });

  it("disables delete button while deleting", () => {
    const isDeleting = { 1: true };
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={isDeleting}
        canEdit={true}
        canDelete={true}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    expect(deleteButtons[0]).toBeDisabled();
  });

  it("renders table headers correctly", () => {
    render(
      <TrainingEntryList
        entries={mockEntries}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={{}}
        canEdit={true}
        canDelete={true}
      />
    );

    // Get all headers from the table header
    const headers = screen.getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent);

    expect(headerTexts).toContain("Course");
    expect(headerTexts).toContain("Provider");
    expect(headerTexts).toContain("Type");
    expect(headerTexts).toContain("Date");
    expect(headerTexts).toContain("Status");
    expect(headerTexts).toContain("Cost");
  });
});
