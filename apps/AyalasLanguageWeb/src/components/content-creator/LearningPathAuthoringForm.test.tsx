import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LearningPathAuthoringForm } from './LearningPathAuthoringForm';
import axios from 'axios';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { ROLE_TYPE } from '@ayalaslanguage/types/auth';
import { MemoryRouter, useOutletContext } from 'react-router-dom';

// Setup mocks
const mockNavigate = vi.fn();
const mockUser = {
  userName: 'test@example.com',
  role: ROLE_TYPE.CONTENT_CREATOR,
  languageSettings: { knownLanguage: 'English', targetLanguage: 'Spanish' }
};

// Create a STABLE searchParams object to prevent the useEffect from re-running
const mockSearchParams = new URLSearchParams();

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useOutletContext: vi.fn(),
    // Return the stable reference here
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

vi.mock('../../utils/utils', () => ({
  removeLastCharIfMatch: vi.fn((s) => s),
  initializePuter: vi.fn().mockResolvedValue(true),
  parseLLMResponse: vi.fn(),
  writeToLog: vi.fn(),
  downloadFile: vi.fn(),
}));

describe('LearningPathAuthoringForm', () => {
  const mockHandleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOutletContext).mockReturnValue({ user: mockUser });
    mockedAxios.post.mockResolvedValue({ data: { chapter: 2 } });
  });

  it('shows loading overlay during submission', async () => {
    // 1. Mock handleSubmit to return a promise that NEVER resolves.
    mockHandleSubmit.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );

    // 2. Wait for initial load to stabilize (Chapter 2 from mocked axios)
    await waitFor(() => expect(screen.getByTestId('chapter')).toHaveValue(2));

    // 3. Switch to MANUAL mode
    const toggleBtn = screen.getByTestId('switch-ai-use');
    fireEvent.click(toggleBtn);

    // 4. Fill required fields. 
    // findBy ensures the UI has responded to the mode switch.
    const firstSetArea = await screen.findByTestId('first-set');
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Loading Test' } });
    fireEvent.change(firstSetArea, { target: { value: 'Hello' } });
    fireEvent.change(screen.getByTestId('second-set'), { target: { value: 'Hola' } });
    
    // Select an exercise type (Translate)
    const typeSelect = screen.getByTestId('exercise-type');
    fireEvent.change(typeSelect, { target: { value: '1' } });

    // 5. Trigger submission
    const saveBtn = screen.getByTestId('save');
    disableClientValidation();
    // We do not await this act because it contains a hanging promise.
    // We just want to trigger the event.
    act(() => {
      fireEvent.click(saveBtn);
    });

    // 6. ASSERTION: The overlay should now be visible and stay visible
    // because handleSubmit never finishes.
    const overlay = await screen.findByTestId('loadingBox');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveTextContent(/generating exercises/i);

    // Verify the form is hidden/replaced by the overlay
    expect(screen.queryByTestId('save')).not.toBeInTheDocument();
  });
});