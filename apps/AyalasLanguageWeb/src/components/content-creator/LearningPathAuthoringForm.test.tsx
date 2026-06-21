import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LearningPathAuthoringForm } from './LearningPathAuthoringForm';
import axios from 'axios';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { ROLE_TYPE } from '@ayalaslanguage/types/auth';
import { MemoryRouter, useOutletContext } from 'react-router-dom';

// 1. Setup mocks
const mockNavigate = vi.fn();
const mockUser = {
  userName: 'test@example.com',
  role: ROLE_TYPE.CONTENT_CREATOR,
  languageSettings: { knownLanguage: 'English', targetLanguage: 'Spanish' }
};

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useOutletContext: vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
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

  it('renders email confirmation message for unauthorized roles', async () => {
    vi.mocked(useOutletContext).mockReturnValue({ 
        user: { ...mockUser, role: ROLE_TYPE.LEARNER } 
    });
    render(<MemoryRouter><LearningPathAuthoringForm handleSubmit={mockHandleSubmit} /></MemoryRouter>);
    expect(screen.getByText(/An email address confirmation request has been sent/i)).toBeInTheDocument();
  });

  it('calls handleSubmit with correct data when saving in manual mode', async () => {
    render(<MemoryRouter><LearningPathAuthoringForm handleSubmit={mockHandleSubmit} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('chapter')).toHaveValue(2));

    fireEvent.click(screen.getByTestId('switch-ai-use')); // Switch to Manual
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'New Lesson' } });
    fireEvent.change(screen.getByTestId('first-set'), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByTestId('second-set'), { target: { value: 'Hola' } });
    fireEvent.change(screen.getByTestId('exercise-type'), { target: { value: '1' } });

    disableClientValidation();
    fireEvent.click(screen.getByTestId('save'));

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalledWith(
        expect.any(Function), expect.any(Function), 1, 2, 'New Lesson', 1,
        [{ First: 'Hello', Second: 'Hola' }]
      );
    });
  });

  it('shows loading overlay during submission', async () => {
    // 1. Force handleSubmit to hang indefinitely
    mockHandleSubmit.mockReturnValue(new Promise(() => {}));

    render(<MemoryRouter><LearningPathAuthoringForm handleSubmit={mockHandleSubmit} /></MemoryRouter>);

    // 2. Wait for initial component load
    await screen.findByText('Lesson editor');

    // 3. Switch to MANUAL mode to avoid asynchronous AI/Puter logic
    fireEvent.click(screen.getByTestId('switch-ai-use'));

    // 4. Fill required fields for the manual "parseForm" to succeed
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Loading Test' } });
    fireEvent.change(screen.getByTestId('first-set'), { target: { value: 'One' } });
    fireEvent.change(screen.getByTestId('second-set'), { target: { value: 'Uno' } });
    fireEvent.change(screen.getByTestId('exercise-type'), { target: { value: '1' } });

    // 5. Submit the form
    disableClientValidation();
    fireEvent.click(screen.getByTestId('save'));

    // 6. Assert overlay is visible. 
    // Manual mode parseForm is synchronous, so it hits handleSubmit immediately.
    await waitFor(() => {
        const overlay = screen.getByText(/Generating exercises/i);
        expect(overlay).toBeInTheDocument();
        // Also verify the container has the loading class
        expect(overlay.closest('.loadingOverlay')).toBeInTheDocument();
    });
  });
});