import type { ExerciseType } from '../../exercise';
import { type IChatMessage } from './AIInstructionsLogic';

// AI Backend wrapper Chat DTOs
export interface AIChatRequestDto {
    exerciseType: ExerciseType;
    numOfExercises: number;
    matches: number;
    extraOptions: number;
    messages: IChatMessage[];
}

// AI Backend wrapper TTS DTO
export interface AITtsRequestDto {
    text: string;
    voice: string;
    language?: string;
    engine?: string;
}