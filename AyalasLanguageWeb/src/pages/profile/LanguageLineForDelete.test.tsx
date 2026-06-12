import { render, screen, fireEvent, act } from '@testing-library/react';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LanguageLineForDelete } from './LanguageLineForDelete';
import type { User } from '../../types/shared/User';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';

// Mock axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('LanguageLineForDelete', () => {
  const mockLanguageInfo = {
    languageId: 123,
    nativeName: 'Français',
    englishName: 'French',
  };

  const mockUser: User = {
    userId: 1,
    userName: 'testuser',
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

    // Call the required external function after rendering
    disableClientValidation();

    const deleteButton = await screen.findByTestId('delete-item');
    
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Check if axios was called with the correct path
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/profile/123');

    // Check if reload function was triggered
    expect(mockReloadLanguageSettings).toHaveBeenCalledWith(mockedAxios, mockUser, mockLogin);

    // Check if the component UI disappears (exists state becomes false)
    expect(screen.queryByText(/Français \(French\)/i)).not.toBeInTheDocument();
  });

  it('displays an error message when the delete request fails', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.delete.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
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

    // Assuming the errorHandler sets the error state which renders a label with class "form-error"
    const errorLabel = await screen.findByText(errorMessage);
    expect(errorLabel).toBeInTheDocument();
    expect(errorLabel).toHaveClass('form-error');
  });
});