import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrainingEntryForm } from "@/components/hr-dashboard/training/TrainingEntryForm";

// Mock the API
vi.mock("@/lib/api/training", () => ({
  createTrainingEntry: vi.fn(),
  updateTrainingEntry: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TrainingEntryForm", () => {
  const mockAccessToken = "test-token";
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields correctly", () => {
    render(
      <TrainingEntryForm
        accessToken={mockAccessToken}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/Course Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Provider/i)).toBeInTheDocument();
    // Training Type is now a chip selector; the hidden select keeps the label association
    expect(screen.getByLabelText(/Training Type/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Entry/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", () => {
    render(
      <TrainingEntryForm
        accessToken={mockAccessToken}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole("button", { name: /Add Entry/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/Course title is required/i)).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <TrainingEntryForm
        accessToken={mockAccessToken}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("pre-fills form when editing an entry", () => {
    const editingEntry = {
      id: 1,
      courseTitle: "Advanced Python",
      provider: "Coursera",
      trainingType: "course" as const,
      trainingTypeDisplay: "Course",
      trainingDate: "2025-01-15",
      cost: 100,
      status: "completed" as const,
      createdAt: "2025-01-20T10:00:00Z",
      updatedAt: "2025-01-20T10:00:00Z",
      employeeId: 1,
      employeeName: "John",
      completedAt: "2025-01-20T10:00:00Z",
      description: "Test description",
    };

    render(
      <TrainingEntryForm
        accessToken={mockAccessToken}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        editingEntry={editingEntry}
      />
    );

    const titleInput = screen.getByLabelText(
      /Course Title/i
    ) as HTMLInputElement;
    expect(titleInput.value).toBe("Advanced Python");

    const costInput = screen.getByLabelText(/Cost/i) as HTMLInputElement;
    expect(costInput.value).toBe("100");
  });
});
