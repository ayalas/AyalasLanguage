import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LearningPathAuthoringForm } from './LearningPathAuthoringForm';
import axios from 'axios';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { ROLE_TYPE } from '@ayalaslanguage/types/auth';
import { MemoryRouter, useOutletContext } from 'react-router-dom';
import puter from '@heyputer/puter.js';
import * as utils from '../../utils/utils';

// Setup global mock variables
const mockNavigate = vi.fn();
const mockUser = {
  userName: 'test@example.com',
  role: ROLE_TYPE.CONTENT_CREATOR,
  languageSettings: { knownLanguage: 'English', targetLanguage: 'Spanish' }
};

// Mock dependencies
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

// Mock individual utility functions
vi.mock('../../utils/utils', () => ({
  removeLastCharIfMatch: vi.fn((s) => s),
  initializePuter: vi.fn().mockResolvedValue(true),
  parseLLMResponse: vi.fn(),
  writeToLog: vi.fn(),
  downloadFile: vi.fn(),
}));

vi.mock('@heyputer/puter.js', () => ({
  default: {
    ai: {
      chat: vi.fn()
    }
  }
}));

describe('LearningPathAuthoringForm', () => {
  const mockHandleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOutletContext).mockReturnValue({ user: mockUser });
    mockedAxios.post.mockResolvedValue({ data: { chapter: 2 } });
    
    // Default valid mock implementation for parseLLMResponse
    vi.mocked(utils.parseLLMResponse).mockReturnValue([
      { First: 'Hello', Second: 'Hola', ExtraOptions: 'One;Two' }
    ]);

    // Default AI mock response
    vi.mocked(puter.ai.chat).mockResolvedValue({
      message: { content: 'some raw text' }
    } as any);
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

  it('renders the editor form for CONTENT_CREATOR role', async () => {
    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );
    await screen.findByText('Lesson editor');
  });

  it('toggles between Automated AI and Manual AI inputs', async () => {
    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );
    await screen.findByText('Lesson editor');
    fireEvent.click(screen.getByTestId('switch-ai-use'));
    expect(screen.getByTestId('first-set')).toBeInTheDocument();
  });

  it('calls handleSubmit with correct data when saving in manual mode', async () => {
    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId('chapter')).toHaveValue(2));

    fireEvent.click(screen.getByTestId('switch-ai-use'));
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'New Lesson' } });
    fireEvent.change(screen.getByTestId('first-set'), { target: { value: 'Hello;Goodbye' } });
    fireEvent.change(screen.getByTestId('second-set'), { target: { value: 'Hola;Adios' } });
    fireEvent.change(screen.getByTestId('exercise-type'), { target: { value: '1' } });

    disableClientValidation();
    fireEvent.click(screen.getByTestId('save'));

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        1,
        2,
        'New Lesson',
        1,
        [
          { First: 'Hello', Second: 'Hola' },
          { First: 'Goodbye', Second: 'Adios' }
        ]
      );
    });
  });

  it('shows loading overlay during submission', async () => {
    // 1. Force handleSubmit to never resolve so isLoading stays true
    mockHandleSubmit.mockReturnValue(new Promise(() => {}));

    // 2. Ensure parseLLMResponse returns a valid array that passes all validation checks
    vi.mocked(utils.parseLLMResponse).mockReturnValue([
      { First: 'Test', Second: 'Prueba', ExtraOptions: 'opt1;opt2' }
    ]);

    render(
      <MemoryRouter>
        <LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />
      </MemoryRouter>
    );

    await screen.findByText('Lesson editor');

    // 3. Fill form to satisfy parseForm prerequisites
    fireEvent.change(screen.getByTestId('title'), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByTestId('exercise-type'), { target: { value: '1' } });

    // 4. Submit
    disableClientValidation();
    fireEvent.click(screen.getByTestId('save'));

    // 5. Use findByText to wait for the loading overlay to appear
    const loadingText = await screen.findByText(/Generating exercises/i);
    expect(loadingText).toBeInTheDocument();
  });
});