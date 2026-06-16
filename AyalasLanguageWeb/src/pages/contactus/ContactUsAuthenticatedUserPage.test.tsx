import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContactUsAuthenticatedUserPage } from "./ContactUsAuthenticatedUserPage";
import axios from "axios";
import { errorHandler } from "../../utils/utils";
import userEvent from "@testing-library/user-event";

// 1. Mock Axios
vi.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// 2. Mock AuthHeader (to focus only on this page's logic)
vi.mock("../../components/auth/AuthHeader", () => ({
  AuthHeader: () => <div data-testid="mock-header">Auth Header</div>,
}));

// 3. Mock the errorHandler utility
vi.mock("../../utils/utils", () => ({
  errorHandler: vi.fn((err, setError) => setError("Mocked Error Message")),
}));

describe("ContactUsAuthenticatedUserPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the initial state correctly", () => {
    render(<ContactUsAuthenticatedUserPage />);

    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByTestId("message")).toBeInTheDocument();
    expect(screen.getByTestId("save")).toBeInTheDocument();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
  });

  it("updates the textarea value when typing", async () => {
    const user = userEvent.setup();
    render(<ContactUsAuthenticatedUserPage />);
    
    const textarea = screen.getByTestId("message") as HTMLTextAreaElement;
    await user.type(textarea, "Hello, I need help.");

    expect(textarea.value).toBe("Hello, I need help.");
  });

  it("submits the form successfully and shows success message", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    render(<ContactUsAuthenticatedUserPage />);
    
    const textarea = screen.getByTestId("message");
    const submitBtn = screen.getByTestId("save");

    await user.type(textarea, "Test message content");
    await user.click(submitBtn);

    // Verify API call
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/profile/message", {
      message: "Test message content",
    });

    // Verify success UI
    await waitFor(() => {
      expect(screen.getByText("Message sent successfully.")).toBeInTheDocument();
    });

    // Verify form elements are hidden after success
    expect(screen.queryByTestId("message")).not.toBeInTheDocument();
    expect(screen.queryByTestId("save")).not.toBeInTheDocument();
  });

  it("handles submission errors using the errorHandler", async () => {
    const user = userEvent.setup();
    // Simulate an axios error
    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    render(<ContactUsAuthenticatedUserPage />);
    
    const textarea = screen.getByTestId("message");
    const submitBtn = screen.getByTestId("save");

    await user.type(textarea, "This will fail");
    await user.click(submitBtn);

    // Check if errorHandler was called
    expect(errorHandler).toHaveBeenCalled();

    // Check if the error message is rendered (set by our mock errorHandler)
    await waitFor(() => {
      expect(screen.getByText("Mocked Error Message")).toBeInTheDocument();
    });

    // Success message should not be visible
    expect(screen.queryByText("Message sent successfully.")).not.toBeInTheDocument();
  });

  it("validates that textarea is required", () => {
    render(<ContactUsAuthenticatedUserPage />);
    const textarea = screen.getByTestId("message");
    expect(textarea).toBeRequired();
  });

  it("limits the textarea length to 500 characters", () => {
    render(<ContactUsAuthenticatedUserPage />);
    const textarea = screen.getByTestId("message");
    expect(textarea).toHaveAttribute("maxLength", "500");
  });
});