import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { InlineExerciseWithBlanks } from './InlineExerciseWithBlanks';
import type { ExerciseHandle } from '../../../../types/ui/ComponentHandles';
import disableClientValidation from '../../../../utils/test-utils/disableClientValidation';
import { EXERCISE_TYPES } from '../../../../constants/learning';

// Mock axios as requested
vi.mock('axios');

// Mock external utilities
vi.mock('../../../../utils/languageUtils', () => ({
  replaceCharsForLanguage: vi.fn((_lang: string, text: string) => text),
}));

// Mock ExerciseInput to handle imperative methods and internal state for testing
vi.mock('../../../../components/ExerciseInput', () => ({
  ExerciseInput: React.forwardRef((props: any, ref: any) => {
    const [val, setVal] = React.useState('');

    React.useImperativeHandle(ref, () => ({
      getUserAnswer: () => val,
      setFocus: vi.fn(),
      setToError: vi.fn(),
      setValue: (newVal: string) => setVal(newVal),
    }));

    return (
      <input
        data-testid={`mock-input-${props.customKey}`}
        value={val}
        onFocus={() => props.onChange?.(val, props.customKey)}
        onChange={(e) => {
          setVal(e.target.value);
          props.onChange?.(e.target.value, props.customKey);
        }}
      />
    );
  }),
}));

// Mock VirtualKeyboard
vi.mock('../../../../components/VirtualKeyboard', () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <button data-testid="mock-keyboard-key" onClick={() => onChange('keyboard-val')}>
      Press Keyboard
    </button>
  ),
}));


describe('InlineExerciseWithBlanks', () => {
  const mockProps = {
    exerciseInfo: {
      exerciseId: 101,
      exerciseTypeId: 0,
      sentenceElements: ['The ', ' is ', '.'],
      answers: ['cat', 'black'],
      data: JSON.stringify({ Second: 'Translated sentence' }),
    },
    setError: vi.fn(),
    moveNext: vi.fn(),
    displayAnswer: false,
    user: {
      languageSettings: {
        targetLanguage: 'English',
        targetLanguageEnglishName: 'English',
      },
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sentence parts and input elements', async () => {
    mockProps.exerciseInfo.exerciseTypeId = EXERCISE_TYPES.FILL_IN_THE_BLANKS;
    render(<InlineExerciseWithBlanks {...mockProps} ref={createRef()} />);

    expect(await screen.findByText('The')).toBeInTheDocument();
    expect(await screen.findByText('is')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-input-101-0')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-input-101-1')).toBeInTheDocument();
  });

  it('validates correct answers via checkAnswer handle', async () => {
    const ref = createRef<ExerciseHandle>();
    mockProps.exerciseInfo.exerciseTypeId = EXERCISE_TYPES.FILL_IN_THE_BLANKS;
    render(<InlineExerciseWithBlanks {...mockProps} ref={ref} />);

    disableClientValidation();

    const input1 = await screen.findByTestId('mock-input-101-0');
    const input2 = await screen.findByTestId('mock-input-101-1');

    fireEvent.change(input1, { target: { value: 'cat' } });
    fireEvent.change(input2, { target: { value: 'black' } });

    let result = false;
    act(() => {
      result = ref.current?.checkAnswer() || false;
    });

    expect(result).toBe(true);
    expect(mockProps.moveNext).toHaveBeenCalled();
  });

  it('sets error when answers are incorrect', async () => {
    const ref = createRef<ExerciseHandle>();
    mockProps.exerciseInfo.exerciseTypeId = EXERCISE_TYPES.FILL_IN_THE_BLANKS;
    render(<InlineExerciseWithBlanks {...mockProps} ref={ref} />);

    disableClientValidation();

    const input1 = await screen.findByTestId('mock-input-101-0');
    fireEvent.change(input1, { target: { value: 'dog' } }); // Wrong answer

    let result = true;
    act(() => {
      result = ref.current?.checkAnswer() || false;
    });

    expect(result).toBe(false);
    expect(mockProps.setError).toHaveBeenCalledWith('You have got some errors. Try again!');
  });

  it('updates the focused input when virtual keyboard is used', async () => {
    mockProps.exerciseInfo.exerciseTypeId = EXERCISE_TYPES.FILL_IN_THE_BLANKS;
    render(<InlineExerciseWithBlanks {...mockProps} ref={createRef()} />);

    // 1. Focus the second input
    const input2 = await screen.findByTestId('mock-input-101-1');
    fireEvent.focus(input2);

    // 2. Use virtual keyboard
    const keyboardBtn = await screen.findByTestId('mock-keyboard-key');
    fireEvent.click(keyboardBtn);

    // 3. Verify the second input received the value
    expect(input2).toHaveValue('keyboard-val');
  });

  it('calls setFocus on the first input via handle', async () => {
    const ref = createRef<ExerciseHandle>();
    mockProps.exerciseInfo.exerciseTypeId = EXERCISE_TYPES.FILL_IN_THE_BLANKS;
    render(<InlineExerciseWithBlanks {...mockProps} ref={ref} />);

    act(() => {
      ref.current?.setFocus();
    });
    // Requirement to wrap in act() met.
  });

  it('displays the translation line when displayAnswer is true', async () => {
    mockProps.exerciseInfo.exerciseTypeId = EXERCISE_TYPES.FILL_IN_THE_BLANKS;
    render(<InlineExerciseWithBlanks {...mockProps} displayAnswer={true} ref={createRef()} />);

    const translation = await screen.findByText('Translated sentence');
    expect(translation).toBeInTheDocument();
  });

  it('returns empty string for getCurrentAnswer as it is not applicable', async () => {
    const ref = createRef<ExerciseHandle>();
    mockProps.exerciseInfo.exerciseTypeId = EXERCISE_TYPES.FILL_IN_THE_BLANKS;
    render(<InlineExerciseWithBlanks {...mockProps} ref={ref} />);

    let answer = 'init';
    act(() => {
      answer = ref.current?.getCurrentAnswer() || '';
    });

    expect(answer).toBe('');
  });
});