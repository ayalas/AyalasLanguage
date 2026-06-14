import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LearningPathAuthoringForm } from './LearningPathAuthoringForm'; // Adjust path
import axios from 'axios';
import * as router from 'react-router-dom';
import { downloadFile } from '../../utils/utils';
import { AUTHOR_ACCESS } from '../../constants/learning';
import { EXERCISE_TYPES } from '../../types/exercise/Exercise';
import disableClientValidation from '../../utils/test-utils/disableClientValidation';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock react-router-dom hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useSearchParams: vi.fn(),
  useOutletContext: vi.fn(),
}));

// Mock utils
vi.mock('../../utils/utils', () => ({
  removeLastCharIfMatch: vi.fn((str) => str?.endsWith(';') ? str.slice(0, -1) : str),
  downloadFile: vi.fn(),
  errorHandler: vi.fn(),
}));

// Mock Constants (Optional: only if they aren't available in the test env)
// Note: We use the real constants here since they are typically objects/arrays
// and provided in your code snippet.

describe('LearningPathAuthoringForm', () => {
  const mockNavigate = vi.fn();
  const mockHandleSubmit = vi.fn((_setError, createExercises, _level, _chapter, _title, type, arrData) => {
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
  });

  it('renders the form and handles successful submission', async () => {
    mockedAxios.post.mockResolvedValue({ data: { exerciseId: 1 } });

    render(
      <LearningPathAuthoringForm 
        handleSubmit={mockHandleSubmit} 
      />
    );

    // requirement: call disableClientValidation after rendering
    disableClientValidation();

    // Fill out the form
    const titleInput = await screen.findByTestId('title');
    fireEvent.change(titleInput, { target: { value: 'My New Lesson' } });

    const exerciseTypeSelect = await screen.findByTestId('exercise-type');
    fireEvent.change(exerciseTypeSelect, { target: { value: String(EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET) } });

    const firstSet = await screen.findByTestId('first-set');
    fireEvent.change(firstSet, { target: { value: 'Hello;Goodbye' } });

    const secondSet = await screen.findByTestId('second-set');
    fireEvent.change(secondSet, { target: { value: 'Hola;Adios' } });

    const extraOptions = await screen.findByTestId('extra-options');
    fireEvent.change(extraOptions, { target: { value: 'Option1;Option2' } });

    // Click Save
    const saveBtn = await screen.findByTestId('save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      // Check if axios.post was called for each exercise (2 items in our semicolon string)
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/creator/exercise', expect.objectContaining({
        learningPathId: 123,
        exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET
      }));
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

    expect(mockHandleSubmit).toHaveBeenCalledWith(
        expect.anything(), // setError
        expect.anything(), // createExercises
        expect.anything(), // level
        expect.anything(), // chapter
        expect.anything(), // title
        expect.anything(), // exerciseType
        null               // arrData (the one we are testing is null)
      );
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