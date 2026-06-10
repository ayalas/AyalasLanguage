import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { AlternativeLine } from "./AlternativeLine"; // Adjust path as needed
import type { AlternativeHandle } from "../../../types/ui/ComponentHandles";
import disableClientValidation from '../../../utils/test-utils/disableClientValidation';

// Mock axios
vi.mock("axios");

// Mock Lucide icons to avoid rendering SVG complexity
vi.mock("lucide-react", () => ({
  Trash2: () => <span data-testid="trash-icon" />,
  ArchiveRestore: () => <span data-testid="restore-icon" />,
}));

// Mock the external validation utility
vi.mock("./path-to-your-utils", () => ({
  disableClientValidation: vi.fn(),
}));

describe("AlternativeLine Component", () => {
  const mockAlternative = "Test Alternative Text";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render correctly and toggle exists state when clicked", () => {
    const ref = createRef<AlternativeHandle>();
    
    // 1. Render
    render(<AlternativeLine alternative={mockAlternative} ref={ref} />);

    // 2. Call disableClientValidation after rendering
    disableClientValidation();

    // Initial State Check
    const button = screen.getByTestId("delete-or-restore");
    const label = screen.getByText(mockAlternative);
    
    expect(button).toHaveAttribute("title", "Delete");
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    expect(label).toHaveClass("label-exists");
    
    // Verify initial ref state
    expect(ref.current?.exists()).toBe(true);

    // 3. Click the button
    fireEvent.click(button);

    // Toggle State Check (Deleted/Restore state)
    expect(button).toHaveAttribute("title", "Restore");
    expect(screen.getByTestId("restore-icon")).toBeInTheDocument();
    expect(label).toHaveClass("label-deleted");
    
    // Verify ref updated
    expect(ref.current?.exists()).toBe(false);
  });

  it("should toggle back to exists when clicked twice", () => {
    const ref = createRef<AlternativeHandle>();
    render(<AlternativeLine alternative={mockAlternative} ref={ref} />);
    
    disableClientValidation();
    
    const button = screen.getByTestId("delete-or-restore");

    // Toggle off then on
    fireEvent.click(button); // Delete
    fireEvent.click(button); // Restore

    expect(ref.current?.exists()).toBe(true);
    expect(button).toHaveAttribute("title", "Delete");
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
  });
});