import { EXERCISE_TYPES, type ExerciseType } from "../../exercise";
import { PLACEHOLDERS } from "../learning/learning";

export interface ExerciseGeneration {
    instruction: string,
    description: string,
    first_data_instructions: string,
    second_data_instructions: string,
    extra_options_instructions?: string,
    ai_instruction: string,
    ai_manual_format: string,
    ai_json_format: string
}

export type ExcerciseTypeLogic = {
    Type: ExerciseType | 0,
    Name: string,
    SortByEaseRank: number;
    SupportsAlternativeAnswers: boolean;
    ShowsCheckAnswers: boolean;
    CanRevealAnswers: boolean;
    ShowsTranslationOnRevealedAnswer: boolean;
    IsMatchingType: boolean;
    FocusOnLoad: boolean;
    CanPlayQuestion: boolean;
    AutoPlayQuestion: boolean;
    TargetIsSpoken: boolean;
    ShouldPlayAnswer: boolean;
    UsesVirtualKeyboard: boolean;
    HasSingleBucketAnswer: boolean;
    HasMultiBucketAnswers: boolean;
    UsesInlineExerciseWithBlanks: boolean;
    HasExtraOptions: boolean;
    ExtraOptionsSeparator: string;
    IsWritingExercise: boolean;
    GenerationInfo?: ExerciseGeneration;
}

const BASE_LOGIC: Omit<ExcerciseTypeLogic, 'GenerationInfo'> = {
    Type: 0,
    Name: 'Empty',
    SortByEaseRank: 0,
    SupportsAlternativeAnswers: false,
    ShowsCheckAnswers: false,
    CanRevealAnswers: false,
    ShowsTranslationOnRevealedAnswer: false,
    IsMatchingType: false,
    FocusOnLoad: false,
    CanPlayQuestion: false,
    AutoPlayQuestion: false,
    TargetIsSpoken: false,
    ShouldPlayAnswer: false,
    UsesVirtualKeyboard: false,
    HasSingleBucketAnswer: false,
    HasMultiBucketAnswers: false,
    UsesInlineExerciseWithBlanks: false,
    HasExtraOptions: false,
    ExtraOptionsSeparator: '',
    IsWritingExercise: false,
};

function createLogic(
    genInfo: ExerciseGeneration,
    overrides: Partial<ExcerciseTypeLogic> = {}
): ExcerciseTypeLogic {
    return {
        ...BASE_LOGIC,
        ...overrides,
        GenerationInfo: genInfo
    };
}

export const EXERCISE_TYPE_LOGIC: Record<ExerciseType | 0, ExcerciseTypeLogic> = {
    [0]: BASE_LOGIC,
    [EXERCISE_TYPES.FROM_KNOWN_TO_TARGET]: createLogic({
        instruction: `Translate to ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}`,
        description: "Generate sentences in the language you know to translate to the language you are learning.",
        first_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and its translation in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences.`,
        ai_manual_format: `Return the result as two separate lists - one of sentences in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and the other of their translations in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. In each list, separate each sentence with semi-colon.`,
        ai_json_format: `{First: string, Second: string} where First would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}.`
    }, {
        Type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
        Name: "Translate",
        SortByEaseRank: 100, // Override only what is different
        SupportsAlternativeAnswers: true,
        ShowsCheckAnswers: true,
        CanRevealAnswers: true,
        FocusOnLoad: true,
        ShouldPlayAnswer: true,
        UsesVirtualKeyboard: true,
        IsWritingExercise: true
    }),

    [EXERCISE_TYPES.FROM_TARGET_TO_KNOWN]: createLogic({
        instruction: `Translate to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}`,
        description: "Generate sentences in the language you are learning to translate to the language you know.",
        first_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and its translation in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences.`,
        ai_manual_format: `Return the result as two separate lists - one of sentences in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and the other of their translations in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}. In each list, separate each sentence with semi-colon.`,
        ai_json_format: `{First: string, Second: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and Second would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}.`
    }, {
        Type: EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
        Name: "Translate back",
        SortByEaseRank: 90,
        SupportsAlternativeAnswers: true,
        ShowsCheckAnswers: true,
        CanRevealAnswers: true,
        FocusOnLoad: true,
        CanPlayQuestion: true,
        AutoPlayQuestion: true,
        IsWritingExercise: true
    }),

    [EXERCISE_TYPES.FILL_IN_THE_BLANKS]: createLogic({
        instruction: "Fill in the blanks",
        description: "Generate sentences to fill in words in, such as the right prepositions. Use ____ for blanks.",
        first_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;), with blanks for words to fill",
        second_data_instructions: "The same sentences with the blanks filled, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence where there would be a need to fill in the right preposition(s) - use ___ for blanks, and the full correct sentence. Do not include optional vowel indications, if relevant to ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations to fill, just the sentences with blanks and the full sentences with the blanks replaced by the correct answers filled. Make sure that the sentence with the blanks muches perfectly the full sentence, except that instead of the blanks the full sentence includes the correct preposition. Do not add letters to the sentence with blanks that do not appear in the full sentence, even if it's gramatically incomplete.`,
        ai_manual_format: "Prepare a list of sentences with ___ for blanks, and the a second list with the full sentence. In each list, separate each sentence with semi-colon.",
        ai_json_format: `{First: string, Second: string, Translation: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} with the blanks, and Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} with the blanks replaced by the correct answers, and Translation would be the sentence translation to in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}.`
    }, {
        Type: EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        Name: "Fill in words",
        SortByEaseRank: 35,
        ShowsCheckAnswers: true,
        CanRevealAnswers: true,
        ShowsTranslationOnRevealedAnswer: true,
        FocusOnLoad: true,
        ShouldPlayAnswer: true,
        UsesVirtualKeyboard: true,
        UsesInlineExerciseWithBlanks: true
    }),

    [EXERCISE_TYPES.MATCHING]: createLogic({
        instruction: "Match words between the two columns",
        description: "Match words between two buckets lists: one bucket list will includes words in the language you know and the other bucket list will include words in the language you are learning.",
        first_data_instructions: "Words in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Words in the language you are learning, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a set of ${PLACEHOLDERS.NUM_OF_MATCHES_PLACEHOLDER} words\\expressions in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, each word\\expression separated by comma, and a matching set of the translations in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations. Keep the order correct, so the first word in the set matches the first word in the translated set, and so on.`,
        ai_manual_format: "Return a list of sets for each language. In each list, separate each set with semi-colon.",
        ai_json_format: `{First: string, Second: string} where First would be the a set of comma-separated words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and Second would be the matching set of comma-separated translations of those words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}.`
    }, {
        Type: EXERCISE_TYPES.MATCHING,
        Name: "Match words",
        SortByEaseRank: 10,
        IsMatchingType: true
    }),

    [EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET]: createLogic({
        instruction: `Translate to ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} by selecting some of these words in the right order.`,
        description: "Generate sentences in the language you know to translate to the language you are learning from a bucket list.",
        first_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        extra_options_instructions: "Sets of words that are wrong choises in the translated sentence. Each word separated by space. Each set separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and a translation in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences, including not the period at the end. For each sentence, generate ${PLACEHOLDERS.NUM_OF_WRONG_OPTIONS_PLACEHOLDER} wrong extra words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}, separated only by whitespace, that do not appear in the corresponding translated sentence.`,
        ai_manual_format: `Return 3 lists: the first of the sentences in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, the second of the sentences in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and a third of the whitespace-separated list of words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence. Use semi-colon to separate each sentence or set of extra words.`,
        ai_json_format: `{First: string, Second: string, ExtraOptions: string} where First would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and ExtraOptions would be the whitespace-separated list of words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence.`
    }, {
        Type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        Name: "Translate with bucket list",
        SortByEaseRank: 25,
        SupportsAlternativeAnswers: true,
        ShowsCheckAnswers: true,
        CanRevealAnswers: true,
        ShouldPlayAnswer: true,
        HasExtraOptions: true,
        HasMultiBucketAnswers: true,
        ExtraOptionsSeparator: " "
    }),

    [EXERCISE_TYPES.COMMON_RESPONSES_BUCKET]: createLogic({
        instruction: 'Choose the common response to this sentence',
        description: "Generate sentences in the language you are learning that have common answers - choose the right one from a bucket list.",
        first_data_instructions: "Sentences in the language you are learning that have common answers, separated by semi-colon(;)",
        second_data_instructions: "The correct common responses in the language you are learning to those sentences, separated by semi-colon(;)",
        extra_options_instructions: "Sets of wrong responses to each sentence. Each response separated by comma(,). Each set that corresponds to the sentence to respond to - separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence and a common response to the sentence presented. Both the sentence and the responses are in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences and responses. For each exercise, generate ${PLACEHOLDERS.NUM_OF_WRONG_OPTIONS_PLACEHOLDER} wrong extra responses, separated by comma(,). Make sure these are not reasonable alternative responses, but rather incorrect ones.`,
        ai_manual_format: `Prepare a first list of the sentences. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Then prepare a third list of wrong responses for each sentence. Separate each wrong response by a comma and each such set of wrong responses per correct one - by a semi-colon.`,
        ai_json_format: `{First: string, Second: string, ExtraOptions: string - comma(,)-separated list of options, Translation: string} where First would be the sentence to respond to, Second would be the correct response and ExtraOptions would be the comma-separated list of wrong responses to the presented sentence in First, and Translation would be the full translation of the exchange, the values of First and Second, to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, with pancutations for ease of read.`
    }, {
        Type: EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        Name: "Common responses with bucket list",
        SortByEaseRank: 30,
        CanRevealAnswers: true,
        ShowsTranslationOnRevealedAnswer: true,
        ShouldPlayAnswer: true,
        CanPlayQuestion: true,
        HasExtraOptions: true,
        HasSingleBucketAnswer: true,
        ExtraOptionsSeparator: ","
    }),

    [EXERCISE_TYPES.COMMON_RESPONSES]: createLogic({
        instruction: 'Answer the common response to this sentence',
        description: "Generate sentences in the language you are learning that have common answers - write the right one.",
        first_data_instructions: "Sentences in the language you are learning that have common answers, separated by semi-colon(;)",
        second_data_instructions: "The correct common responses in the language you are learning to those sentences, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence and a common response to the sentence presented. Both the sentence and the responses are in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences and responses.`,
        ai_manual_format: `Prepare a first list of the sentences. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon.`,
        ai_json_format: `{First: string, Second: string, Translation: string } where First would be the sentence to respond to and Second would be the correct response, and Translation would be the full translation of the exchange, the values of First and Second, to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, with pancutations for ease of read.`
    }, {
        Type: EXERCISE_TYPES.COMMON_RESPONSES,
        Name: "Common responses",
        SortByEaseRank: 110,
        SupportsAlternativeAnswers: true,
        ShowsCheckAnswers: true,
        CanRevealAnswers: true,
        ShowsTranslationOnRevealedAnswer: true,
        FocusOnLoad: true,
        CanPlayQuestion: true,
        AutoPlayQuestion: true,
        ShouldPlayAnswer: true,
        UsesVirtualKeyboard: true,
        IsWritingExercise: true
    }),

    [EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET]: createLogic({
        instruction: `Translate to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} by selecting some of these words in the right order.`,
        description: "Generate sentences in the language you are learning to translate to the language you know from a bucket list.",
        first_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        extra_options_instructions: "Sets of words that are wrong choises in the translated sentence. Each word separated by space. Each set separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and a translation in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences, including not the period at the end. For each sentence, generate ${PLACEHOLDERS.NUM_OF_WRONG_OPTIONS_PLACEHOLDER} wrong extra words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, separated only by whitespace, that do not appear in the corresponding translated sentence.`,
        ai_manual_format: `Return 3 lists: the first of the sentences in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}, the second of the sentences in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and a third of the whitespace-separated list of words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence. Use semi-colon to separate each sentence or set of extra words.`,
        ai_json_format: `{First: string, Second: string, ExtraOptions: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}, Second would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and ExtraOptions would be the whitespace-separated list of words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence.`
    }, {
        Type: EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET,
        Name: "Translate back with bucket list",
        SortByEaseRank: 20,
        SupportsAlternativeAnswers: true,
        ShowsCheckAnswers: true,
        CanRevealAnswers: true,
        CanPlayQuestion: true,
        AutoPlayQuestion: true,
        HasExtraOptions: true,
        HasMultiBucketAnswers: true,
        ExtraOptionsSeparator: " "
    }),

    [EXERCISE_TYPES.MATCHING_TO_SPOKEN]: createLogic({
        instruction: "Match written word to spoken translated word between the two columns",
        description: "Match words between two buckets lists: one bucket list will includes words in the language you know and the other bucket list will include the spoken words in the language you are learning.",
        first_data_instructions: "Words in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Words in the language you are learning, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a set of ${PLACEHOLDERS.NUM_OF_MATCHES_PLACEHOLDER} words\\expressions in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, each word\\expression separated by comma, and a matching set of the translations in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations. Keep the order correct, so the first word in the set matches the first word in the translated set, and so on.`,
        ai_manual_format: "Return a list of sets for each language. In each list, separate each set with semi-colon.",
        ai_json_format: `{First: string, Second: string} where First would be the a set of comma-separated words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and Second would be the matching set of comma-separated translations of those words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}.`
    }, {
        Type: EXERCISE_TYPES.MATCHING_TO_SPOKEN,
        Name: "Match written to spoken words",
        SortByEaseRank: 15,
        IsMatchingType: true,
        TargetIsSpoken: true
    })

    // ... add all other types here
};

export const SORTED_EXERCISE_TYPES = Object.values(EXERCISE_TYPE_LOGIC)
// 1. Filter out the base/default entry (key 0)
.filter(logic => (logic.Type as number) !== 0)
// 2. Sort by Ease Rank (lower numbers first)
.sort((a, b) => a.SortByEaseRank - b.SortByEaseRank)
// 3. Map to the specific shape you need
.map(logic => ({
    Type: logic.Type,
    Name: logic.Name
}));

export const isRightToLeftInput = (type: ExerciseType | 0, targetIsRtl: boolean, knownIsRtl: boolean): boolean => {
    return (([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET
    ] as (ExerciseType | 0)[]).includes(type) && targetIsRtl) ||
        (([
            EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
            EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
        ] as (ExerciseType | 0)[]).includes(type) && knownIsRtl);
};