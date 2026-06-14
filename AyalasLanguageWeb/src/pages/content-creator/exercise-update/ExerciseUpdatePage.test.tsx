import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExerciseUpdatePage } from "./ExerciseUpdatePage"; // Adjust path
import axios from "axios";
import { MemoryRouter, useNavigate, useParams } from "react-router-dom";
import { EXERCISE_TYPES, type ExerciseData, type ExtendedExerciseInfo } from '../../../types/exercise/Exercise';
import disableClientValidation from '../../../utils/test-utils/disableClientValidation';
import { AUTHOR_ACCESS } from "../../../constants/learning";

// 1. Mock Axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// 2. Mock React Router Hooks
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(),
    };
});

// 3. Mock AlternativeLine using an async factory to avoid hoisting errors
vi.mock("./AlternativeLine", async () => {
    const React = await import("react");
    return {
        AlternativeLine: React.forwardRef((props: { alternative: string }, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                exists: () => true // This allows the onFormSubmit loop to succeed
            }));
            return <div data-testid={`alternative-${props.alternative}`}>{props.alternative}</div>;
        })
    };
});

// 4. Mock Lucide Icons (Optional, but keeps console clean)
vi.mock("lucide-react", () => ({
    ArrowBigLeft: () => <span>BackIcon</span>,
    LayersPlus: () => <span>SaveIcon</span>,
}));

// 5. Mock AuthHeader
vi.mock("../../../components/auth/AuthHeader", () => ({
    AuthHeader: () => <div data-testid="auth-header" />
}));

describe("ExerciseUpdatePage", () => {
    const mockNavigate = vi.fn();
    const mockExerciseId = "123";

    const objData:ExerciseData = {
            First: "Hello",
            Second: "World",
            Alternatives: ["Alt 1", "Alt 2"]
        };
    const mockExerciseData:ExtendedExerciseInfo = {
        exerciseId: 123,
        learningPathId: 456,
        exerciseTypeId: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        exerciseObject: objData,
        data: JSON.stringify(objData),
        access: AUTHOR_ACCESS.CAN_EDIT
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useParams as any).mockReturnValue({ exerciseId: mockExerciseId });
    });

    it("renders and loads data correctly", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockExerciseData });

        render(
            <MemoryRouter>
                <ExerciseUpdatePage />
            </MemoryRouter>
        );

        // Wait for data to load and fill inputs
        await waitFor(() => {
            expect(screen.getByTestId('first-line')).toHaveValue("Hello");
        });

        expect(screen.getByTestId('second-line')).toHaveValue("World");
        
        // Since exerciseTypeId is BUCKET type, extra options should exist
        expect(screen.getByTestId('extra-options')).toBeInTheDocument();
        
        // Check if alternatives are rendered (via our mock)
        expect(screen.getByTestId("alternative-Alt 1")).toBeInTheDocument();
    });

    it("submits the form with updated data", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockExerciseData });
        mockedAxios.put.mockResolvedValueOnce({ status: 200 });

        render(
            <MemoryRouter>
                <ExerciseUpdatePage />
            </MemoryRouter>
        );

        // IMPORTANT: Wait until initialRecord is loaded into state
        // We know it's loaded when 'Hello' appears in the first-line input
        const firstInput = await screen.findByTestId('first-line');
        await waitFor(() => expect(firstInput).toHaveValue("Hello"));
        
        // Change values
        fireEvent.change(firstInput, { target: { value: "Updated First" } });
        fireEvent.change(screen.getByTestId('second-line'), { target: { value: "Updated Second" } });

        // Call the requested function before submit
        disableClientValidation();

        // Submit form
        const saveButton = screen.getByTestId("save");
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockedAxios.put).toHaveBeenCalledWith(
                `/api/creator/exercise/${mockExerciseId}`,
                expect.objectContaining({
                    Data: expect.stringContaining('"First":"Updated First"')
                })
            );
        });

        // Verify navigation happened after success
        expect(mockNavigate).toHaveBeenCalledWith("/author/path/456");
    });

    it("navigates back when back button is clicked", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockExerciseData });

        render(
            <MemoryRouter>
                <ExerciseUpdatePage />
            </MemoryRouter>
        );

        // Wait for load so initialRecord is not null
        const firstInput = await screen.findByTestId('first-line');
        await waitFor(() => expect(firstInput).toHaveValue("Hello"));

        const backButton = screen.getByTestId("back");
        fireEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith("/author/path/456");
    });
});