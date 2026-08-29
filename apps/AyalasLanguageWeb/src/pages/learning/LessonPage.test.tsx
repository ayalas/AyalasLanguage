import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import React from 'react';
import { MemoryRouter, useParams, useOutletContext } from 'react-router-dom';
import { LessonPage } from './LessonPage';
import { type ExerciseData, type PagedExercisesResponse } from '@ayalaslanguage/types/sharedfrontlib/learning';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { AUTHOR_ACCESS, OWNERSHIP_TYPE } from '@ayalaslanguage/types/auth';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';
import { toast } from 'sonner';

// Mock axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);
const { mockNavigate } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
  };
});

vi.mock('sonner', () => {
  const toastMock = vi.fn(() => 'id-123'); // returns a fake toastId
  // @ts-ignore
  toastMock.dismiss = vi.fn();
  return { toast: toastMock };
});

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn().mockReturnValue(mockNavigate),
    useOutletContext: vi.fn(),
  };
});

// Mock Language Utils
vi.mock('@ayalaslanguage/types/sharedfrontlib/utils', () => ({
  replaceCharsForLanguage: vi.fn((_lang, text) => text),
  getMissingParts: vi.fn(() => []),
  setLanguageSettings: vi.fn(),
}));

// Mock Exercise sub-component
vi.mock('./exercise/Exercise', () => ({
  Exercise: React.forwardRef((props: any, ref: any) => {
    const mockHandle = {
      setFocus: vi.fn(),
      checkAnswer: vi.fn(() => true),
      getCurrentAnswer: vi.fn(() => 'test'),
    };
    React.useImperativeHandle(ref, () => mockHandle);

    return (
      <div data-testid="exercise-container">
        <button data-testid="trigger-move-next" onClick={props.moveNext}>Next</button>
        <button data-testid="trigger-save" onClick={props.saveProgress}>Save</button>
      </div>
    );
  }),
}));


describe('LessonPage', () => {

  const mockLogin = vi.fn();
  const mockUser = {
    disableAutoAI: true,
    languageSettings: { targetLanguage: 'Spanish' },
  };

  const mockPathData = {
    level: 1,
    chapter: 'Ch1',
    name: 'Lesson 1',
    exerciseCount: 2,
    practiseMistakesInThisPath: false,
    exerciseId: 101,
    ownershipType: OWNERSHIP_TYPE.PUBLIC
  };

  const data1: ExerciseData = { First: 'can', Second: 'will' };
  const data2: ExerciseData = { First: 'cat', Second: 'dog' };
  const mockExercises: PagedExercisesResponse = {
    page: 0,
    numOfRecords: 2,
    data: [
      { exerciseId: 101, exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET, data: JSON.stringify(data1), access: AUTHOR_ACCESS.CAN_EDIT, ownershipType: OWNERSHIP_TYPE.PUBLIC },
      { exerciseId: 102, exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET, data: JSON.stringify(data2), access: AUTHOR_ACCESS.CAN_EDIT, ownershipType: OWNERSHIP_TYPE.PUBLIC }
    ]
  } as PagedExercisesResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ learningPathId: '1' });
    (useOutletContext as any).mockReturnValue({ user: mockUser, login: mockLogin });

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/learning/path/')) return Promise.resolve({ data: mockPathData });
      return Promise.reject(new Error('API Error'));
    });

    mockedAxios.post.mockImplementation((url, body) => {
      if (url.includes('/paged')) {
        // If requesting page 0, return exercises. If page > 0, return empty.
        const requestData = body as any;
        if (requestData.page === 0) {
          return Promise.resolve({ data: mockExercises });
        }
        return Promise.resolve({
          data: { ...mockExercises, data: [], page: requestData.page }
        });
      }

      if (url.includes('/api/profile/score')) {
        return Promise.resolve({ data: { /* mock user data */ } });
      }

      return Promise.resolve({ data: {} });
    });

    mockedAxios.delete.mockResolvedValue({ data: {} });
  });

  it('completes the lesson and navigates home when moveNext is called on the last exercise', async () => {
    render(
      <MemoryRouter>
        <LessonPage />
      </MemoryRouter>
    );

    // 1. Trigger Next on Exercise 1
    const nextBtnEx1 = await screen.findByTestId('trigger-move-next');
    fireEvent.click(nextBtnEx1);

    // 2. Wait for Exercise 2 to render
    await screen.findByText('Exercise 2 of 2');

    // 3. Trigger Next on Exercise 2
    const nextBtnEx2 = await screen.findByTestId('trigger-move-next');
    fireEvent.click(nextBtnEx2);

    // 4. Wait for sequential async score and progress calls
    await waitFor(() => {
      // Note: scoreToAdd becomes 2 because moveNext increments it each time
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/profile/score', { scoreToAdd: 2 });
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/learning/progress', { learningPathId: '1' });
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('saves progress via POST when past the first exercise', async () => {
    render(
      <MemoryRouter>
        <LessonPage />
      </MemoryRouter>
    );

    const nextBtn = await screen.findByTestId('trigger-move-next');
    disableClientValidation();
    fireEvent.click(nextBtn);
    await screen.findByText('Exercise 2 of 2');

    const saveBtn = await screen.findByTestId('trigger-save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/learning/progress', {
        learningPathId: '1',
        exerciseId: 102,
        practiseMistakesInThisPath: false
      });
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('saves progress via DELETE when on the first exercise', async () => {
    render(
      <MemoryRouter>
        <LessonPage />
      </MemoryRouter>
    );

    await screen.findByText('Exercise 1 of 2');
    disableClientValidation();

    const saveBtn = await screen.findByTestId('trigger-save');
    fireEvent.click(saveBtn);

    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('Save progress to start of this lesson?'),
      expect.any(Object)
    );

    const toastOptions = vi.mocked(toast).mock.calls[0][1] as any;
    const confirmDeleteCallback = toastOptions.action.onClick;

    await act(async () => {
      await confirmDeleteCallback({ preventDefault: vi.fn() });
    });

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/learning/progress/1');
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('wraps imperative handle calls in act() when changing current exercise', async () => {
    render(
      <MemoryRouter>
        <LessonPage />
      </MemoryRouter>
    );

    // Use findBy to wait for the component to finish loading data and render
    const nextBtn = await screen.findByTestId('trigger-move-next');

    // fireEvent is wrapped in act internally by RTL
    fireEvent.click(nextBtn);

    // Check if we moved to the next exercise
    expect(await screen.findByText('Exercise 2 of 2')).toBeInTheDocument();
  });
});