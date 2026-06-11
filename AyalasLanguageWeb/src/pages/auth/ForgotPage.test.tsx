import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ForgotPage } from './ForgotPage';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import * as utils from '../../utils/utils';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock the utils
vi.mock('../../utils/utils', () => ({
    errorHandler: vi.fn(),
    isValidEmail: vi.fn(),
}));

// Mock Lucide icons to avoid rendering complexities
vi.mock('lucide-react', () => ({
    Send: () => <span data-testid="send-icon" />,
}));

// Mock react-router-dom hooks
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    };
});

describe('ForgotPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams();
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <ForgotPage />
            </MemoryRouter>
        );
    };

    it('should pre-fill email from search parameters', async () => {
        mockSearchParams = new URLSearchParams({ user: 'test@example.com' });
        renderComponent();

        const emailInput = await screen.findByTestId('email') as HTMLInputElement;
        expect(emailInput.value).toBe('test@example.com');
    });

    it('should show success message on successful password reset request', async () => {
        vi.mocked(utils.isValidEmail).mockReturnValue(true);
        mockedAxios.post.mockResolvedValueOnce({ data: {} });

        renderComponent();
        
        disableClientValidation();

        const emailInput = await screen.findByTestId('email');
        fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

        const submitBtn = await screen.findByTestId('complete-registration');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/forgot', {
                username: 'user@test.com',
            });
        });

        const successHeading = await screen.findByRole('heading', { name: /email sent successfully/i });
        expect(successHeading).toBeInTheDocument();
        expect(screen.getByText(/An email address with a link to reset your password has been sent/i)).toBeInTheDocument();
    });

    it('should show validation error when email is invalid', async () => {
        vi.mocked(utils.isValidEmail).mockReturnValue(false);

        renderComponent();
        disableClientValidation();

        const emailInput = await screen.findByTestId('email');
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

        const submitBtn = await screen.findByTestId('complete-registration');
        fireEvent.click(submitBtn);

        const errorLabel = await screen.findByText(/Please enter a valid email address/i);
        expect(errorLabel).toBeInTheDocument();
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should call errorHandler when the API request fails', async () => {
        vi.mocked(utils.isValidEmail).mockReturnValue(true);
        const errorResponse = new Error('Server Error');
        mockedAxios.post.mockRejectedValueOnce(errorResponse);

        renderComponent();
        disableClientValidation();

        const emailInput = await screen.findByTestId('email');
        fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

        const submitBtn = await screen.findByTestId('complete-registration');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(utils.errorHandler).toHaveBeenCalledWith(errorResponse, expect.any(Function));
        });
    });

    it('should render the login link', async () => {
        renderComponent();
        const loginLink = await screen.findByRole('link', { name: /log in/i });
        expect(loginLink).toHaveAttribute('href', '/login');
    });
});