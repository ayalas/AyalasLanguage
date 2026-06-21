import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { LearningPathUpdatePage } from './LearningPathUpdatePage';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import disableClientValidation from '@ayalaslanguage/types/test-utils';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
  };
});

// Mock child components to isolate page logic
vi.mock('../../../components/auth/AuthHeader', () => ({
  AuthHeader: () => <div data-testid="auth-header">Auth Header</div>,
}));

vi.mock('./ExerciseLine', () => ({
  ExerciseLine: ({ exerciseInfo }: any) => (
    <div data-testid="exercise-line">{exerciseInfo.exerciseId}</div>
  ),
}));

// Mock the Form component to capture and trigger the handleSubmit prop
vi.mock('../../../components/content-creator/LearningPathAuthoringForm', () => ({
  LearningPathAuthoringForm: ({ handleSubmit, initialRecord }: any) => (
    <div data-testid="authoring-form">
      <span>{initialRecord?.name}</span>
      <button
        data-testid="mock-submit-btn"
        onClick={() =>
          handleSubmit(
            vi.fn(), // setError
            vi.fn().mockResolvedValue({}), // createExercises
            1, // level
            1, // chapter
            'Updated Title', // title
            1, // exerciseType
            [] // arrData
          )
        }
      >
        Submit
      </button>
    </div>
  ),
}));

describe('LearningPathUpdatePage', () => {
  const mockNavigate = vi.fn();
  const mockLearningPathId = 123;

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useParams as any).mockReturnValue({ learningPathId: mockLearningPathId });
  });

  it('renders correctly and fetches data on mount', async () => {
    const mockPathData = { id: 123, name: 'Path Name', access: AUTHOR_ACCESS.CAN_EDIT };
    const mockExercises = [
      { exerciseId: 1, data: JSON.stringify({ First: 'Ex 1' }) },
      { exerciseId: 2, data: 'Plain Text Data' },
    ];

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/exercises')) {
        return Promise.resolve({ data: mockExercises });
      }
      return Promise.resolve({ data: mockPathData });
    });

    render(
      <MemoryRouter>
        <LearningPathUpdatePage />
      </MemoryRouter>
    );

    // Verify initial data fetching
    expect(await screen.findByTestId('auth-header')).toBeInTheDocument();
    expect(await screen.findByText('Path Name')).toBeInTheDocument();
    
    // Verify existing exercises rendered
    const exerciseLines = await screen.findAllByTestId('exercise-line');
    expect(exerciseLines).toHaveLength(2);
    expect(mockedAxios.get).toHaveBeenCalledWith(`/api/learning/path/${mockLearningPathId}`);
  });

  it('handles form submission successfully', async () => {
    const mockPathData = { id: 123, name: 'Path Name', access: AUTHOR_ACCESS.CAN_EDIT };
    mockedAxios.get.mockResolvedValue({ data: mockPathData });
    mockedAxios.put.mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <LearningPathUpdatePage />
      </MemoryRouter>
    );

    // Wait for initial load
    await screen.findByTestId('authoring-form');

    // Requirement: Call disableClientValidation after rendering and before clicking submit
    disableClientValidation();

    const submitBtn = await screen.findByTestId('mock-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `/api/creator/learning-path/${mockLearningPathId}`,
        { level: 1, chapter: 1, name: 'Updated Title' }
      );
      expect(mockNavigate).toHaveBeenCalledWith(`/path/${mockLearningPathId}`);
    });
  });

  it('displays error message when API call fails', async () => {
    const errorMessage = 'Failed to load learning path';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <MemoryRouter>
        <LearningPathUpdatePage />
      </MemoryRouter>
    );

    const errorLabel = await screen.findByText(errorMessage);
    expect(errorLabel).toBeInTheDocument();
    expect(errorLabel).toHaveClass('form-error');
  });

  it('does not call PUT if user does not have edit access', async () => {
    // Access is View Only
    const mockPathData = { id: 123, name: 'Path Name', access: 'VIEW_ONLY' };
    mockedAxios.get.mockResolvedValue({ data: mockPathData });

    render(
      <MemoryRouter>
        <LearningPathUpdatePage />
      </MemoryRouter>
    );

    await screen.findByTestId('authoring-form');
    
    disableClientValidation();

    const submitBtn = await screen.findByTestId('mock-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedAxios.put).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(`/path/${mockLearningPathId}`);
    });
  });
});