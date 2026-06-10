import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../components/auth/useAuth';
import { errorHandler } from '../../utils/utils';
import LoginPage from './LoginPage'; // Adjust this path to match your actual file structure
import type { AuthContextType } from '../../components/auth/types';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';

// --- External Mocks ---

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(),
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  };
});

vi.mock('../../components/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../utils/utils', () => ({
  errorHandler: vi.fn(),
}));

// --- Test Suite ---

describe('LoginPage Component', () => {
  const mockNavigate = vi.fn();
  const mockLogin = vi.fn();
  const mockGetSearchParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default implementations for hooks
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useAuth).mockReturnValue({ login: mockLogin } as unknown as AuthContextType);
    vi.mocked(useSearchParams).mockReturnValue([
      { get: mockGetSearchParams } as unknown as URLSearchParams,
      vi.fn(),
    ]);
  });

  it('renders login form elements correctly', () => {
    mockGetSearchParams.mockReturnValue(null);

    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('log-in')).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  it('pre-populates email field if "user" search parameter is present', () => {
    mockGetSearchParams.mockImplementation((key: string) => {
      if (key === 'user') return 'testuser@example.com';
      return null;
    });

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email') as HTMLInputElement;
    expect(emailInput.value).toBe('testuser@example.com');
  });

  it('navigates to /home if user has completed language settings', async () => {
    mockGetSearchParams.mockReturnValue(null);
    const user = userEvent.setup();

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        user: {
          username: 'test@example.com',
          languageSettings: {
            knownLanguageId: 1,
            targetLanguageId: 2,
          },
        },
      },
    });

    render(<LoginPage />);

    disableClientValidation();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const submitButton = screen.getByTestId('log-in');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
      username: 'test@example.com',
      password: 'password123',
    });
    expect(mockLogin).toHaveBeenCalledWith({
      username: 'test@example.com',
      languageSettings: {
        knownLanguageId: 1,
        targetLanguageId: 2,
      },
    });
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('navigates to /profile if user is missing language settings', async () => {
    mockGetSearchParams.mockReturnValue(null);
    const user = userEvent.setup();

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        user: {
          username: 'newuser@example.com',
          languageSettings: {
            knownLanguageId: null,
            targetLanguageId: null,
          },
        },
      },
    });

    render(<LoginPage />);

    disableClientValidation();

    await user.type(screen.getByTestId('email'), 'newuser@example.com');
    await user.type(screen.getByTestId('password'), 'password123');
    await user.click(screen.getByTestId('log-in'));

    expect(mockLogin).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('calls errorHandler when the API request fails', async () => {
    mockGetSearchParams.mockReturnValue(null);
    const user = userEvent.setup();
    const fakeError = new Error('Invalid credentials');

    mockedAxios.post.mockRejectedValueOnce(fakeError);

    render(<LoginPage />);

    disableClientValidation();

    await user.type(screen.getByTestId('email'), 'wrong@example.com');
    await user.type(screen.getByTestId('password'), 'wrongpass');
    await user.click(screen.getByTestId('log-in'));

    expect(errorHandler).toHaveBeenCalledWith(fakeError, expect.any(Function));
  });
});