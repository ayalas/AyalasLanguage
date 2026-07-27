// Puter AI Backend wrapper Chat DTOs
import { IChatMessage } from "@ayalaslanguage/types/sharedfrontlib/logic";

export interface PuterChatRequestDto {
    messages: IChatMessage[];
}

// Puter AI Backend wrapper TTS DTO
export interface PuterTtsRequestDto {
    text: string;
    voice: string;
    language?: string;
    engine?: string;
}