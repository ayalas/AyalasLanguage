import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BucketListExercise from './BucketListExercise';
import { getRandomizedSequence } from '../../../../../utils/utils';
import type { ExerciseData, ExtendedExerciseInfo } from '../../../../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../../../../types/ui/ComponentHandles';
import disableClientValidation from '../../../../../utils/test-utils/disableClientValidation';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';

// Mock axios
vi.mock('axios');

// Mock the utils library
vi.mock('../../../../../utils/utils', () => ({
  getRandomizedSequence: vi.fn(),
}));

describe('BucketListExercise', () => {
  const mockSetError = vi.fn();
  const mockMoveNext = vi.fn();
  const mockPlayTargetText = vi.fn();

  const objData: ExerciseData = { First: 'Header', Second: 'Footer' };
  const exerciseInfoMock: ExtendedExerciseInfo = {
    exerciseId: 1,
    exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
    data: JSON.stringify(objData),
    exerciseObject: objData,
    answers: ['Apple', 'Banana'],
    extraItems: ['Cherry'],
    access: AUTHOR_ACCESS.CAN_EDIT
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Force a specific order: [Cherry, Apple, Banana]
    vi.mocked(getRandomizedSequence).mockReturnValue([0, 1, 2]);
  });

  it('calls moveNext when checkAnswer is called with correct answers', async () => {
    const ref = React.createRef<ExerciseHandle>();

    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        playTargetText={mockPlayTargetText}
        ref={ref}
      />
    );

    // Call the external function after render as requested
    disableClientValidation();

    // 1. Move "Apple" to the answer list
    // Re-finding right before the click ensures we have the latest closure
    const appleBtn = await screen.findByRole('button', { name: 'Apple' });
    await act(async () => {
      appleBtn.click();
    });

    // 2. Move "Banana" to the answer list
    // CRITICAL: We re-find Banana AFTER the first click has triggered a re-render
    // This button now has the updated closure where answerList is ['Apple']
    const bananaBtn = await screen.findByRole('button', { name: 'Banana' });
    await act(async () => {
      bananaBtn.click();
    });

    // 3. Execute checkAnswer from ref
    let result: boolean = false;
    await act(async () => {
      if (ref.current) {
        result = ref.current.checkAnswer();
      }
    });

    // Assertions
    expect(result).toBe(true);
    expect(mockMoveNext).toHaveBeenCalled();
    expect(mockSetError).not.toHaveBeenCalled();
  });

  it('calls setError when answer length is incorrect', async () => {
    const ref = React.createRef<ExerciseHandle>();

    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        playTargetText={mockPlayTargetText}
        ref={ref}
      />
    );

    disableClientValidation();

    // Only click Apple
    const appleBtn = await screen.findByRole('button', { name: 'Apple' });
    await act(async () => {
      appleBtn.click();
    });

    let result: boolean = true;
    await act(async () => {
      if (ref.current) {
        result = ref.current.checkAnswer();
      }
    });

    expect(result).toBe(false);
    expect(mockSetError).toHaveBeenCalledWith('You have got an error. Try again!');
    expect(mockMoveNext).not.toHaveBeenCalled();
  });

  it('calls setError when answers are in the wrong order', async () => {
    const ref = React.createRef<ExerciseHandle>();

    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        playTargetText={mockPlayTargetText}
        ref={ref}
      />
    );

    disableClientValidation();

    // Click Banana first then Apple (Wrong order based on exerciseInfo.answers)
    const bananaBtn = await screen.findByRole('button', { name: 'Banana' });
    await act(async () => {
      bananaBtn.click();
    });

    const appleBtn = await screen.findByRole('button', { name: 'Apple' });
    await act(async () => {
      appleBtn.click();
    });

    let result: boolean = true;
    await act(async () => {
      if (ref.current) {
        result = ref.current.checkAnswer();
      }
    });

    expect(result).toBe(false);
    expect(mockSetError).toHaveBeenCalled();
  });
});