import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import axios from "axios";
import { ContactUsAuthenticatedUserPage } from "./ContactUsAuthenticatedUserPage";
import { errorHandler } from '@ayalaslanguage/types/error';
import disableClientValidation from "@ayalaslanguage/types/test-utils";

// Mocking axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mocking external components and utils
vi.mock("../../components/auth/AuthHeader", () => ({
    AuthHeader: () => <div data-testid="mock-auth-header">Auth Header</div>,
}));

vi.mock('@ayalaslanguage/types/error', () => ({
  errorHandler: vi.fn(),
}));

describe("ContactUsAuthenticatedUserPage", () => {
    it("should submit the form successfully and show success message", async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: {} });

        render(<ContactUsAuthenticatedUserPage />);

        // Call the external function provided in the requirements
        disableClientValidation();

        const messageInput = await screen.findByTestId("message");
        const submitButton = await screen.findByTestId("save");

        fireEvent.change(messageInput, { target: { value: "Hello, this is a test message" } });

        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(mockedAxios.post).toHaveBeenCalledWith("/api/profile/message", {
            message: "Hello, this is a test message",
        });

        const successMessage = await screen.findByText("Message sent successfully.");
        expect(successMessage).toBeInTheDocument();
        
        // Form elements should be removed on success based on component logic
        expect(screen.queryByTestId("message")).not.toBeInTheDocument();
        expect(screen.queryByTestId("save")).not.toBeInTheDocument();
    });

    it("should handle submission errors using the errorHandler", async () => {
        const errorMessage = "Network Error";
        mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));
        
        // Mock errorHandler implementation to simulate setting the state
        vi.mocked(errorHandler).mockImplementation((_err, setError) => {
            setError("Mocked Error Message");
        });

        render(<ContactUsAuthenticatedUserPage />);

        disableClientValidation();

        const messageInput = await screen.findByTestId("message");
        const submitButton = await screen.findByTestId("save");

        fireEvent.change(messageInput, { target: { value: "Trigger error" } });

        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(errorHandler).toHaveBeenCalled();
        
        const displayedError = await screen.findByText("Mocked Error Message");
        expect(displayedError).toBeInTheDocument();
    });

    it("should update message state on textarea change", async () => {
        render(<ContactUsAuthenticatedUserPage />);
        
        const messageInput = await screen.findByTestId("message") as HTMLTextAreaElement;
        
        fireEvent.change(messageInput, { target: { value: "Testing typing" } });
        
        expect(messageInput.value).toBe("Testing typing");
    });

    it("should render the AuthHeader", async () => {
        render(<ContactUsAuthenticatedUserPage />);
        const header = await screen.findByTestId("mock-auth-header");
        expect(header).toBeInTheDocument();
    });
});