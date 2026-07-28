import { IChatMessage } from './AIInstructionsLogic';

// AI Backend wrapper Chat DTOs
export interface AIChatRequestDto {
    messages: IChatMessage[];
}

// AI Backend wrapper TTS DTO
export interface AITtsRequestDto {
    text: string;
    voice: string;
    language?: string;
    engine?: string;
}