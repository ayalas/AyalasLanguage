import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Exercise } from './Exercise';
import { MemoryRouter, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import React, { createRef } from 'react';
import { EXERCISE_TYPES } from '../../../constants/learning';
import type { ExerciseHandle } from '../../../types/ui/ComponentHandles';
import disableClientValidation from '../../../utils/test-utils/disableClientValidation';

// Mock axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock react-router-dom's context
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: vi.fn(),
    };
});

// Mock Puter and Utils to prevent environment errors in jsdom
vi.mock('@heyputer/puter.js', () => ({
    puter: {
        ai: {
            txt2speech: vi.fn(),
        },
    },
}));

vi.mock('../../../utils/utils', () => ({
    initializePuter: vi.fn(),
    isSecure: vi.fn(() => true),
    getRandomizedSequence: vi.fn((len) => Array.from({ length: len }, (_, i) => i)),
}));

describe('Exercise Component', () => {
    const mockProps = {
        exerciseInfo: {
            exerciseId: 101,
            exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
            data: JSON.stringify({ First: 'Hello', Second: 'Bonjour', Alternatives: [] }),
            sentenceElements: ['Part 1'],
            answers: ['Answer 1'],
        },
        moveNext: vi.fn(),
        childLoaded: vi.fn(),
        saveProgress: vi.fn(),
        restartLesson: vi.fn(),
        learningPathId: 1,
        changeMistakesSetting: vi.fn(),
        practiseMistakesInThisPath: false,
        addMistake: vi.fn().mockResolvedValue(undefined),
    };

    const mockUser = {
        languageSettings: {
            targetLanguageCode: 'fr',
            knownLanguage: 'English',
            targetLanguage: 'French',
            targetLanguageEnglishName: 'French',
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useOutletContext as any).mockReturnValue({ user: mockUser });
    });

    it('renders and calls childLoaded', async () => {
        render(
            <MemoryRouter>
                <Exercise {...mockProps} />
            </MemoryRouter>
        );

        expect(mockProps.childLoaded).toHaveBeenCalledWith(101);
    });

    it('wraps imperative handle calls in act()', async () => {
        const ref = createRef<ExerciseHandle>();
        render(
            <MemoryRouter>
                <Exercise {...mockProps} ref={ref} />
            </MemoryRouter>
        );

        disableClientValidation();

        // Testing imperative handles as requested
        act(() => {
            ref.current?.setFocus();
        });

        act(() => {
            const result = ref.current?.checkAnswer();
            expect(typeof result).toBe('boolean');
        });
    });

    it('toggles answer display and triggers axios put when adding alternative answer', async () => {
        render(
            <MemoryRouter>
                <Exercise {...mockProps} />
            </MemoryRouter>
        );

        disableClientValidation();

        // 1. Simulate typing an answer into the input field
        // TwoLinesTranslationExercise renders an ExerciseInput (likely a textbox)
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Salut' } });

        // 2. Click check-answer to trigger an error state 
        // (The "add-alternative-answer" button only shows if error != "")
        const checkBtn = await screen.findByTestId('check-my-answers');
        fireEvent.click(checkBtn);

        // 3. Reveal the answer (required for the button to show)
        const revealBtn = await screen.findByTestId('reveal-answer');
        fireEvent.click(revealBtn);

        // 4. Now the button should be available
        const addAltBtn = await screen.findByTestId('add-alternative-answer');
        expect(addAltBtn).toBeInTheDocument();

        // Setup axios mock response
        mockedAxios.put.mockResolvedValue({ data: {} });

        // 5. Click Add Alternative
        await fireEvent.click(addAltBtn);

        // 6. Verify axios call
        expect(mockedAxios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/creator/exercise/101'),
            expect.objectContaining({
                Data: expect.stringContaining('Salut')
            })
        );
    });

    it('handles save progress and restart lesson actions', async () => {
        render(
            <MemoryRouter>
                <Exercise {...mockProps} />
            </MemoryRouter>
        );

        disableClientValidation();

        const saveBtn = await screen.findByTestId('save-progress');
        fireEvent.click(saveBtn);
        expect(mockProps.saveProgress).toHaveBeenCalled();

        const restartBtn = await screen.findByTestId('restart-lesson');
        fireEvent.click(restartBtn);
        expect(mockProps.restartLesson).toHaveBeenCalled();
    });

    it('handles mistake setting toggles', async () => {
        const { rerender } = render(
            <MemoryRouter>
                <Exercise {...mockProps} practiseMistakesInThisPath={false} />
            </MemoryRouter>
        );

        disableClientValidation();

        const readdBtn = await screen.findByTestId('readd-mistakes');
        fireEvent.click(readdBtn);
        expect(mockProps.changeMistakesSetting).toHaveBeenCalledWith(true);

        rerender(
            <MemoryRouter>
                <Exercise {...mockProps} practiseMistakesInThisPath={true} />
            </MemoryRouter>
        );

        const cancelBtn = await screen.findByTestId('cancel-readding');
        fireEvent.click(cancelBtn);
        expect(mockProps.changeMistakesSetting).toHaveBeenCalledWith(false);
    });
});