import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { errorHandler } from '@ayalaslanguage/types/error';
import { RegisterPage } from './RegisterPage'; // Adjust path if necessary
import { isValidEmail, checkPasswordStrength, generatePasswordFeedback } from '../../utils/utils';
import disableClientValidation from '@ayalaslanguage/types/test-utils';

// Mock lucide-react to avoid any icon rendering issues
vi.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
}));

vi.mock('../../components/PublicHeader', () => ({
  // We return an object where the key matches the name of the exported function
  PublicHeader: () => <div data-testid="mock-public-header">Mock Public Header</div>,
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock utility modules
vi.mock('../../utils/utils', () => ({
  isValidEmail: vi.fn(),
  checkPasswordStrength: vi.fn(),
  generatePasswordFeedback: vi.fn(),
}));

vi.mock('@ayalaslanguage/types/error', () => ({
  errorHandler: vi.fn(),
}));

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to render component within Router context
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  };

  it('renders all registration form inputs and the submit button', () => {
    renderComponent();

    expect(screen.getByTestId('display-name')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument(); // exact match to separate from confirm
    expect(screen.getByTestId('confirm-password')).toBeInTheDocument();
    expect(screen.getByTestId('complete-registration')).toBeInTheDocument();
  });

  it('shows error if email validation fails', async () => {
    vi.mocked(isValidEmail).mockReturnValue(false);
    renderComponent();

    disableClientValidation();

    fireEvent.change(screen.getByTestId('email'), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByTestId('complete-registration'));

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('shows error if password and password confirm are mismatched', async () => {
    vi.mocked(isValidEmail).mockReturnValue(true);
    renderComponent();

    disableClientValidation();

    fireEvent.change(screen.getByTestId('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: 'different123' } });
    
    fireEvent.click(screen.getByTestId('complete-registration'));

    expect(await screen.findByText(/password and password confirm must be identical/i)).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('shows error if password strength validation fails', async () => {
    vi.mocked(isValidEmail).mockReturnValue(true);
    vi.mocked(checkPasswordStrength).mockReturnValue({ isValid: false, checks: {} as any });
    vi.mocked(generatePasswordFeedback).mockReturnValue({ message: 'Password is too weak!' } as any);

    renderComponent();

    disableClientValidation();
    
    fireEvent.change(screen.getByTestId('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('password'), { target: { value: '123' } });
    fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: '123' } });
    
    fireEvent.click(screen.getByTestId('complete-registration'));

    expect(await screen.findByText(/password is too weak!/i)).toBeInTheDocument();
    expect(checkPasswordStrength).toHaveBeenCalledWith('123');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('submits registration form successfully and triggers axios post', async () => {
    vi.mocked(isValidEmail).mockReturnValue(true);
    vi.mocked(checkPasswordStrength).mockReturnValue({ isValid: true, checks: {} as any });
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

    renderComponent();

    disableClientValidation();

    fireEvent.change(screen.getByTestId('display-name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: 'StrongPass123!' } });
    
    fireEvent.click(screen.getByTestId('complete-registration'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
        displayname: 'John Doe',
        username: 'test@example.com',
        password: 'StrongPass123!',
      });
    });
  });

  it('calls errorHandler utility if the axios request fails', async () => {
    const errorInstance = new Error('Network Error');
    vi.mocked(isValidEmail).mockReturnValue(true);
    vi.mocked(checkPasswordStrength).mockReturnValue({ isValid: true, checks: {} as any });
    vi.mocked(axios.post).mockRejectedValue(errorInstance);

    // Simulated custom behavior for the errorHandler to populate the error message box
    vi.mocked(errorHandler).mockImplementation((_err, setError) => {
      setError('Registration failed from server');
    });

    renderComponent();

    disableClientValidation();

    fireEvent.change(screen.getByTestId('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: 'StrongPass123!' } });
    
    fireEvent.click(screen.getByTestId('complete-registration'));

    await waitFor(() => {
      expect(errorHandler).toHaveBeenCalledWith(errorInstance, expect.any(Function));
    });
    expect(await screen.findByText(/registration failed from server/i)).toBeInTheDocument();
  });
});