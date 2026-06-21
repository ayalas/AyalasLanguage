import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { ExerciseLine } from './ExerciseLine';
import type { ExtendedExerciseInfo } from '../../../types/exercise/Exercise';
import { errorHandler } from '@ayalaslanguage/types/error';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';

// Mock axios
vi.mock('axios');
 const mockedAxios = vi.mocked(axios);

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock errorHandler utility

vi.mock('@ayalaslanguage/types/error', () => ({
  errorHandler: vi.fn((_err, setError) => setError('Mocked Error Message')),
}));

describe('ExerciseLine Component', () => {
  const mockExercise: ExtendedExerciseInfo = {
    exerciseId: 123,
    exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
    access: AUTHOR_ACCESS.CAN_EDIT,
    data: '{First: \'Sample Exercise Content\'}',
    exerciseObject: {
      First: 'Sample Exercise Content',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the exercise content and action buttons', () => {
    render(
      <MemoryRouter>
        <ExerciseLine exerciseInfo={mockExercise} />
      </MemoryRouter>
    );

    expect(screen.getByText('Sample Exercise Content')).toBeInTheDocument();
    expect(screen.getByTestId('delete-item')).toBeInTheDocument();
    expect(screen.getByTestId('edit-item')).toBeInTheDocument();
  });

  it('navigates to the edit page when edit button is clicked', () => {
    render(
      <MemoryRouter>
        <ExerciseLine exerciseInfo={mockExercise} />
      </MemoryRouter>
    );

    disableClientValidation();

    const editBtn = screen.getByTestId('edit-item');
    fireEvent.click(editBtn);

    expect(mockNavigate).toHaveBeenCalledWith(`/author/exercise/${mockExercise.exerciseId}`);
  });

  it('calls axios delete and removes the item from view on success', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 200 });

    render(
      <MemoryRouter>
        <ExerciseLine exerciseInfo={mockExercise} />
      </MemoryRouter>
    );

    disableClientValidation();

    const deleteBtn = screen.getByTestId('delete-item');
    fireEvent.click(deleteBtn);

    expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/creator/exercise/${mockExercise.exerciseId}`);

    // After success, the row should no longer be in the document (exists = false)
    await waitFor(() => {
      expect(screen.queryByText('Sample Exercise Content')).not.toBeInTheDocument();
    });
  });

  it('displays an error message when deletion fails', async () => {
    mockedAxios.delete.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <ExerciseLine exerciseInfo={mockExercise} />
      </MemoryRouter>
    );

    disableClientValidation();

    const deleteBtn = screen.getByTestId('delete-item');
    fireEvent.click(deleteBtn);

    // Check if errorHandler was called and UI updated with the error
    await waitFor(() => {
      expect(errorHandler).toHaveBeenCalled();
      expect(screen.getByText('Mocked Error Message')).toBeInTheDocument();
    });
  });

  it('does not show edit/delete buttons if user does not have edit access', () => {
    const readOnlyExercise = {
      ...mockExercise
    };
    readOnlyExercise.access = AUTHOR_ACCESS.LEARNER;
    render(
      <MemoryRouter>
        <ExerciseLine exerciseInfo={readOnlyExercise as ExtendedExerciseInfo} />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('delete-item')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-item')).not.toBeInTheDocument();
    expect(screen.getByText('Sample Exercise Content')).toBeInTheDocument();
  });
});