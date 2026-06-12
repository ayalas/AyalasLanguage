import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { switchLanguage } from '../../utils/languageUtils';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock react-router-dom hooks
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: vi.fn(),
  useOutletContext: vi.fn(),
}));

// Mock external utilities
vi.mock('../../utils/languageUtils', () => ({
  switchLanguage: vi.fn(),
  reloadLanguageSettings: vi.fn(),
}));

vi.mock('../../utils/utils', () => ({
  errorHandler: vi.fn((cb) => cb('Mocked Error Message')),
}));

// Mock Lucide icons to avoid cluttering snapshots/logs
vi.mock('lucide-react', () => ({
  Save: () => <div data-testid="save-icon" />,
}));

// Mock sub-components
vi.mock('../../components/auth/AuthHeader', () => ({
  AuthHeader: () => <div data-testid="auth-header-mock" />,
}));

vi.mock('./LanguageLineForDelete', () => ({
  LanguageLineForDelete: () => <div data-testid="lang-delete-mock" />,
}));

describe('ProfilePage', () => {
  const mockNavigate = vi.fn();
  const mockLogin = vi.fn();

  const mockLanguages = [
    { languageId: 1, englishName: 'English', nativeName: 'English', code: 'en' },
    { languageId: 2, englishName: 'Spanish', nativeName: 'Español', code: 'es' },
  ];

  const mockUser = {
    userId: 123,
    username: 'testuser',
    languageSettings: {
      targetLanguageId: 2,
      knownLanguageId: 1,
      otherUserLanguages: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useOutletContext).mockReturnValue({ user: mockUser, login: mockLogin });
    mockedAxios.get.mockResolvedValue({ data: mockLanguages });
  });

  it('renders correctly and loads language data', async () => {
    render(<ProfilePage />);

    // Check if the page title renders (asynchronously because of useEffect fetch)
    const title = await screen.findByRole('heading', { name: /profile/i });
    expect(title).toBeInTheDocument();

    // Check if the select inputs are populated with values from mockUser
    const targetSelect = await screen.findByTestId('target-language') as HTMLSelectElement;
    const knownSelect = await screen.findByTestId('known-language') as HTMLSelectElement;

    expect(targetSelect.value).toBe('2'); // Spanish
    expect(knownSelect.value).toBe('1');  // English
  });

  it('updates state when selections change', async () => {
    render(<ProfilePage />);

    const targetSelect = await screen.findByTestId('target-language');
    
    fireEvent.change(targetSelect, { target: { value: '1' } });
    expect((targetSelect as HTMLSelectElement).value).toBe('1');
  });

  it('submits the form successfully and navigates to home', async () => {
    render(<ProfilePage />);

    // Wait for data to load
    const saveButton = await screen.findByTestId('save');
    const targetSelect = await screen.findByTestId('target-language');
    const knownSelect = await screen.findByTestId('known-language');

    // Update selections
    fireEvent.change(targetSelect, { target: { value: '2' } });
    fireEvent.change(knownSelect, { target: { value: '1' } });

    disableClientValidation();

    // Submit the form
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(switchLanguage).toHaveBeenCalledWith(
        mockedAxios,
        mockUser,
        mockLogin,
        2,
        1
      );
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('shows error message if validation fails', async () => {
    // Override user context to have no language settings
    vi.mocked(useOutletContext).mockReturnValue({ 
        user: { ...mockUser, languageSettings: null }, 
        login: mockLogin 
    });

    render(<ProfilePage />);

    const saveButton = await screen.findByTestId('save');

    disableClientValidation();
    fireEvent.click(saveButton);

    const errorMessage = await screen.findByText(/please select language to learn and language you know/i);
    expect(errorMessage).toBeInTheDocument();
    expect(switchLanguage).not.toHaveBeenCalled();
  });
});