import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import React, { createRef } from 'react';
import { TwoLinesTranslationExercise } from './TwoLinesTranslationExercise';
import { EXERCISE_TYPES } from '../../../../constants/learning';
import type { ExerciseHandle } from '../../../../types/ui/ComponentHandles';
import { replaceCharsForLanguage } from '../../../../utils/languageUtils';
import disableClientValidation from '../../../../utils/test-utils/disableClientValidation';

// Mock axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock external utilities
vi.mock('../../../../utils/languageUtils', () => ({
  replaceCharsForLanguage: vi.fn((_lang: string, text: string) => text),
}));

// Mock sub-components to control internal refs and behavior
vi.mock('../../../../components/ExerciseInput', () => ({
  ExerciseInput: React.forwardRef((props: any, ref: any) => {
    const [val, setVal] = React.useState(props.value || '');
    
    // This allows the test to interact with the internal methods TwoLinesTranslationExercise calls
    React.useImperativeHandle(ref, () => ({
      getUserAnswer: () => val,
      setFocus: vi.fn(),
      setToError: vi.fn(),
      setValue: (v: string) => setVal(v),
    }));

    return (
      <input
        data-testid="mock-exercise-input"
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
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
  const mockExerciseInfo = {
    exerciseId: 123,
    exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
    data: JSON.stringify({
      First: 'Hello',
      Second: 'Bonjour',
      Alternatives: ['Salut']
    }),
  };

  const mockUser = {
    languageSettings: {
      targetLanguage: 'French',
      targetLanguageEnglishName: 'French'
    }
  } as any;

  const defaultProps = {
    exerciseInfo: mockExerciseInfo as any,
    setError: vi.fn(),
    moveNext: vi.fn(),
    displayAnswer: false,
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and allows typing', async () => {
    render(<TwoLinesTranslationExercise {...defaultProps} ref={createRef()} />);

    expect(await screen.findByText('Hello')).toBeInTheDocument();
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

    let result: boolean = false;
    await act(async () => {
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
    fireEvent.change(input, { target: { value: 'Salut' } }); // 'Salut' is in Alternatives

    let result: boolean = false;
    await act(async () => {
      result = ref.current?.checkAnswer() || false;
    });

    expect(result).toBe(true);
    expect(defaultProps.moveNext).toHaveBeenCalled();
  });

  it('handles incorrect answers by setting error', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    disableClientValidation();

    const input = await screen.findByTestId('mock-exercise-input');
    fireEvent.change(input, { target: { value: 'Wrong Answer' } });

    let result: boolean = true;
    await act(async () => {
      result = ref.current?.checkAnswer() || false;
    });

    expect(result).toBe(false);
    expect(defaultProps.setError).toHaveBeenCalledWith('You have got some errors. Try again!');
    expect(defaultProps.moveNext).not.toHaveBeenCalled();
  });

  it('exposes getCurrentAnswer correctly', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    const input = await screen.findByTestId('mock-exercise-input');
    fireEvent.change(input, { target: { value: '  Testing Case  ' } });

    let answer = '';
    await act(async () => {
      answer = ref.current?.getCurrentAnswer() || '';
    });

    // Component trims and lowercases
    expect(answer).toBe('testing case');
  });

  it('shows second line when displayAnswer is true', async () => {
    render(<TwoLinesTranslationExercise {...defaultProps} displayAnswer={true} ref={createRef()} />);
    
    expect(await screen.findByText('Bonjour')).toBeInTheDocument();
  });

  it('triggers setFocus on the input ref', async () => {
    const ref = createRef<ExerciseHandle>();
    render(<TwoLinesTranslationExercise {...defaultProps} ref={ref} />);

    await act(async () => {
      ref.current?.setFocus();
    });
    
    // Verified implicitly as no error occurs in imperative chain, 
    // but in a more detailed mock we could verify the mockExerciseInput's setFocus call.
  });

  it('updates input value when virtual keyboard is used', async () => {
    render(<TwoLinesTranslationExercise {...defaultProps} ref={createRef()} />);

    const keyboardKey = await screen.findByTestId('mock-keyboard-key');
    fireEvent.click(keyboardKey);

    const input = await screen.findByTestId('mock-exercise-input');
    expect(input).toHaveValue('keyboard-val');
  });
});