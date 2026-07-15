import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContactUsPublicPage } from "./ContactUsPublicPage";
import axios from "axios";
import * as utils from "@ayalaslanguage/types/sharedfrontlib/utils";
import { errorHandler } from "@ayalaslanguage/types/error";

// 1. Mock Axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// 2. Mock the Utils module
vi.mock('@ayalaslanguage/types/sharedfrontlib/utils', () => ({
    isValidEmail: vi.fn(),
}));

vi.mock('@ayalaslanguage/types/error', () => ({
  errorHandler: vi.fn(),
}));

// 3. Mock Child Components (to keep the test focused)
vi.mock("../../components/PublicHeader", () => ({
    PublicHeader: () => <div data-testid="mock-header">Public Header</div>,
}));

//Mock FormHeader component to keep the test light
vi.mock('../../components/FormHeader', async () => {
  const actual = await vi.importActual('../../components/FormHeader');
  return {
    ...actual,
    FormHeader: () => <div data-testid="form-header"><h1>Contact Us</h1></div>,
  };
});

describe("ContactUsPublicPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows error message when email is invalid", async () => {
        // 1. Tell our mock to return false
        (utils.isValidEmail as any).mockReturnValue(false);

        render(<ContactUsPublicPage />);

        const emailInput = screen.getByTestId("email");
        const messageInput = screen.getByTestId("message");
        const submitButton = screen.getByTestId("save");

        // 2. Fill the email (use a string that looks like an email to satisfy the browser, 
        // but our mock will still return false)
        fireEvent.change(emailInput, { target: { value: "not-valid@example.com" } });

        // 3. IMPORTANT: Fill the required message field so the browser allows submission
        fireEvent.change(messageInput, { target: { value: "Some message" } });

        // 4. Submit
        fireEvent.click(submitButton);

        // 5. Now the handleSubmit should fire and show your custom error
        const errorMessage = await screen.findByText("Please enter a valid email address");
        expect(errorMessage).toBeInTheDocument();
        expect(utils.isValidEmail).toHaveBeenCalled();
    });

    it("calls errorHandler when the API request fails", async () => {
        // Mock validation to pass
        (utils.isValidEmail as any).mockReturnValue(true);

        // Mock axios to fail
        const error = new Error("Network Error");
        mockedAxios.post.mockRejectedValueOnce(error);

        render(<ContactUsPublicPage />);

        fireEvent.change(screen.getByTestId("email"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByTestId("message"), { target: { value: "Hello" } });
        fireEvent.click(screen.getByTestId("save"));

        await waitFor(() => {
            // Check if the mocked utility function was called
            expect(errorHandler).toHaveBeenCalled();
        });
    });

    it("shows success message on successful submission", async () => {
        (utils.isValidEmail as any).mockReturnValue(true);
        mockedAxios.post.mockResolvedValueOnce({ data: {} });

        render(<ContactUsPublicPage />);

        fireEvent.change(screen.getByTestId("email"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByTestId("message"), { target: { value: "Hello" } });
        fireEvent.click(screen.getByTestId("save"));

        expect(await screen.findByText(/Message sent successfully/i)).toBeInTheDocument();

        // Form should be hidden now
        expect(screen.queryByTestId("email")).not.toBeInTheDocument();
    });
});