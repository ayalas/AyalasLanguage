import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { ResetPasswordPage } from './ResetPasswordPage';
import * as utils from '@ayalaslanguage/types/sharedfrontlib/utils';
import { errorHandler } from '@ayalaslanguage/types/error';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

vi.mock('../../components/PublicHeader', () => ({
  // We return an object where the key matches the name of the exported function
  PublicHeader: () => <div data-testid="mock-public-header">Mock Public Header</div>,
}));

//Mock FormHeader component to keep the test light
vi.mock('../../components/FormHeader', async () => {
  const actual = await vi.importActual('../../components/FormHeader');
  return {
    ...actual,
    FormHeader: () => <div data-testid="form-header"><h1>Reset Password</h1></div>,
  };
});

vi.mock('lucide-react', () => ({
    Save: () => null,
}));

vi.mock('@ayalaslanguage/types/sharedfrontlib/utils', () => ({
    checkPasswordStrength: vi.fn(),
    generatePasswordFeedback: vi.fn(),
}));

vi.mock('@ayalaslanguage/types/error', () => ({
  errorHandler: vi.fn(),
}));

const mockedCheckPasswordStrength = vi.mocked(utils.checkPasswordStrength);
const mockedGeneratePasswordFeedback = vi.mocked(utils.generatePasswordFeedback);
const mockedErrorHandler = vi.mocked(errorHandler);

// ---------------------------------------------------------------------------
// Helper: render inside a MemoryRouter that provides :token and ?user=
// ---------------------------------------------------------------------------

interface RenderOptions {
    token?: string;
    userParam?: string;
}

function renderPage({ token = 'valid-token-abc', userParam = 'user@example.com' }: RenderOptions = {}) {
    const initialPath = `/reset-password/${token}?user=${encodeURIComponent(userParam)}`;

    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/reset-password/:token?" element={<ResetPasswordPage />} />
            </Routes>
        </MemoryRouter>,
    );
}

// ---------------------------------------------------------------------------
// Helper: fill the form fields
// ---------------------------------------------------------------------------

function fillPasswords(password: string, confirm: string) {
    fireEvent.change(screen.getByTestId('password'), { target: { value: password } });
    fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: confirm } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default: password is considered strong
        mockedCheckPasswordStrength.mockReturnValue({ isValid: true, checks: {} as never });
        mockedGeneratePasswordFeedback.mockReturnValue({ isValid: true, message: '', missing: [] });

        // Default: axios.post resolves successfully
        mockedAxios.post.mockResolvedValue({ data: {} });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // -----------------------------------------------------------------------
    // Initial render
    // -----------------------------------------------------------------------

    it('renders the Reset Password heading', () => {
        renderPage();
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    it('renders the password and confirm-password inputs', () => {
        renderPage();
        expect(screen.getByTestId('password')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-password')).toBeInTheDocument();
    });

    it('renders the save button', () => {
        renderPage();
        expect(screen.getByTestId('save')).toBeInTheDocument();
    });

    it('does not show success message initially', () => {
        renderPage();
        expect(screen.queryByText('Password changed successfully.')).not.toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // Validation: missing token
    // -----------------------------------------------------------------------

    it('shows an error when the token is missing', async () => {
        renderPage({ token: '', userParam: 'user@example.com' });

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(screen.getByText('Error: no token received.')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Validation: missing user (email)
    // -----------------------------------------------------------------------

    it('shows an error when the user query param is empty', async () => {
        renderPage({ token: 'some-token', userParam: '' });

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(screen.getByText('Error: no email address received.')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Validation: whitespace-only password
    // -----------------------------------------------------------------------

    it('shows an error when the new password is whitespace only', async () => {
        renderPage();
        fillPasswords('   ', '   ');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(
                screen.getByText(
                    'New Password and Password Confirm are required. New Password contains only whitespace.',
                ),
            ).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Validation: passwords do not match
    // -----------------------------------------------------------------------

    it('shows an error when passwords do not match', async () => {
        renderPage();
        fillPasswords('Password1!', 'Password2!');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(
                screen.getByText('New Password and Password Confirm must be identical.'),
            ).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Validation: weak password
    // -----------------------------------------------------------------------

    it('shows the feedback message when the password is not strong enough', async () => {
        mockedCheckPasswordStrength.mockReturnValue({ isValid: false, checks: {} as never });
        mockedGeneratePasswordFeedback.mockReturnValue({ isValid: false,
            message: 'Password must be at least 8 characters.',
            missing: ['length']
        });

        renderPage();
        fillPasswords('weak', 'weak');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(
                screen.getByText('Password must be at least 8 characters.'),
            ).toBeInTheDocument();
        });

        expect(mockedCheckPasswordStrength).toHaveBeenCalledWith('weak');
        expect(mockedGeneratePasswordFeedback).toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Happy path: successful reset
    // -----------------------------------------------------------------------

    it('shows the success view after a successful password reset', async () => {
        renderPage({ token: 'valid-token', userParam: 'user@example.com' });
        fillPasswords('StrongPass1!', 'StrongPass1!');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(screen.getByText('Password changed successfully.')).toBeInTheDocument();
        });

        expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/reset', {
            userName: 'user@example.com',
            password: 'StrongPass1!',
            token: 'valid-token',
        });

        // Form fields should be gone after success
        expect(screen.queryByTestId('password')).not.toBeInTheDocument();
        expect(screen.queryByTestId('confirm-password')).not.toBeInTheDocument();
        expect(screen.queryByTestId('save')).not.toBeInTheDocument();
    });

    it('shows a log-in link containing the username after a successful reset', async () => {
        renderPage({ token: 'valid-token', userParam: 'user@example.com' });
        fillPasswords('StrongPass1!', 'StrongPass1!');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(screen.getByText('Password changed successfully.')).toBeInTheDocument();
        });

        const loginLink = screen.getByRole('link', { name: 'Log in' });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login?user=user%40example.com');
    });

    // -----------------------------------------------------------------------
    // Error path: axios throws
    // -----------------------------------------------------------------------

    it('calls errorHandler when axios.post rejects', async () => {
        const networkError = new Error('Network Error');
        mockedAxios.post.mockRejectedValue(networkError);

        renderPage();
        fillPasswords('StrongPass1!', 'StrongPass1!');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(mockedErrorHandler).toHaveBeenCalledWith(networkError, expect.any(Function));
        });

        // Success view must NOT appear
        expect(screen.queryByText('Password changed successfully.')).not.toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // Error cleared on successful submit
    // -----------------------------------------------------------------------

    it('clears a previous error message after a successful submit', async () => {
        // First: trigger a mismatch error
        renderPage();
        fillPasswords('Password1!', 'Different1!');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(
                screen.getByText('New Password and Password Confirm must be identical.'),
            ).toBeInTheDocument();
        });

        // Correct the passwords and resubmit
        fillPasswords('StrongPass1!', 'StrongPass1!');
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(screen.getByText('Password changed successfully.')).toBeInTheDocument();
        });

        expect(
            screen.queryByText('New Password and Password Confirm must be identical.'),
        ).not.toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // Trimming: leading/trailing whitespace in user query param
    // -----------------------------------------------------------------------

    it('trims whitespace from the user query param before sending', async () => {
        renderPage({ token: 'valid-token', userParam: '  user@example.com  ' });
        fillPasswords('StrongPass1!', 'StrongPass1!');

        disableClientValidation();
        fireEvent.click(screen.getByTestId('save'));

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/reset', {
                userName: 'user@example.com',
                password: 'StrongPass1!',
                token: 'valid-token',
            });
        });
    });
});
