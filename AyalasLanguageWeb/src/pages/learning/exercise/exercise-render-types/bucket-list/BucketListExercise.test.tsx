import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import BucketListExercise from './BucketListExercise';
import { getRandomizedSequence } from '../../../../../utils/utils';
import type { ExerciseInfo } from '../../../../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../../../../types/ui/ComponentHandles';
import disableClientValidation from '../../../../../utils/test-utils/disableClientValidation';

// Mock axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock the utils library
vi.mock('../../../../../utils/utils', () => ({
  getRandomizedSequence: vi.fn(),
}));

describe('BucketListExercise', () => {
  const mockSetError = vi.fn();
  const mockMoveNext = vi.fn();

  const exerciseInfoMock: ExerciseInfo = {
    data: JSON.stringify({ First: 'Instructions Header', Second: 'Correct Answer Display' }),
    answers: ['Apple', 'Banana'],
    extraItems: ['Cherry'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: return indices in order to make tests predictable
    vi.mocked(getRandomizedSequence).mockReturnValue([0, 1, 2]);
  });

  it('renders correctly and handles the bucket list logic', async () => {
    const ref = React.createRef<ExerciseHandle>();

    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    // Call the required function before interactions
    disableClientValidation();

    // Verify header text
    const header = await screen.findByText('Instructions Header');
    expect(header).toBeInTheDocument();

    // The bucket should contain 3 items (extraItems + answers)
    // Based on our mock sequence [0, 1, 2] and the code: [...extraItems, ...answers]
    // index 0: Cherry, 1: Apple, 2: Banana
    const bucketButtons = await screen.findAllByTestId('click-button');
    expect(bucketButtons).toHaveLength(3);
    expect(bucketButtons[0]).toHaveTextContent('Cherry');
    expect(bucketButtons[1]).toHaveTextContent('Apple');
    expect(bucketButtons[2]).toHaveTextContent('Banana');
  });

  it('moves items from bucket to answer list and vice versa when clicked', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    disableClientValidation();

    // Find the 'Apple' button in the bucket and click it
    const appleButton = await screen.findByRole('button', { name: 'Apple' });
    await act(async () => {
      appleButton.click();
    });

    // After clicking, 'Apple' should be in the 'answer' row
    // We can verify by looking at the container structure or counting buttons
    const buttons = screen.getAllByTestId('click-button');
    expect(buttons).toHaveLength(3); 
    
    // Check if the first button in the answer area is 'Apple'
    // The code renders answerList first, then bucketList. 
    // Since Apple was moved to answerList, it should be the first button found.
    expect(buttons[0]).toHaveTextContent('Apple');

    // Click 'Apple' again (now in the answer list) to move it back to bucket
    await act(async () => {
      buttons[0].click();
    });

    // Now 'Apple' should be back in the bucket (last item based on setBucketList logic)
    const updatedButtons = screen.getAllByTestId('click-button');
    expect(updatedButtons[2]).toHaveTextContent('Apple');
  });

  it('calls moveNext when checkAnswer is called with correct answers', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    disableClientValidation();

    // Correct answers are ['Apple', 'Banana']
    const appleBtn = await screen.findByRole('button', { name: 'Apple' });
    const bananaBtn = await screen.findByRole('button', { name: 'Banana' });

    await act(async () => {
      appleBtn.click();
    });
    await act(async () => {
      bananaBtn.click();
    });

    // Execute checkAnswer from ref
    let result: boolean = false;
    await act(async () => {
      if (ref.current) {
        result = ref.current.checkAnswer();
      }
    });

    expect(result).toBe(true);
    expect(mockSetError).not.toHaveBeenCalled();
    expect(mockMoveNext).toHaveBeenCalled();
    
  });

  it('calls setError when checkAnswer is called with incorrect answers', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        ref={ref}
      />
    );

    disableClientValidation();

    // Click only 'Cherry' (Incorrect)
    const cherryBtn = await screen.findByRole('button', { name: 'Cherry' });
    await act(async () => {
      cherryBtn.click();
    });

    let result: boolean = true;
    await act(async () => {
      if (ref.current) {
        result = ref.current.checkAnswer();
      }
    });

    expect(result).toBe(false);
    expect(mockMoveNext).not.toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith('You have got an error. Try again!');
  });

  it('displays the second part of data when displayAnswer is true', async () => {
    const ref = React.createRef<ExerciseHandle>();
    render(
      <BucketListExercise
        exerciseInfo={exerciseInfoMock}
        setError={mockSetError}
        moveNext={mockMoveNext}
        displayAnswer={true}
        ref={ref}
      />
    );

    disableClientValidation();

    const secondaryText = await screen.findByText('Correct Answer Display');
    expect(secondaryText).toBeInTheDocument();
  });
});