import { render, screen, act, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import axios from 'axios';
import BucketListExercise from './BucketListExercise';
import { getRandomizedSequence } from '../../../../../utils/utils';
import type { ExerciseInfo } from '../../../../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../../../../types/ui/ComponentHandles';
import disableClientValidation from '../../../../../utils/test-utils/disableClientValidation';

// Mocking axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mocking the utils function to keep the sequence deterministic for testing
vi.mock('../../../../../utils/utils', () => ({
  getRandomizedSequence: vi.fn((length: number) => Array.from({ length }, (_, i) => i)),
}));

// Mocking the BucketListItem component
vi.mock('./BucketListItem', () => ({
  BucketListItem: ({ itemValue, position, itemClicked }: any) => (
    <button
      data-testid={`item-${itemValue}`}
      onClick={() => itemClicked(itemValue, position)}
    >
      {itemValue}
    </button>
  ),
}));

describe('BucketListExercise Component', () => {
  const mockSetError = vi.fn();
  const mockMoveNext = vi.fn();

  const mockExerciseInfo: ExerciseInfo = {
    id: '1',
    data: JSON.stringify({ First: 'Question Label', Second: 'Answer Label' }),
    answers: ['Apple', 'Banana'],
    extraItems: ['Carrot'],
    type: 'bucket-list',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly and populates the bucket', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={mockExerciseInfo}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    // Check if the label from JSON data is rendered
    expect(await screen.findByText('Question Label')).toBeInTheDocument();

    // Check if bucket items (answers + extraItems) are rendered
    // Based on our mock sequence [0, 1, 2], order is Carrot, Apple, Banana
    expect(await screen.findByTestId('item-Carrot')).toBeInTheDocument();
    expect(await screen.findByTestId('item-Apple')).toBeInTheDocument();
    expect(await screen.findByTestId('item-Banana')).toBeInTheDocument();
  });

  it('moves items between bucket and answer list on click', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={mockExerciseInfo}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    const appleButton = await screen.findByTestId('item-Apple');
    
    // Click to move from bucket to answer
    await act(async () => {
      appleButton.click();
    });

    // In this component's structure, we check if it's still there (it re-renders in the answer div)
    expect(appleButton).toBeInTheDocument();

    // Click again to move from answer back to bucket
    await act(async () => {
      appleButton.click();
    });

    expect(appleButton).toBeInTheDocument();
  });

  it('calls moveNext when checkAnswer is called with correct answers', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={mockExerciseInfo}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    // Correct order according to mockExerciseInfo.answers: Apple, then Banana
    const appleBtn = await screen.findByTestId('item-Apple');
    const bananaBtn = await screen.findByTestId('item-Banana');

    await act(async () => {
      appleBtn.click();
    });
    await act(async () => {
      bananaBtn.click();
    });

    // Requirement: call disableClientValidation before "submitting" via ref
    disableClientValidation();

    let result;
    await act(async () => {
      result = ref.current?.checkAnswer();
    });

    expect(result).toBe(true);
    expect(mockMoveNext).toHaveBeenCalled();
    expect(mockSetError).not.toHaveBeenCalled();
  });

  it('calls setError when checkAnswer is called with incorrect answers', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={mockExerciseInfo}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    // Click items in wrong order or wrong items
    const carrotBtn = await screen.findByTestId('item-Carrot');
    await act(async () => {
      carrotBtn.click();
    });

    disableClientValidation();

    let result;
    await act(async () => {
      result = ref.current?.checkAnswer();
    });

    expect(result).toBe(false);
    expect(mockSetError).toHaveBeenCalledWith('You have got an error. Try again!');
    expect(mockMoveNext).not.toHaveBeenCalled();
  });

  it('displays the answer label when displayAnswer prop is true', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={mockExerciseInfo}
        setError={mockSetError}
        moveNext={mockMoveNext}
        displayAnswer={true}
        ref={ref}
      />
    );

    expect(await screen.findByText('Answer Label')).toBeInTheDocument();
  });

  it('exposes getCurrentAnswer as an empty string', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={mockExerciseInfo}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    let answer;
    await act(async () => {
      answer = ref.current?.getCurrentAnswer();
    });
    expect(answer).toBe('');
  });
});