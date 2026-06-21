import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ConfirmEmailPage } from './ConfirmEmailPage'; // Adjust path as needed
import { errorHandler } from '@ayalaslanguage/types/error';
import type { User } from '../../types/shared/User';
import { ROLE_TYPE } from '@ayalaslanguage/types/auth';

// 1. Mock external dependencies
vi.mock('axios');
vi.mock('@ayalaslanguage/types/error', () => ({
  errorHandler: vi.fn((_err, setError) => setError('Mocked error message')),
}));

// Mock AuthHeader component to keep the test light
vi.mock('../../components/auth/AuthHeader', () => ({
  AuthHeader: () => <div data-testid="auth-header">Mocked Auth Header</div>,
}));

// Create stable mock functions for react-router-dom hooks
const mockLogin = vi.fn();
let mockToken: string | undefined = 'test-token-123';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ token: mockToken }),
  useOutletContext: () => ({ login: mockLogin }),
}));

describe('ConfirmEmailPage', () => {
  const mockUser: User = {
    userId: 1,
    userName: 'test@example.com',
    emailConfirmed: false,
    use2FALogin: false,
    role: ROLE_TYPE.CONTENT_CREATOR
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token-123'; // Reset token default
  });

  it('renders headers correctly', async () => {
    render(<ConfirmEmailPage />);

    expect(await screen.findByTestId('auth-header')).toBeInTheDocument();

    expect(await screen.findByRole('heading', {
      name: /email address confirmation/i
    })).toBeInTheDocument();
  });

  it('successfully confirms email and calls login when a token is present', async () => {
    // Arrange: Mock axios.get to return a successful promise
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockUser });

    // Act
    render(<ConfirmEmailPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });


    expect(axios.get).toHaveBeenCalledWith(`/api/auth/confirm/${encodeURIComponent('test-token-123')}`);

    expect(mockLogin).toHaveBeenCalledWith(mockUser);
    expect(screen.getByRole('heading', { name: /email address confirmed successfully/i })).toBeInTheDocument();

    // Ensure no error is displayed
    expect(screen.queryByText('Mocked error message')).not.toBeInTheDocument();
  });

  it('displays an error if no token is received from parameters', async () => {
    // Arrange: Simulate missing token
    mockToken = undefined;

    // Act
    render(<ConfirmEmailPage />);

    // Assert error display immediately
    expect(screen.getByText('Error: no token received.')).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully using the errorHandler utility', async () => {
    // Arrange: Mock axios to reject
    const apiError = new Error('Network Error');
    vi.mocked(axios.get).mockRejectedValueOnce(apiError);

    // Act
    render(<ConfirmEmailPage />);

    // Assert errorHandler integration
    await waitFor(() => {
      expect(errorHandler).toHaveBeenCalledWith(apiError, expect.any(Function));
      expect(screen.getByText('Mocked error message')).toBeInTheDocument();
    });

    // Ensure success screen isn't visible
    expect(screen.queryByRole('heading', { name: /email address confirmed successfully/i })).not.toBeInTheDocument();
  });
});