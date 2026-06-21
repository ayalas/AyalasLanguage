import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { LearningPathCreatePage } from './LearningPathCreatePage'; // Adjust path as necessary
import { LearningPathAuthoringForm } from '../../components/content-creator/LearningPathAuthoringForm';
import disableClientValidation from '@ayalaslanguage/types/test-utils';

// Mocking axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

// Mock internal components and utils
vi.mock('../../components/auth/AuthHeader', () => ({
  AuthHeader: () => <div data-testid="auth-header">Auth Header</div>,
}));

vi.mock('@ayalaslanguage/types/error', () => ({
  errorHandler: vi.fn(),
}));

// Mock the form component to simulate the callback
vi.mock('../../components/content-creator/LearningPathAuthoringForm', () => ({
  LearningPathAuthoringForm: vi.fn(({ handleSubmit }) => (
    <div data-testid="mock-form">
      <button
        data-testid="submit-btn"
        onClick={() =>
          handleSubmit(
            vi.fn(), // setError
            vi.fn().mockResolvedValue(true), // createExercises
            1, // level
            2, // chapter
            'Test Path', // title
            3, // exerciseType
            [{ id: 1 }] // arrData
          )
        }
      >
        Submit
      </button>
    </div>
  )),
}));

describe('LearningPathCreatePage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useSearchParams as any).mockReturnValue([new URLSearchParams()]);
  });

  it('renders correctly and handles successful creation with data', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { learningPathId: 123 } });

    render(
      <MemoryRouter>
        <LearningPathCreatePage />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('auth-header')).toBeInTheDocument();

    // Call the required function before clicking submit
    disableClientValidation();

    const submitBtn = await screen.findByTestId('submit-btn');
    await act(async () => {
      submitBtn.click();
    });

    expect(mockedAxios.post).toHaveBeenCalledWith('/api/creator/learning-path', {
      level: 1,
      chapter: 2,
      name: 'Test Path',
    });

    expect(mockNavigate).toHaveBeenCalledWith(`/path/123`);
  });

  it('navigates to path detail if arrData is empty', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { learningPathId: 456 } });

    // Update the mock for this specific test case to send empty arrData
    (LearningPathAuthoringForm as any).mockImplementationOnce(({ handleSubmit }: any) => (
      <button
        data-testid="submit-btn-empty"
        onClick={() => handleSubmit(vi.fn(), vi.fn(), 1, 1, 'Empty', 1, [])}
      >
        Submit Empty
      </button>
    ));

    render(
      <MemoryRouter>
        <LearningPathCreatePage />
      </MemoryRouter>
    );

    disableClientValidation();

    const submitBtn = await screen.findByTestId('submit-btn-empty');
    await act(async () => {
      submitBtn.click();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/author/path/456');
  });

  it('includes prevId and nextId in the request when present in URL', async () => {
    const searchParams = new URLSearchParams('prev=10&next=20');
    (useSearchParams as any).mockReturnValue([searchParams]);
    
    mockedAxios.post.mockResolvedValueOnce({ data: { learningPathId: 789 } });

    render(
      <MemoryRouter>
        <LearningPathCreatePage />
      </MemoryRouter>
    );

    disableClientValidation();

    const submitBtn = await screen.findByTestId('submit-btn');
    await act(async () => {
      submitBtn.click();
    });

    expect(mockedAxios.post).toHaveBeenCalledWith('/api/creator/learning-path', expect.objectContaining({
      prevLearningPathId: '10',
      nextLearningPathId: '20'
    }));
  });

  it('deletes the learning path if createExercises fails', async () => {
    const learningPathId = 999;
    mockedAxios.post.mockResolvedValueOnce({ data: { learningPathId } });
    
    const mockCreateExercises = vi.fn().mockRejectedValueOnce(new Error('Failed to create exercises'));

    (LearningPathAuthoringForm as any).mockImplementationOnce(({ handleSubmit }: any) => (
      <button
        data-testid="submit-btn-fail"
        onClick={() => handleSubmit(vi.fn(), mockCreateExercises, 1, 1, 'Fail Test', 1, [{ id: 1 }])}
      >
        Submit Fail
      </button>
    ));

    render(
      <MemoryRouter>
        <LearningPathCreatePage />
      </MemoryRouter>
    );

    disableClientValidation();

    const submitBtn = await screen.findByTestId('submit-btn-fail');
    await act(async () => {
      submitBtn.click();
    });

    // Verify it attempted to cleanup
    expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/creator/learning-path/${learningPathId}`);
  });
});