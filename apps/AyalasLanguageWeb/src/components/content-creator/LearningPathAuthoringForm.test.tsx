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
  languageSettings: { knownLanguage: 'English', targetLanguage: 'Spanish' },
  disablePuter: true
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
  encodeXMLElements: vi.fn((s) => s),
}));

//Mock FormHeader component to keep the test light
vi.mock('../FormHeader', async () => {
  const actual = await vi.importActual('../FormHeader');
  return {
    ...actual,
    FormHeader: () => <div data-testid="form-header"><h1>Lesson editor</h1></div>,
  };
});

describe('LearningPathAuthoringForm', () => {
  const mockHandleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOutletContext).mockReturnValue({ user: mockUser });
    mockedAxios.post.mockResolvedValue({ data: { chapter: 2 } });
  });

  it('shows loading overlay during submission', async () => {
    mockHandleSubmit.mockImplementation(() => new Promise(() => { }));

    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );

    // 1. Wait for initial stability
    await waitFor(() => expect(screen.getByTestId('chapter')).toHaveValue(2));

    let menuBtn = await screen.findByTestId('more-actions');
    await act(async () => {
      fireEvent.click(menuBtn);
    });

    // 2. Switch to MANUAL mode
    fireEvent.click(screen.getByTestId('switch-ai-use'));

    // 3. Fill the form
    // We fill all fields to ensure parseForm passes regardless of ExerciseType logic
    const firstSetArea = await screen.findByTestId('first-set');
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Loading Test' } });
    fireEvent.change(firstSetArea, { target: { value: 'Hello' } });
    fireEvent.change(screen.getByTestId('second-set'), { target: { value: 'Hola' } });

    const typeSelect = screen.getByTestId('exercise-type');
    fireEvent.change(typeSelect, { target: { value: '1' } });

    // If "Translate" (type 1) requires extra options, provide them
    const extraOptions = screen.queryByTestId('extra-options');
    if (extraOptions) {
      fireEvent.change(extraOptions, { target: { value: 'Wrong Option' } });
    }

    // 4. Submit
    const saveBtn = screen.getByTestId('save');
    disableClientValidation();

    act(() => {
      fireEvent.click(saveBtn);
    });

    // 5. ASSERTIONS

    // A) The loading box should appear
    const overlay = await screen.findByTestId('loadingBox');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveTextContent(/generating exercises/i);

    // B) The Save button remains in DOM but is DISABLED (based on your JSX)
    expect(screen.getByTestId('save')).toBeDisabled();

    // C) The inputs section should be GONE (this proves the conditional render worked)
    // We use queryBy because we expect them to be null
    expect(screen.queryByTestId('level')).not.toBeInTheDocument();
    expect(screen.queryByTestId('first-set')).not.toBeInTheDocument();
    expect(screen.queryByTestId('title')).not.toBeInTheDocument();
  });
});