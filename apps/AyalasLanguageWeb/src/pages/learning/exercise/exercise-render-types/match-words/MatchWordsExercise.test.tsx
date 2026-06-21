import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MatchWordsExercise from './MatchWordsExercise';
import { getRandomizedSequence } from '../../../../../utils/utils';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { type ExerciseData, type ExtendedExerciseInfo } from '../../../../../types/exercise/Exercise';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';

// Mock axios as requested
vi.mock('axios');

// Mock randomized sequence to be predictable (returning original indices)
vi.mock('../../../../../utils/utils', () => ({
  getRandomizedSequence: vi.fn((len: number) => Array.from({ length: len }, (_, i) => i)),
}));

// Mock the child component to simulate the selection logic
vi.mock('./MatchWordItem', () => ({
  __esModule: true,
  default: ({ itemValue, matchingValue, setSelected }: any) => {
    const handleClick = () => {
      // Create a mock Selection object as expected by the parent
      const selection = {
        itemValue,
        matchingValue,
        setErrorState: vi.fn(),
        setIsSelected: vi.fn(),
        setToDone: vi.fn(),
      };
      setSelected(selection, selection.setToDone, selection.setErrorState);
    };
    return (
      <button data-testid={`match-item-${itemValue}`} onClick={handleClick}>
        {itemValue}
      </button>
    );
  },
}));


describe('MatchWordsExercise', () => {
  const mockProps = {
    exerciseInfo: {
      exerciseId: 501,
      exerciseTypeId: EXERCISE_TYPES.MATCHING,
      data: '{ first: \'dsfsd,sdfsd,sdf\', second:\'dsdfsd,sdffds,sdfsfd\' }',
      exerciseObject: { First: 'dsfsd,sdfsd,sdf', Second:'dsdfsd,sdffds,sdfsfd'} as ExerciseData,
      sentenceElements: ['Hello', 'Apple'],
      answers: ['Bonjour', 'Pomme'],
      access: AUTHOR_ACCESS.CAN_EDIT,
    } as ExtendedExerciseInfo,
    setError: vi.fn(),
    moveNext: vi.fn(),
    playTargetText: vi.fn(),
    addMistake: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all words from both columns', async () => {
    render(<MatchWordsExercise {...mockProps} />);

    expect(await screen.findByText('Hello')).toBeInTheDocument();
    expect(await screen.findByText('Apple')).toBeInTheDocument();
    expect(await screen.findByText('Bonjour')).toBeInTheDocument();
    expect(await screen.findByText('Pomme')).toBeInTheDocument();
  });

  it('calls moveNext when all pairs are matched correctly', async () => {
    render(<MatchWordsExercise {...mockProps} />);

    // Call required external function before interaction
    disableClientValidation();

    // Match 1: Hello -> Bonjour
    const helloBtn = await screen.findByTestId('match-item-Hello');
    const bonjourBtn = await screen.findByTestId('match-item-Bonjour');
    
    fireEvent.click(helloBtn);
    fireEvent.click(bonjourBtn);

    // Match 2: Apple -> Pomme
    const appleBtn = await screen.findByTestId('match-item-Apple');
    const pommeBtn = await screen.findByTestId('match-item-Pomme');

    fireEvent.click(appleBtn);
    fireEvent.click(pommeBtn);

    expect(mockProps.moveNext).toHaveBeenCalledTimes(1);
    expect(mockProps.setError).not.toHaveBeenCalledWith(expect.stringContaining('error'));
  });

  it('calls addMistake and setError when an incorrect match is made', async () => {
    render(<MatchWordsExercise {...mockProps} />);

    disableClientValidation();

    // Try to match Hello with Pomme (Incorrect)
    const helloBtn = await screen.findByTestId('match-item-Hello');
    const pommeBtn = await screen.findByTestId('match-item-Pomme');

    fireEvent.click(helloBtn);
    fireEvent.click(pommeBtn);

    expect(mockProps.addMistake).toHaveBeenCalledWith(501);
    expect(mockProps.setError).toHaveBeenCalledWith('You have got an error. Try again!');
    expect(mockProps.moveNext).not.toHaveBeenCalled();
  });

  it('allows changing selection in the same column before matching', async () => {
    render(<MatchWordsExercise {...mockProps} />);

    disableClientValidation();

    const helloBtn = await screen.findByTestId('match-item-Hello');
    const appleBtn = await screen.findByTestId('match-item-Apple');
    const bonjourBtn = await screen.findByTestId('match-item-Bonjour');

    // Click Hello, then decide to click Apple instead
    fireEvent.click(helloBtn);
    fireEvent.click(appleBtn);
    
    // Now match Apple with its correct counterpart
    fireEvent.click(bonjourBtn); // Apple's matchingValue is answers[1] ('Pomme'), but here we test the state doesn't crash

    // Since Apple's internal matchingValue (from exerciseInfo.sentenceElements[1]) is 'Pomme', 
    // and we clicked 'Bonjour' (whose itemValue is 'Bonjour'), it should error.
    expect(mockProps.addMistake).toHaveBeenCalled();
  });

  it('randomizes the second column using getRandomizedSequence on mount', async () => {
    render(<MatchWordsExercise {...mockProps} />);
    
    expect(getRandomizedSequence).toHaveBeenCalledWith(mockProps?.exerciseInfo?.sentenceElements?.length);
  });
});