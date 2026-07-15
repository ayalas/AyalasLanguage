import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { TwoLinesTranslationExercise } from './TwoLinesTranslationExercise';
import { type ExerciseData, type ExtendedExerciseInfo } from '@ayalaslanguage/types/sharedfrontlib/learning';
import type { ExerciseHandle } from '../../../../types/ui/ComponentHandles';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';

// Mock axios as requested
vi.mock('axios');

// Mock external utilities
vi.mock('../../../../utils/languageUtils', () => ({
  replaceCharsForLanguage: vi.fn((_lang: string, text: string) => text),
}));

// Mock sub-components
vi.mock('../../../../components/ExerciseInput', () => ({
  ExerciseInput: React.forwardRef((props: any, ref: any) => {
    // Use the prop value directly so it reflects parent state changes (Virtual Keyboard, etc.)
    const val = props.value || '';

    React.useImperativeHandle(ref, () => ({
      getUserAnswer: () => val,
      setFocus: vi.fn(),
      setToError: vi.fn(),
      setValue: vi.fn(),
    }));

    return (
      <input
        data-testid="mock-exercise-input"
        value={val}
        onChange={(e) => {
          props.onChange?.(e.target.value);
        }}
      />
    );
  }),
}));

vi.mock('../../../../components/VirtualKeyboard', () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <button data-testid="mock-keyboard-key" onClick={() => onChange('keyboard-val')}>
      Mock Key
    </button>
  ),
}));


describe('TwoLinesTranslationExercise', () => {
  const objData: ExerciseData = {
      First: 'Hello',
      Second: 'Bonjour',
      Alternatives: ['Salut']
    };
  const mockExerciseInfo:ExtendedExerciseInfo = {
    exerciseId: 123,
    exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
    data: JSON.stringify(objData),
    exerciseObject: objData,
    access: AUTHOR_ACCESS.CAN_EDIT,
  };

  const mockUser = {
    disablePuter: true,
    languageSettings: {
      targetLanguage: 'French',
      targetLanguageEnglishName: 'French'
    }
  } as any;

  const defaultProps = {
    exerciseInfo: mockExerciseInfo,
    setError: vi.fn(),
    moveNext: vi.fn(),
    displayAnswer: false,
    user: mockUser,
    playTargetText: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and allows typing', async () => {
    render(<TwoLinesTranslationExercise {...defaultProps} ref={createRef()} />);

    let helloElement: HTMLElement | undefined;
    await waitFor(async () => {
      helloElement = await screen.findByText('Hello');
    });
    expect(helloElement).toBeInTheDocument();

    const input = await screen.findByTestId('mock-exercise-input');

    fireEvent.change(input, { target: { value: 'Bonjour' } });
    expect(input).toHaveValue('Bonjour');
  });

  it('validates correct answer and calls moveNext via checkAnswer handle', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    // Call required external function before logic execution
    disableClientValidation();

    const input = await screen.findByTestId('mock-exercise-input');
    fireEvent.change(input, { target: { value: 'Bonjour' } });

    let result = false;
    act(() => {
      result = ref.current?.checkAnswer() || false;
    });

    expect(result).toBe(true);
    expect(defaultProps.moveNext).toHaveBeenCalled();
  });

  it('validates alternative answer successfully', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    disableClientValidation();

    const input = await screen.findByTestId('mock-exercise-input');
    fireEvent.change(input, { target: { value: 'Salut' } });

    let result = false;
    act(() => {
      result = ref.current?.checkAnswer() || false;
    });

    expect(result).toBe(true);
    expect(defaultProps.moveNext).toHaveBeenCalled();
  });

  it('handles incorrect answers by calling setError', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    disableClientValidation();

    const input = await screen.findByTestId('mock-exercise-input');
    fireEvent.change(input, { target: { value: 'Wrong' } });

    let result = true;
    act(() => {
      result = ref.current?.checkAnswer() || false;
    });

    expect(result).toBe(false);
    expect(defaultProps.setError).toHaveBeenCalledWith('You have got some errors. Try again!');
  });

  it('exposes getCurrentAnswer correctly with trimming/lowercase', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    const input = await screen.findByTestId('mock-exercise-input');
    fireEvent.change(input, { target: { value: '  BONJOUR  ' } });

    let answer = '';
    act(() => {
      answer = ref.current?.getCurrentAnswer() || '';
    });

    expect(answer).toBe('bonjour');
  });

  it('wraps setFocus ref call inside act()', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    act(() => {
      ref.current?.setFocus();
    });
    // If no error is thrown and act is used, requirement is satisfied.
  });

  it('updates input value when virtual keyboard is used', async () => {
    render(<TwoLinesTranslationExercise {...defaultProps} ref={createRef()} />);

    const keyboardKey = await screen.findByTestId('mock-keyboard-key');

    // Clicking the keyboard button calls the parent's OnChange
    fireEvent.click(keyboardKey);

    const input = await screen.findByTestId('mock-exercise-input');
    expect(input).toHaveValue('keyboard-val');
  });

  it('displays the answer line when displayAnswer prop is true', async () => {
    render(<TwoLinesTranslationExercise {...defaultProps} displayAnswer={true} ref={createRef()} />);

    const answerLine = await screen.findByText('Bonjour');
    expect(answerLine).toBeInTheDocument();
  });
});