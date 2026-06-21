import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Exercise } from './Exercise';
import { MemoryRouter, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { createRef } from 'react';
import { type ExerciseData, type ExtendedExerciseInfo } from '../../../types/exercise/Exercise';
import type { ExerciseHandle } from '../../../types/ui/ComponentHandles';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import userEvent from '@testing-library/user-event'; // 1. Import userEvent
import { AUTHOR_ACCESS } from '@ayalaslanguage/types/auth';
import { EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';

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

// Mock Puter and Utils
vi.mock('@heyputer/puter.js', () => ({
    puter: {
        ai: {
            txt2speech: vi.fn(),
        },
        auth: {
            isSignedIn: vi.fn(() => false),
            signIn: vi.fn()
        }
    },
}));

vi.mock('../../../utils/utils', () => ({
    initializePuter: vi.fn(() => false),
    isSecure: vi.fn(() => true),
    isTouchDevice: vi.fn(() => false),
    getRandomizedSequence: vi.fn((len) => Array.from({ length: len }, (_, i) => i)),
}));

describe('Exercise Component', () => {

    const dataObj: ExerciseData = { First: 'Hello', Second: 'Bonjour', Alternatives: [] };
    const info: ExtendedExerciseInfo = {
            exerciseId: 101,
            exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
            exerciseObject: dataObj,
            data: JSON.stringify(dataObj),
            sentenceElements: ['Hello'],
            answers: ['Bonjour'],
            access: AUTHOR_ACCESS.CAN_EDIT
        };

    const mockProps = {
        exerciseInfo: info,
        moveNext: vi.fn(),
        childLoaded: vi.fn(),
        saveProgress: vi.fn(),
        restartLesson: vi.fn(),
        learningPathId: 1,
        changeMistakesSetting: vi.fn(),
        practiseMistakesInThisPath: false,
        addMistake: vi.fn().mockResolvedValue(undefined),
        ref: { current: null },
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

    it('toggles answer display and triggers axios put when adding alternative answer', async () => {
        const user = userEvent.setup(); // 2. Setup user
        const ref = createRef<ExerciseHandle>();

        render(
            <MemoryRouter>
                <Exercise {...mockProps} ref={ref} />
            </MemoryRouter>
        );

        disableClientValidation();

        const input = await screen.findByRole('textbox');
        await user.type(input, 'salut'); // 3. Use await user.type

        const checkBtn = await screen.findByTestId('check-my-answers');
        await act(async () => {
            await user.click(checkBtn);
        });
        

        const revealBtn = await screen.findByTestId('reveal-answer');
        await user.click(revealBtn);

        let addAltBtn: HTMLElement | undefined;
        await waitFor(async () => {
            addAltBtn = await screen.findByTestId('add-alternative-answer');
        });

        mockedAxios.put.mockResolvedValue({ data: {} });

        // 4. Click the button
        expect(addAltBtn).not.toBe(undefined);

        await user.click(addAltBtn as HTMLElement);

        // 5. CRITICAL: Wait for the mock to have been called.
        // This ensures the async logic inside the component has executed.
        await waitFor(() => {
            expect(mockedAxios.put).toHaveBeenCalledWith(
                expect.stringContaining('/api/creator/exercise/101'),
                expect.objectContaining({
                    Data: expect.stringContaining('"salut"')
                })
            );
        });

        // 6. Optional: If clicking "add" makes the button disappear or 
        // changes the text, wait for that specific UI change too.
        // await waitForElementToBeRemoved(() => screen.queryByTestId('add-alternative-answer'));
    });

    it('wraps imperative handle calls in act()', async () => {
        const ref = createRef<ExerciseHandle>();
        render(
            <MemoryRouter>
                <Exercise {...mockProps} ref={ref} />
            </MemoryRouter>
        );

        disableClientValidation();

        act(() => {
            ref.current?.setFocus();
        });

        act(() => {
            const answer = ref.current?.getCurrentAnswer();
            expect(typeof answer).toBe('string');
        });

        act(() => {
            const result = ref.current?.checkAnswer();
            expect(typeof result).toBe('boolean');
        });
    });

    it('handles save and restart buttons correctly', async () => {
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

    it('handles mistake setting toggles correctly', async () => {
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