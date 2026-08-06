import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'; // Import act
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExerciseInput } from './ExerciseInput'; // Adjust path as needed
import { useOutletContext } from 'react-router-dom';
import { replaceCharsForLanguage } from '@ayalaslanguage/types/sharedfrontlib/utils';
import type { ExerciseInputHandle } from './ExerciseInput';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';

// Mock axios
vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useOutletContext: vi.fn(),
}));

// Mock language utils
vi.mock('@ayalaslanguage/types/sharedfrontlib/utils', () => ({
    replaceCharsForLanguage: vi.fn((_lang, val) => val),
}));

describe('ExerciseInput Component', () => {
    const mockUser = {
        languageSettings: {
            targetLanguage: 'en',
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useOutletContext as any).mockReturnValue({ user: mockUser });
    });

    it('renders correctly with initial value and applies custom width', async () => {
        render(<ExerciseInput value="hello" charWidth={10} exerciseType={EXERCISE_TYPES.FILL_IN_THE_BLANKS} />);

        // Call the required function as requested
        disableClientValidation();

        const input = await screen.findByTestId('input-element');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('hello');
        expect(input).toHaveStyle({ width: '10ch' });
    });

    it('calls onChange and updates internal state when typing', async () => {
        const onChangeMock = vi.fn();
        render(<ExerciseInput onChange={onChangeMock} exerciseType={EXERCISE_TYPES.FILL_IN_THE_BLANKS} />);

        disableClientValidation();

        const input = await screen.findByTestId('input-element');
        fireEvent.change(input, { target: { value: 'testing' } });

        expect(input).toHaveValue('testing');
        expect(onChangeMock).toHaveBeenCalledWith('testing', undefined);
    });

    it('triggers checkAnswer when Enter key is pressed', async () => {
        const checkAnswerMock = vi.fn();
        render(<ExerciseInput checkAnswer={checkAnswerMock} exerciseType={EXERCISE_TYPES.FILL_IN_THE_BLANKS} />);

        disableClientValidation();

        const input = await screen.findByTestId('input-element');
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(checkAnswerMock).toHaveBeenCalledTimes(1);
    });

    it('exposes imperative handle methods correctly', async () => {
        const ref = React.createRef<ExerciseInputHandle>();
        render(<ExerciseInput ref={ref} exerciseType={EXERCISE_TYPES.FILL_IN_THE_BLANKS} />);

        disableClientValidation();

        const input = await screen.findByTestId('input-element');

        // Test setValue and focus
        // Wrap direct ref method calls that update state in act()
        await act(async() => {
            ref.current?.setValue('New Value');
        });
        await waitFor(() => {
            expect(input).toHaveValue('New Value');
         });

        // Test setToError (changes background color)
        // Wrap direct ref method calls that update state in act()
        await act(async() => {
            ref.current?.setToError();
        });
        await waitFor(() => {
            expect(input).toHaveStyle({ backgroundColor: 'rgb(228, 180, 180)' });
        });

        // Test getUserAnswer (does not update state, no act needed)
        (replaceCharsForLanguage as any).mockReturnValue('processed-value');
        const answer = ref.current?.getUserAnswer();

        expect(replaceCharsForLanguage).toHaveBeenCalledWith('en', 'New Value');
        expect(answer).toBe('processed-value');
    });

    it('clears error state when value is changed', async () => {
        const ref = React.createRef<ExerciseInputHandle>();
        render(<ExerciseInput ref={ref} exerciseType={EXERCISE_TYPES.FILL_IN_THE_BLANKS} />);

        disableClientValidation();

        const input = await screen.findByTestId('input-element');

        // Trigger error
        // Wrap direct ref method calls that update state in act()
        await act(async() => {
            ref.current?.setToError();
        });
        await waitFor(() => {
            expect(input).toHaveStyle({ backgroundColor: 'rgb(228, 180, 180)' });
        });

        // Typing should clear the error (fireEvent.change is typically wrapped in act internally)
        fireEvent.change(input, { target: { value: 'Fixed' } });
        await waitFor(() => {
            expect(input).toHaveStyle({ backgroundColor: 'var(--bg)' });
        });
    });

    it('triggers onChange when focused (handleFocus)', async () => {
        const onChangeMock = vi.fn();
        render(<ExerciseInput onChange={onChangeMock} value="initial" exerciseType={EXERCISE_TYPES.FILL_IN_THE_BLANKS} />);

        disableClientValidation();

        const input = await screen.findByTestId('input-element');
        fireEvent.focus(input);

        expect(onChangeMock).toHaveBeenCalledWith('initial', undefined);
    });
});