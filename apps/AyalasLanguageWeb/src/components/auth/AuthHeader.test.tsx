import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthHeader } from './AuthHeader'; // Adjust path as needed
import { MemoryRouter, useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { switchLanguage } from '../../utils/languageUtils';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';
import { ROLE_TYPE } from '@ayalaslanguage/types/auth';


// --- Mock Setup ---

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock('../../utils/languageUtils', () => ({
  switchLanguage: vi.fn(),
}));

vi.mock('../../utils/utils', () => ({
  errorHandler: vi.fn((_err, cb) => cb('Mock Error')),
}));

// Mocking Lucide icons to simplify DOM
vi.mock('lucide-react', () => ({
  SquareMenu: () => <div data-testid="square-menu-icon" />,
  Volleyball: () => <div data-testid="volleyball-icon" />,
}));

// --- Types & Data ---

interface User {
  userId: number;
  displayName: string;
  userName: string;
  emailConfirmed: boolean;
  role: number;
  languageSettings: {
    targetLanguageId: number;
    targetLanguage: string;
    targetLanguageCode: string;
    knownLanguageId: number;
    score: number;
    otherUserLanguages: Array<{ languageId: number; nativeName: string }>;
  };
}

const mockUser: User = {
  userId: 1,
  displayName: 'Bob',
  userName: 'ayala@gmail.com',
  emailConfirmed: false,
  role: ROLE_TYPE.CONTENT_CREATOR,
  languageSettings: {
    targetLanguageId: 10,
    targetLanguage: 'Spanish',
    targetLanguageCode: 'es',
    knownLanguageId: 1,
    score: 500,
    otherUserLanguages: [
      { languageId: 20, nativeName: 'French' },
      { languageId: 30, nativeName: 'Hebrew' }
    ]
  }
};

describe('AuthHeader Component', () => {
  const mockLogout = vi.fn();
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useOutletContext).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      login: mockLogin,
    });
  });

  it('renders user information correctly', async () => {
    render(
      <MemoryRouter>
        <AuthHeader />
      </MemoryRouter>
    );

    // Using findBy as requested for async rendering logic in useEffect
    const displayName = await screen.findByText(/Bob/i);
    const score = await screen.findByText('500');
    const language = await screen.findByText(/Spanish/i);

    expect(displayName).toBeInTheDocument();
    expect(score).toBeInTheDocument();
    expect(language).toBeInTheDocument();
  });

  it('handles logout process correctly', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    render(
      <MemoryRouter>
        <AuthHeader />
      </MemoryRouter>
    );

    // Open the floating menu
    const menuToggle = await screen.findByTestId('square-menu-icon');
    fireEvent.click(menuToggle);

    // Locate the logout button
    const logoutBtn = await screen.findByRole('button', { name: /logout/i });

    // Requirement: Call disableClientValidation after rendering and before clicking submit
    disableClientValidation();

    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('switches language when selection changes (when hideAppTitle is true)', async () => {
    const updatedUser = {
      ...mockUser,
      languageSettings: { ...mockUser.languageSettings, targetLanguage: 'French', targetLanguageId: 20 }
    };
    vi.mocked(switchLanguage).mockResolvedValue(updatedUser as any);

    render(
      <MemoryRouter>
        <AuthHeader hideAppTitle={true} />
      </MemoryRouter>
    );

    const select = await screen.findByRole('combobox') as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: '20' } });

    await waitFor(() => {
      expect(switchLanguage).toHaveBeenCalledWith(
        expect.anything(), // axios instance
        mockUser,
        mockLogin,
        20,
        mockUser.languageSettings.knownLanguageId
      );
    });
  });

  it('displays error message if logout fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Logout Failed'));

    render(
      <MemoryRouter>
        <AuthHeader />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByTestId('square-menu-icon'));
    
    // Call mandatory function before "submit"
    disableClientValidation();
    
    fireEvent.click(await screen.findByRole('button', { name: /logout/i }));

    const errorLabel = await screen.findByText('Mock Error');
    expect(errorLabel).toBeInTheDocument();
    expect(errorLabel).toHaveClass('form-error');
  });
});