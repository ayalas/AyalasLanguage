import { EXERCISE_TYPES, type ExerciseType } from "@ayalaslanguage/types/exercise";
import type { AppLanguageCode } from "../types/shared/User";

export const PLACEHOLDERS = {
    KNOWN_LANGUAGE_PLACEHOLDER: "kkknownnn",
    TARGET_LANGUAGE_PLACEHOLDER: "tttargettt",
    BLANKS: "___",
    SUBJECT_PLACEHOLDER: "sssubjectsss",
    NUM_OF_EXERCISES_PLACEHOLDER: 'nnnumofexercisesnnn'
} as const;

const TOP_LEVEL = 100;
export const DEFAULT_NUM_OF_EXERCISES = 10;

export const BUCKET_LIST_EXTRA_OPTIONS = 
{
    MIN_WORDS: 1,
    MAX_WORDS: 5
} as const;

export const LEANRING_STATUS = 
{
    NEW: 0,
    DONE: 1,
    IN_PROGRESS: 2
} as const;

export const EXERCISE_TYPE_INSTRUCTIONS: string[] = [];
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET] = `Translate to ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN] = `Translate to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FILL_IN_THE_BLANKS] = "Fill in the blanks";
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.MATCHING] = "Match words between the two columns";
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET] = `Translate to ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} by selecting some of these words in the right order.`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.COMMON_RESPONSES_BUCKET] = 'Choose the common response to this sentence';
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.COMMON_RESPONSES] = 'Answer the common response to this sentence';
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET] = `Translate to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} by selecting some of these words in the right order.`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.MATCHING_TO_SPOKEN] = "Match written word to spoken translated word between the two columns";

export const EXERCISE_TYPE_NAME_MAPPING: string[] = [];
EXERCISE_TYPE_NAME_MAPPING[0]= "Empty";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET]= "Translate";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN]= "Translate back";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FILL_IN_THE_BLANKS]= "Fill in words";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.MATCHING]= "Match words";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET]= "Translate with bucket list";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.COMMON_RESPONSES_BUCKET]= "Common responses with bucket list";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.COMMON_RESPONSES]= "Common responses";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET]= "Translate back with bucket list";
EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.MATCHING_TO_SPOKEN]= "Match written to spoken words";

export interface ExerciseGeneration
{
    type: ExerciseType,
    name: string,
    description: string,
    first_data_instructions: string,
    second_data_instructions: string,
    extra_options_instructions?: string,
    ai_instruction: string,
    ai_manual_format: string,
    ai_json_format: string
}
export const EXERCISE_GENERATIONS: ExerciseGeneration[] = 
[
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET, 
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET], 
        description:"Generate sentences in the language you know to translate to the language you are learning.",
        first_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and its translation in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences.`,
        ai_manual_format: `Return the result as two separate lists - one of sentences in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and the other of their translations in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. In each list, separate each sentence with semi-colon.`,
        ai_json_format: `{First: string, Second: string} where First would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}.`
    },
    {
        type: EXERCISE_TYPES.FROM_TARGET_TO_KNOWN, 
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN], 
        description:"Generate sentences in the language you are learning to translate to the language you know.",
        first_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and its translation in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences.`,
        ai_manual_format: `Return the result as two separate lists - one of sentences in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and the other of their translations in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}. In each list, separate each sentence with semi-colon.`,
        ai_json_format: `{First: string, Second: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and Second would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}.`
    },
    {
        type: EXERCISE_TYPES.FILL_IN_THE_BLANKS, 
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FILL_IN_THE_BLANKS], 
        description:"Generate sentences to fill in words in, such as the right prepositions. Use ____ for blanks.",
        first_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;), with blanks for words to fill",
        second_data_instructions: "The same sentences with the blanks filled, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence where there would be a need to fill in the right preposition(s) - use ___ for blanks, and the full correct sentence. Do not include optional vowel indications, if relevant to ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations to fill, just the sentences with blanks and the full sentences with the blanks replaced by the correct answers filled. Make sure that the sentence with the blanks muches perfectly the full sentence, except that instead of the blanks the full sentence includes the correct preposition. Do not add letters to the sentence with blanks that do not appear in the full sentence, even if it's gramatically incomplete.`,
        ai_manual_format: "Prepare a list of sentences with ___ for blanks, and the a second list with the full sentence. In each list, separate each sentence with semi-colon.",
        ai_json_format: `{First: string, Second: string, Translation: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} with the blanks, and Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} with the blanks replaced by the correct answers, and Translation would be the sentence translation to in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}.`
    },
    {
        type: EXERCISE_TYPES.MATCHING, 
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.MATCHING], 
        description:"Match words between two buckets lists: one bucket list will includes words in the language you know and the other bucket list will include words in the language you are learning.",
        first_data_instructions: "Words in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Words in the language you are learning, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a set of four or five words\\expressions in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, each word\\expression separated by comma, and a matching set of the translations in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations. Keep the order correct, so the first word in the set matches the first word in the translated set, and so on.`,
        ai_manual_format: "Return a list of sets for each language. In each list, separate each set with semi-colon.",
        ai_json_format: `{First: string, Second: string} where First would be the a set of comma-separated words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and Second would be the matching set of comma-separated translations of those words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}.`
    },
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET, 
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET], 
        description:"Generate sentences in the language you know to translate to the language you are learning from a bucket list.",
        first_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        extra_options_instructions: "Sets of words that are wrong choises in the translated sentence. Each word separated by space. Each set separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and a translation in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences, including not the period at the end. For each sentence, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} wrong extra words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}, separated only by whitespace, that do not appear in the corresponding translated sentence.`,
        ai_manual_format: `Return 3 lists: the first of the sentences in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, the second of the sentences in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and a third of the whitespace-separated list of words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence. Use semi-colon to separate each sentence or set of extra words.`,
        ai_json_format: `{First: string, Second: string, ExtraOptions: string} where First would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and ExtraOptions would be the whitespace-separated list of words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence.`
    },
    {
        type: EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.COMMON_RESPONSES_BUCKET],
        description:"Generate sentences in the language you are learning that have common answers - choose the right one from a bucket list.",
        first_data_instructions: "Sentences in the language you are learning that have common answers, separated by semi-colon(;)",
        second_data_instructions: "The correct common responses in the language you are learning to those sentences, separated by semi-colon(;)",
        extra_options_instructions: "Sets of wrong responses to each sentence. Each response separated by comma(,). Each set that corresponds to the sentence to respond to - separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence and a common response to the sentence presented. Both the sentence and the responses are in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences and responses. For each correct response, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} wrong extra responses, separated by comma(,). Make sure these are not reasonable alternative responses, but rather incorrect ones.`,
        ai_manual_format: `Prepare a first list of the sentences. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Then prepare a third list of wrong responses for each sentence. Separate each wrong response by a comma and each such set of wrong responses per correct one - by a semi-colon.`,
        ai_json_format: `{First: string, Second: string, ExtraOptions: string - comma(,)-separated list of options, Translation: string} where First would be the sentence to respond to, Second would be the correct response and ExtraOptions would be the comma-separated list of wrong responses to the presented sentence in First, and Translation would be the full translation of the exchange, the values of First and Second, to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, with pancutations for ease of read.`
    },
    {
        type: EXERCISE_TYPES.COMMON_RESPONSES,
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.COMMON_RESPONSES],
        description:"Generate sentences in the language you are learning that have common answers - write the right one.",
        first_data_instructions: "Sentences in the language you are learning that have common answers, separated by semi-colon(;)",
        second_data_instructions: "The correct common responses in the language you are learning to those sentences, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence and a common response to the sentence presented. Both the sentence and the responses are in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences and responses.`,
        ai_manual_format: `Prepare a first list of the sentences. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon.`,
        ai_json_format: `{First: string, Second: string, Translation: string } where First would be the sentence to respond to and Second would be the correct response, and Translation would be the full translation of the exchange, the values of First and Second, to ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, with pancutations for ease of read.`
    },
    {
        type: EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET, 
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET], 
        description:"Generate sentences in the language you are learning to translate to the language you know from a bucket list.",
        first_data_instructions: "Sentences in the language you are learning, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the language you know, separated by semi-colon(;)",
        extra_options_instructions: "Sets of words that are wrong choises in the translated sentence. Each word separated by space. Each set separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER} and a translation in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}. Do not include punctuations, just the sentences, including not the period at the end. For each sentence, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} wrong extra words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, separated only by whitespace, that do not appear in the corresponding translated sentence.`,
        ai_manual_format: `Return 3 lists: the first of the sentences in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}, the second of the sentences in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and a third of the whitespace-separated list of words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence. Use semi-colon to separate each sentence or set of extra words.`,
        ai_json_format: `{First: string, Second: string, ExtraOptions: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}, Second would be the sentence in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and ExtraOptions would be the whitespace-separated list of words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} that do not appear in the corresponding translated sentence.`
    },
    {
        type: EXERCISE_TYPES.MATCHING_TO_SPOKEN, 
        name: EXERCISE_TYPE_NAME_MAPPING[EXERCISE_TYPES.MATCHING_TO_SPOKEN], 
        description:"Match words between two buckets lists: one bucket list will includes words in the language you know and the other bucket list will include the spoken words in the language you are learning.",
        first_data_instructions: "Words in the language you know, separated by semi-colon(;)",
        second_data_instructions: "Words in the language you are learning, separated by semi-colon(;)",
        ai_instruction: `Each exercise consists of a set of four or five words\\expressions in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER}, each word\\expression separated by comma, and a matching set of the translations in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}. Do not include punctuations. Keep the order correct, so the first word in the set matches the first word in the translated set, and so on.`,
        ai_manual_format: "Return a list of sets for each language. In each list, separate each set with semi-colon.",
        ai_json_format: `{First: string, Second: string} where First would be the a set of comma-separated words in ${PLACEHOLDERS.KNOWN_LANGUAGE_PLACEHOLDER} and Second would be the matching set of comma-separated translations of those words in ${PLACEHOLDERS.TARGET_LANGUAGE_PLACEHOLDER}.`
    }
];



/**
 * Maps custom application language codes to AWS Polly / Putter.js language codes.
 * Returns `null` for languages currently unsupported by Amazon Polly.
 */
export const LANGUAGE_TO_POLLY_MAP: Record<
  AppLanguageCode,
  { language: string; engine: 'standard' | 'neural' | 'long-form' | 'generative'; voice: string } | null
> = {
  en: { language: 'en-US', engine: 'generative', voice: 'Ruth' },    // English (US) - Generative supported
  ar: { language: 'arb', engine: 'standard', voice: 'Zeina' },        // Arabic - ONLY Standard supported
  da: { language: 'da-DK', engine: 'standard', voice: 'Naja' },     // Danish - ONLY Standard supported
  es: { language: 'es-ES', engine: 'neural', voice: 'Lucia' },      // Spanish (Spain) - Neural supported
  fr: { language: 'fr-FR', engine: 'neural', voice: 'Lea' },        // French - Neural supported
  de: { language: 'de-DE', engine: 'neural', voice: 'Vicki' },      // German - Neural supported
  ja: { language: 'ja-JP', engine: 'standard', voice: 'Mizuki' },     // Japanese - ONLY Standard supported
  zh: { language: 'cmn-CN', engine: 'neural', voice: 'Zhiyu' },     // Mandarin Chinese - Neural supported
  hi: { language: 'hi-IN', engine: 'standard', voice: 'Aditi' },      // Hindi - ONLY Standard supported
  pt: { language: 'pt-PT', engine: 'neural', voice: 'Ines' },       // Portuguese (Portugal) - Neural supported
  ru: { language: 'ru-RU', engine: 'standard', voice: 'Tatyana' },  // Russian - ONLY Standard supported
  ko: { language: 'ko-KR', engine: 'neural', voice: 'Seoyeon' },    // Korean - Neural supported
  it: { language: 'it-IT', engine: 'neural', voice: 'Bianca' },     // Italian - Neural supported
  tr: { language: 'tr-TR', engine: 'standard', voice: 'Filiz' },      // Turkish - ONLY Standard supported
  nl: { language: 'nl-NL', engine: 'neural', voice: 'Laura' },      // Dutch - Neural supported
  sv: { language: 'sv-SE', engine: 'standard', voice: 'Astrid' },     // Swedish - ONLY Standard supported
  no: { language: 'nb-NO', engine: 'standard', voice: 'Liv' },        // Norwegian - ONLY Standard supported
  pl: { language: 'pl-PL', engine: 'standard', voice: 'Maja' },       // Polish - ONLY Standard supported
  fi: { language: 'fi-FI', engine: 'neural', voice: 'Suvi' },       // Finnish - Neural supported
  cs: { language: 'cs-CZ', engine: 'neural', voice: 'Jitka' },    // Czech - ONLY Standard supported
  ro: { language: 'ro-RO', engine: 'standard', voice: 'Carmen' },   // Romanian - ONLY Standard supported
  ca: { language: 'ca-ES', engine: 'neural', voice: 'Arlet' },      // Catalan - Neural supported
 
  // --- Languages currently unsupported by Amazon Polly ---
  te: null,
  mr: null,
  sk: null,
  he: null,
  th: null, 
  id: null, 
  hu: null,
  el: null, 
  ta: null,
  vi: null, 
  bn: null,
  ur: null,      // Urdu
  uk: null,      // Ukrainian
  ms: null,      // Malay
  fa: null,      // Persian
} as const;