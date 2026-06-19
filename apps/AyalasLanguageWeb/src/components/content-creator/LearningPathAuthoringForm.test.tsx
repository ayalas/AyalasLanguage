import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LearningPathAuthoringForm } from './LearningPathAuthoringForm'; // Adjust path
import axios from 'axios';
import * as router from 'react-router-dom';
import { downloadFile } from '../../utils/utils';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';

// Mock axios
vi.mock('axios');

const mockedAxios = vi.mocked(axios);

vi.mock('@heyputer/puter.js', () => ({
  puter: {
    ai: {
      txt2speech: vi.fn(),
    },
    auth: {
      isSignedIn: vi.fn(() => false),
      signIn: vi.fn()
    }
  },
}));

// Mock react-router-dom hooks
// Mock react-router-dom hooks and components
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual, 
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(),
    useOutletContext: vi.fn(),
    // Mock Link to be a simple <a> tag to avoid "Missing Router Context" errors
    Link: vi.fn().mockImplementation(({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    )),
  };
});

// Mock utils
vi.mock('../../utils/utils', () => ({
  removeLastCharIfMatch: vi.fn((str) => str?.endsWith(';') ? str.slice(0, -1) : str),
  downloadFile: vi.fn(),
  errorHandler: vi.fn(),
  initializePuter: vi.fn(() => false)
}));

// Mock Constants (Optional: only if they aren't available in the test env)
// Note: We use the real constants here since they are typically objects/arrays
// and provided in your code snippet.

describe('LearningPathAuthoringForm', () => {
  const mockNavigate = vi.fn();
  const mockHandleSubmit = vi.fn(async (_setError, createExercises, _level, _chapter, _title, type, arrData) => {
    // Simulate the behavior of calling the callback passed to handleSubmit
    if (arrData != null && arrData.length > 0) {
      createExercises(123, type, arrData);
    }
  });

  const mockUser = {
    languageSettings: {
      knownLanguage: 'English',
      targetLanguage: 'Spanish',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(router.useSearchParams).mockReturnValue([new URLSearchParams(), vi.fn()]);
    vi.mocked(router.useOutletContext).mockReturnValue({ user: mockUser });

    // Default mock for the initialization call
    mockedAxios.post.mockImplementation((url) => {
      if (url === '/api/creator/next-chapter') {
        return Promise.resolve({ data: { chapter: 2 } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders the form and handles successful submission', async () => {
    // Setup specific response for exercise creation
    mockedAxios.post.mockImplementation((url) => {
      if (url === '/api/creator/next-chapter') return Promise.resolve({ data: { chapter: 2 } });
      if (url === '/api/creator/exercise') return Promise.resolve({ data: { exerciseId: 1 } });
      return Promise.resolve({ data: {} });
    });

    render(<LearningPathAuthoringForm handleSubmit={mockHandleSubmit} />);

    // Wait for initial loading to finish
    await waitFor(() => expect(screen.queryByText(/Generating exercises.../i)).not.toBeInTheDocument());

    disableClientValidation();

    const titleInput = await screen.findByTestId('title');
    fireEvent.change(titleInput, { target: { value: 'My New Lesson' } });

    const exerciseTypeSelect = await screen.findByTestId('exercise-type');
    fireEvent.change(exerciseTypeSelect, { target: { value: String(EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) } });

    // Component logic automatically switches to manual mode if initializePuter returns false
    const firstSet = await screen.findByTestId('first-set');
    fireEvent.change(firstSet, { target: { value: 'Hello;Goodbye' } });

    const secondSet = await screen.findByTestId('second-set');
    fireEvent.change(secondSet, { target: { value: 'Hola;Adios' } });

    const extraOptions = await screen.findByTestId('extra-options');
    fireEvent.change(extraOptions, { target: { value: 'Option1;Option2' } });

    const saveBtn = await screen.findByTestId('save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      // 1 (next-chapter) + 2 (exercises) = 3 calls
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });
  });

  it('shows error when first set and second set counts mismatch', async () => {

    const initialRecord = {
      learningPathId: 456,
      level: 1,
      chapter: 1,
      name: 'Test Lesson',
      access: AUTHOR_ACCESS.CAN_EDIT,
      exerciseCount: 0
    };
    render(<LearningPathAuthoringForm handleSubmit={mockHandleSubmit} initialRecord={initialRecord} reloadExercise={vi.fn()} />);

    disableClientValidation();

    const firstSet = await screen.findByTestId('first-set');
    fireEvent.change(firstSet, { target: { value: 'One;Two;Three' } }); // 3 items

    const secondSet = await screen.findByTestId('second-set');
    fireEvent.change(secondSet, { target: { value: 'Uno;Dos' } }); // 2 items

    const saveBtn = await screen.findByTestId('save');
    fireEvent.click(saveBtn);

    const errorMessage = await screen.findByText(/Must have a match between the number of words/i);
    expect(errorMessage).toBeInTheDocument();

    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });

  it('handles lesson deletion', async () => {
    const initialRecord = {
      learningPathId: 456,
      level: 1,
      chapter: 1,
      name: 'Test Lesson',
      access: AUTHOR_ACCESS.CAN_EDIT,
      exerciseCount: 0
    };

    mockedAxios.delete.mockResolvedValue({});

    render(
      <LearningPathAuthoringForm
        handleSubmit={mockHandleSubmit}
        initialRecord={initialRecord}
      />
    );

    disableClientValidation();

    const deleteBtn = await screen.findByTestId('delete-lesson');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/creator/learning-path/456');
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('triggers file export correctly', async () => {
    const initialRecord = {
      learningPathId: 789,
      level: 1,
      chapter: 1,
      name: 'Export Test',
      access: AUTHOR_ACCESS.CAN_EDIT
    };

    // 1. Create a mock blob to represent the file data
    const mockBlob = new Blob(['{"exercises": []}'], { type: 'application/json' });

    // 2. Mock axios.get to return an object with a 'data' property containing the blob
    mockedAxios.get.mockResolvedValue({
      data: mockBlob,
      status: 200,
      statusText: 'OK'
    });

    render(
      <LearningPathAuthoringForm
        handleSubmit={mockHandleSubmit}
        initialRecord={initialRecord}
      />
    );

    disableClientValidation();

    const exportBtn = await screen.findByTestId('export-exercises');
    fireEvent.click(exportBtn);

    await waitFor(() => {
      // 3. Verify axios was called with the correct URL and responseType
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/learning/path/789/exercises',
        { responseType: 'blob' }
      );

      // 4. Verify downloadFile was called with the blob from response.data
      expect(downloadFile).toHaveBeenCalledWith(
        mockBlob,
        'Export Test-exercises-789.json'
      );
    });
  });

  it('handles exercise import workflow', async () => {
    const initialRecord = {
      learningPathId: 101,
      level: 1,
      chapter: 1,
      name: 'Import Test',
      access: AUTHOR_ACCESS.CAN_EDIT
    };

    render(
      <LearningPathAuthoringForm
        handleSubmit={mockHandleSubmit}
        initialRecord={initialRecord}
      />
    );

    disableClientValidation();

    // 1. Click import to show file input
    const importBtn = await screen.findByTestId('import-exercises');
    fireEvent.click(importBtn);

    const fileInput = await screen.findByTestId('import-file');
    const file = new File(['{}'], 'exercises.json', { type: 'application/json' });

    // 2. Select file
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 3. Click import again to submit
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/creator/learning-path/101/import',
        expect.any(FormData)
      );
    });
  });
});