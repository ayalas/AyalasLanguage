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

  it('shows loading overlay during submission', async () => {
    // 1. Trap the component: handleSubmit returns a promise that NEVER resolves.
    // This prevents the code from reaching setIsLoading(false).
    mockHandleSubmit.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );

    // 2. IMPORTANT: Wait for the initial useEffect loading phase to finish.
    // We know it's finished when the chapter input value is updated to 2.
    await waitFor(() => expect(screen.getByTestId('chapter')).toHaveValue(2));

    // 3. Switch to MANUAL mode.
    const toggleBtn = screen.getByTestId('switch-ai-use');
    fireEvent.click(toggleBtn);

    // 4. IMPORTANT: Wait for the manual fields to appear in the DOM.
    // If we don't wait, fireEvent.change might be called on elements not yet rendered.
    const firstSetArea = await screen.findByTestId('first-set');
    const secondSetArea = screen.getByTestId('second-set');
    const titleInput = screen.getByTestId('title');
    const typeSelect = screen.getByTestId('exercise-type');

    // 5. Fill out the form so parseForm() validation passes.
    fireEvent.change(titleInput, { target: { value: 'Loading Test' } });
    fireEvent.change(firstSetArea, { target: { value: 'Hello' } });
    fireEvent.change(secondSetArea, { target: { value: 'Hola' } });
    fireEvent.change(typeSelect, { target: { value: '1' } });

    // 6. Submit the form.
    const saveBtn = screen.getByTestId('save');
    disableClientValidation();

    // Wrap the click in act because it triggers multiple state changes.
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // 7. ASSERTION: Verify the loading overlay is visible.
    // Because mockHandleSubmit is 'hanging', setIsLoading(false) is never reached.
    const overlay = await screen.findByTestId('loadingBox');
    expect(overlay).toBeInTheDocument();

    // Verify the form is gone (proving the conditional rendering is working)
    expect(screen.queryByTestId('save')).not.toBeInTheDocument();
  });

  it('renders email confirmation message for unauthorized roles', async () => {
    vi.mocked(useOutletContext).mockReturnValue({ 
      user: { ...mockUser, role: ROLE_TYPE.LEARNER } 
    });

    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );
    expect(screen.getByText(/An email address confirmation request has been sent/i)).toBeInTheDocument();
  });
});