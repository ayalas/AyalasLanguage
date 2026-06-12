import { render, screen, fireEvent, act } from '@testing-library/react';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LanguageLineForDelete } from './LanguageLineForDelete';
import { errorHandler } from '../../utils/utils';
import type { User } from '../../types/shared/User';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';

// Mock axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock the errorHandler utility to ensure it returns a string and doesn't cause [object Object]
vi.mock('../../utils/utils', () => ({
  errorHandler: vi.fn()
}));

describe('LanguageLineForDelete', () => {
  const mockLanguageInfo = {
    languageId: 123,
    nativeName: 'Français',
    englishName: 'French',
  };

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    languageSettings: {
      targetLanguageId: 1,
      knownLanguageId: 2,
      otherUserLanguages: [mockLanguageInfo],
    },
  } as User;

  const mockLogin = vi.fn();
  const mockReloadLanguageSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders language information correctly', async () => {
    render(
      <LanguageLineForDelete
        languageInfo={mockLanguageInfo}
        user={mockUser}
        login={mockLogin}
        reloadLanguageSettings={mockReloadLanguageSettings}
      />
    );

    const content = await screen.findByText(/Français \(French\)/i);
    expect(content).toBeInTheDocument();
  });

  it('successfully deletes a language and calls reloadLanguageSettings', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });

    render(
      <LanguageLineForDelete
        languageInfo={mockLanguageInfo}
        user={mockUser}
        login={mockLogin}
        reloadLanguageSettings={mockReloadLanguageSettings}
      />
    );

    // Call the external function provided in instructions
    disableClientValidation();

    const deleteButton = await screen.findByTestId('delete-item');
    
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/profile/123');
    expect(mockReloadLanguageSettings).toHaveBeenCalledWith(mockedAxios, mockUser, mockLogin);
    expect(screen.queryByText(/Français \(French\)/i)).not.toBeInTheDocument();
  });

  it('displays an error message when the delete request fails', async () => {
    const errorMessage = 'Network Error';
    
    // Mock axios to fail
    mockedAxios.delete.mockRejectedValueOnce(new Error(errorMessage));

    // Mock errorHandler to simulate setting the error string
    vi.mocked(errorHandler).mockImplementation((err, setError) => {
      setError(errorMessage);
    });

    render(
      <LanguageLineForDelete
        languageInfo={mockLanguageInfo}
        user={mockUser}
        login={mockLogin}
        reloadLanguageSettings={mockReloadLanguageSettings}
      />
    );

    disableClientValidation();

    const deleteButton = await screen.findByTestId('delete-item');

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Now findByText will look for the actual string set by our mocked errorHandler
    const errorLabel = await screen.findByText(errorMessage);
    expect(errorLabel).toBeInTheDocument();
    expect(errorLabel).toHaveClass('form-error');
  });
});