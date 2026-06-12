import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountPage } from './AccountPage';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { checkPasswordStrength, generatePasswordFeedback } from '../../utils/utils';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';

// 1. Mock External Dependencies
vi.mock('axios');
vi.mock('react-router-dom', () => ({
    useOutletContext: vi.fn(),
}));

vi.mock('../../utils/utils', () => ({
    checkPasswordStrength: vi.fn(),
    // Complete the return signature so it matches what the component expects
    generatePasswordFeedback: vi.fn(() => ({
        isValid: false,
        message: 'Password too weak!',
        missing: ['uppercase', 'number']
    })),
    errorHandler: vi.fn((err: any, setError: (msg: string) => void) =>
        setError(err.message || 'An error occurred')
    ),
}));

// Mock child components to keep the test focused
vi.mock('../../components/auth/AuthHeader', () => ({
    AuthHeader: () => <div data-testid="auth-header" />,
}));

describe('AccountPage Component', () => {
    const mockLogin = vi.fn();
    const mockUser = {
        userName: 'test@example.com',
        emailConfirmed: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation for React Router's outlet context
        vi.mocked(useOutletContext).mockReturnValue({
            user: mockUser,
            login: mockLogin,
        });
    });

    it('renders the form elements correctly with initial state', () => {
        render(<AccountPage />);

        expect(screen.getByTestId('auth-header')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /account details/i })).toBeInTheDocument();
        expect(screen.getByTestId('current-password')).toBeInTheDocument();
        expect(screen.getByTestId('new-password')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-new-password')).toBeInTheDocument();
        expect(screen.getByTestId('new-email-address')).toBeInTheDocument();
    });

    it('hides the new email input if the email is already confirmed', () => {
        vi.mocked(useOutletContext).mockReturnValue({
            user: { ...mockUser, emailConfirmed: true },
            login: mockLogin,
        });

        render(<AccountPage />);
        expect(screen.queryByTestId('new-email-address')).not.toBeInTheDocument();
        expect(screen.getByText(/confirmed \(cannot be changed\)/i)).toBeInTheDocument();
    });

    it('successfully triggers email confirmation', async () => {
        vi.mocked(axios.post).mockResolvedValueOnce({});

        render(<AccountPage />);

        disableClientValidation();

        const confirmBtn = screen.getByTestId('send');
        fireEvent.click(confirmBtn);

        expect(axios.post).toHaveBeenCalledWith('/api/auth/confirm');

        await waitFor(() => {
            expect(screen.getByText(/email address confirmation sent successfully/i)).toBeInTheDocument();
        });
    });

    it('shows an error message if saving with no changes made', async () => {
        render(<AccountPage />);

        disableClientValidation();

        fireEvent.change(screen.getByTestId('current-password'), { target: { value: '  ' } });
        fireEvent.change(screen.getByTestId('new-email-address'), { target: { value: '  ' } });

        const saveBtn = screen.getByTestId('save');
        fireEvent.click(saveBtn);

        expect(screen.getByText(/nothing to save/i)).toBeInTheDocument();
    });

    it('validates mismatched passwords before making an API call', async () => {
        render(<AccountPage />);

        disableClientValidation();

        // Fill in old password, new password, and a mismatched confirmation
        fireEvent.change(screen.getByTestId('current-password'), { target: { value: 'oldpassword123' } });
        fireEvent.change(screen.getByTestId('new-password'), { target: { value: 'NewPass123!' } });
        fireEvent.change(screen.getByTestId('confirm-new-password'), { target: { value: 'Mismatched123!' } });

        const saveBtn = screen.getByTestId('save');
        fireEvent.click(saveBtn);

        expect(screen.getByText(/new password and password confirm must be identical/i)).toBeInTheDocument();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('validates password strength using utility function', async () => {
        // 1. Provide a structurally sound object for checkPasswordStrength
        vi.mocked(checkPasswordStrength).mockReturnValueOnce({
            isValid: false,
            checks: { hasMinLength: false, hasUppercase: false, hasLowercase: true, hasNumber: false, hasSpecialChar: false }
        });

        // 2. Provide a structurally sound object for generatePasswordFeedback
        vi.mocked(generatePasswordFeedback).mockReturnValueOnce({
            isValid: false,
            message: 'Password too weak!',
            missing: ['length', 'uppercase']
        });

        render(<AccountPage />);

        disableClientValidation();

        fireEvent.change(screen.getByTestId('current-password'), { target: { value: 'oldpassword123' } });
        fireEvent.change(screen.getByTestId('new-password'), { target: { value: 'weak' } });
        fireEvent.change(screen.getByTestId('confirm-new-password'), { target: { value: 'weak' } });

        const saveBtn = screen.getByTestId('save');
        fireEvent.click(saveBtn);

        expect(checkPasswordStrength).toHaveBeenCalledWith('weak');
        expect(screen.getByText('Password too weak!')).toBeInTheDocument();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('successfully updates user profile details', async () => {
        const updatedUser = { ...mockUser, userName: 'newemail@example.com' };
        vi.mocked(axios.post).mockResolvedValueOnce({ data: updatedUser });

        render(<AccountPage />);

        disableClientValidation();

        fireEvent.change(screen.getByTestId('current-password'), { target: { value: 'oldpassword123' } });
        fireEvent.change(screen.getByTestId('new-email-address'), { target: { value: 'newemail@example.com' } });

        const saveBtn = screen.getByTestId('save');
        fireEvent.click(saveBtn);

        expect(axios.post).toHaveBeenCalledWith('/api/auth/account', {
            newUserName: 'newemail@example.com',
            oldPassword: 'oldpassword123',
            newPassword: '',
        });

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith(updatedUser);
            expect(screen.getByText(/account details changed successfully/i)).toBeInTheDocument();
        });
    });

    it('handles API errors gracefully using the errorHandler utility', async () => {
        const apiError = new Error('Invalid old password');
        vi.mocked(axios.post).mockRejectedValueOnce(apiError);

        render(<AccountPage />);

        disableClientValidation();

        fireEvent.change(screen.getByTestId('current-password'), { target: { value: 'wrongpassword' } });
        fireEvent.change(screen.getByTestId('new-email-address'), { target: { value: 'newemail@example.com' } });

        const saveBtn = screen.getByTestId('save');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(screen.getByText('Invalid old password')).toBeInTheDocument();
        });
    });
});