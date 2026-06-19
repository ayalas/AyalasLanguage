import { EXERCISE_TYPES } from "@ayalaslanguage/types/exercise";
import type { AppLanguageCode } from "../types/shared/User";

export const PLACEHOLDERS = {
    KNOWN_LANGAUGE_PLACEHOLDER: "kkknownnn",
    TARGET_LANGAUGE_PLACEHOLDER: "tttargettt",
    BLANKS: "___",
    SUBJECT_PLACEHOLDER: "sssubjectsss",
    LEVEL_PLACEHOLDER: 'llllevelllll'
} as const;

const TOP_LEVEL = 100;

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
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET] = `Translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN] = `Translate to ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FILL_IN_THE_BLANKS] = "Fill in the blanks";
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.MATCHING] = "Match words between the two columns";
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET] = `Translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} by selecting some of these words in the right order.`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.COMMON_RESPONSES_BUCKET] = 'Choose the common response to this sentence';
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.COMMON_RESPONSES] = 'Answer the common response to this sentence';


export const EXERCISE_GENERATIONS = 
[
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET, 
        name: "Translate to target language", 
        description:"Generate sentences in the langauge you know to translate to the langauge you are learning.",
        first_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sentences in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that I would have to translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences.`,
        ai_instruction_auto: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER} (on a scale of 1 to ${TOP_LEVEL}). Prepare for me 10 translation exercises on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}. In each exercise I would have to translate from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Do not include punctuations, just the sentences. Return the result as a raw JSON array of objects in this format: {First: string, Second: string} where First would be the sentence in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} and Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}.`
    },
    {
        type: EXERCISE_TYPES.FROM_TARGET_TO_KNOWN, 
        name: "Translate to known language", 
        description:"Generate sentences in the langauge you are learning to translate to the langauge you know.",
        first_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sentences in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that I would have to translate to ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences.`,
        ai_instruction_auto: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER} (on a scale of 1 to ${TOP_LEVEL}). Prepare for me 10 translation exercises on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}. In each exercise I would have to translate from ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} to ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}. Do not include punctuations, just the sentences. Return the result as a raw JSON array of objects in this format: {First: string, Second: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} and Second would be the sentence in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}.`
    },
    {
        type: EXERCISE_TYPES.FILL_IN_THE_BLANKS, 
        name: "Fill in words", 
        description:"Generate sentences to fill in words in, such as the right prepositions. Use ____ for blanks.",
        first_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;), with blanks for words to fill",
        second_data_instructions: "The same sentences with the blanks filled, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 exercises, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, where I have to fill in the right preposition - use ___ for blanks. Then prepare a separate list with the full correct sentences. Do not include optional vowel indications, if relevant to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. In each list, separate each sentence with semi-colon. Do not include punctuations to fill, just the prepositions.`,
        ai_instruction_auto: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER} (on a scale of 1 to ${TOP_LEVEL}). Prepare for me 10 exercises, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, where I have to fill in the right preposition - use ___ for blanks. Do not include punctuations, just the sentences with blanks and the full sentences with the blanks replaced by the correct answers filled. Make sure that the sentence with the blanks muches perfectly the full sentence, except that instead of the blanks the full sentence includes the correct preposition. Do not add letters to the sentence with blanks that do not appear in the full sentence, even if it's gramatically incomplete. Also add a translation to the full sentence in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}. Return the result as a raw JSON array of objects in this format: {First: string, Second: string, Translation: string} where First would be the sentence in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} with the blanks, and Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} with the blanks replaced by the correct answers, and Translation would be the sentence translation to in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}`
    },
    {
        type: EXERCISE_TYPES.MATCHING, 
        name: "Match words", 
        description:"Match words between two buckets lists: one bucket list will includes words in the langauge you know and the other bucket list will include words in the langauge you are learning.",
        first_data_instructions: "Words in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Words in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sets of four or five words\\expressions in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, each word\\expression separated by comma. Then, prepare matching sets of the translations in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. In each list, separate each set with semi-colon. Do not include punctuations.`,
        ai_instruction_auto: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER} (on a scale of 1 to ${TOP_LEVEL}). Prepare for me 10 exercises on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}. In each exercise, preape a set of four or five words\\expressions in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, each word\\expression separated by comma, and a matching set of the translations in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Do not include punctuations. Return the result as a raw JSON array of objects in this format: {First: string, Second: string} where First would be the a set of comma-separated words in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} and Second would be the matching set of comma-separated translations of those words in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Keep the order correct, so the first word in First matches the first word in Second, and so on.`
    },
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET, 
        name: "Translate with bucket list", 
        description:"Generate sentences in the langauge you know to translate to the langauge you are learning from a bucket list.",
        first_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        extra_options_instructions: "Sets of words that are wrong choises in the translated sentence. Each word separated by space. Each set separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sentences in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that I would have to translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences. For each sentence, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} words in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} that do not appear in the corresponding sentence. separate each such set of words with a semi-colon, and present this as a third list of wrong extra options.`,
        ai_instruction_auto: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER} (on a scale of 1 to ${TOP_LEVEL}). Prepare for me 10 translation exercises on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}. In each exercise I would have to translate from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Do not include punctuations, just the sentences, so one would not be able to know, for instance, what's the last word according to the period at its end. For each sentence, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} wrong extra words in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}, separated only by whitespace, that do not appear in the corresponding translated sentence. Return the result as a raw JSON array of objects in this format: {First: string, Second: string, ExtraOptions: string} where First would be the sentence in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, Second would be the sentence in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} and ExtraOptions would be the whitespace-separated list of words in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} that do not appear in the corresponding translated sentence.`
    },
    {
        type: EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        name: "Common responses with bucket list",
        description:"Generate sentences in the langauge are learning that have common answers - choose the right one from a bucket list.",
        first_data_instructions: "Sentences in the langauge you are learning that have common answers, separated by semi-colon(;)",
        second_data_instructions: "The correct common responses in the langauge you are learning to those sentences, separated by semi-colon(;)",
        extra_options_instructions: "Sets of wrong responses to each sentence. Each response separated by comma(,). Each set that corresponds to the sentence to respond to - separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sentences in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that have common responses to. I would have to choose from a few options the correct response in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences. For each response, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} wrong responses in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}, separated by a comma(,). separate each such set of wrong responses with a semi-colon, and present this as a third list of wrong extra options.`,
        ai_instruction_auto: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER} (on a scale of 1 to ${TOP_LEVEL}). Prepare for me 25 exercises on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}. In each exercise I would have to choose a common response to the sentence presented. Both the sentence and the responses are in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Do not include punctuations, just the sentences and responses. Add a translation of the exchange that can include punctuations. For each correct response, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} wrong extra responses, separated by comma(,). Make sure these are not reasonable alternative responses, but rather incorrect ones. Return the result as a raw JSON array of objects in this format: {First: string, Second: string, ExtraOptions: string - comma(,)-separated list of options, Translation: string} where First would be the sentence to respond to, Second would be the correct response and ExtraOptions would be the comma-separated list of wrong responses to the presented sentence in First, and Translation would be the full translation of the exchange, the values of First and Second, to ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}`
    },
    {
        type: EXERCISE_TYPES.COMMON_RESPONSES,
        name: "Common responses",
        description:"Generate sentences in the langauge are learning that have common answers - write the right one.",
        first_data_instructions: "Sentences in the langauge you are learning that have common answers, separated by semi-colon(;)",
        second_data_instructions: "The correct common responses in the langauge you are learning to those sentences, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 25 sentences in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that have common responses to. I would have to write the correct response in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Then prepare a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences.`,
        ai_instruction_auto: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER} (on a scale of 1 to ${TOP_LEVEL}). Prepare for me 25 exercises on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}. In each exercise I would have to write a common response to the sentence presented. Both the sentence and the responses are in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Do not include punctuations, just the sentences and responses. Add a translation of the exchange that can include punctuations. Return the result as a raw JSON array of objects in this format: {First: string, Second: string, Translation: string } where First would be the sentence to respond to and Second would be the correct response, and Translation would be the full translation of the exchange, the values of First and Second, to ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}`
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