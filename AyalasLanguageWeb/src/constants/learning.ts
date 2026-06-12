import type { AppLanguageCode } from "../types/shared/User";

export const PLACEHOLDERS = {
    KNOWN_LANGAUGE_PLACEHOLDER: "kkknownnn",
    TARGET_LANGAUGE_PLACEHOLDER: "tttargettt",
    BLANKS: "___",
    SUBJECT_PLACEHOLDER: "sssubjectsss",
    LEVEL_PLACEHOLDER: 'llllevelllll'
} as const;

export const EXERCISE_TYPES = 
{
    FROM_KNOWN_TO_TARGET: 1,
    FROM_TARGET_TO_KNOWN: 2,
    FILL_IN_THE_BLANKS: 3,
    MATCHING: 4,
    FROM_KNOWN_TO_TARGET_BUCKET: 5
} as const;

export const EXERCISE_TYPE_INSTRUCTIONS: string[] = [];
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET] = `Translate to ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_TARGET_TO_KNOWN] = `Translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}`;
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FILL_IN_THE_BLANKS] = "Fill in the blanks";
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.MATCHING] = "Match words between the two columns";
EXERCISE_TYPE_INSTRUCTIONS[EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET] = `Translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} by selecting some of these words in the right order.`;

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

export const AUTHOR_ACCESS = 
{
    LEARNER: 1,
    CAN_EDIT: 2
} as const;

export const ROLE_TYPE = 
{
    LEARNER: 1,
    CONTENT_CREATOR: 2,
    ADMIN: 3
} as const;

export const EXERCISE_GENERATIONS = 
[
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET, 
        name: "Translate to target language", 
        description:"Generate sentences in the langauge you know to translate to the langauge you are learning.",
        first_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sentences in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that I would have to translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Then preapre me a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences.`
    },
    {
        type: EXERCISE_TYPES.FROM_TARGET_TO_KNOWN, 
        name: "Translate to known language", 
        description:"Generate sentences in the langauge you are learning to translate to the langauge you know.",
        first_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sentences in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that I would have to translate to ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}. Then preapre me a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences.`
    },
    {
        type: EXERCISE_TYPES.FILL_IN_THE_BLANKS, 
        name: "Fill in words", 
        description:"Generate sentences to fill in words in, such as the right prepositions. Use ____ for blanks.",
        first_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;), with blanks for words to fill",
        second_data_instructions: "The same sentences with the blanks filled, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 exercises, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, where I have to fill in the right preposition - use ___ for blanks. Then preapre me a separate list with the full correct sentences. Do not include optional vowel indications, if relevant to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. In each list, separate each sentence with semi-colon. Do not include punctuations to fill, just the prepositions.`
    },
    {
        type: EXERCISE_TYPES.MATCHING, 
        name: "Match words", 
        description:"Match words between two buckets lists: one bucket list will includes words in the langauge you know and the other bucket list will include words in the langauge you are learning.",
        first_data_instructions: "Words in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Words in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sets of four or five words\\expressions in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, each word\\expression separated by comma. Then, prepare matching sets of the translations in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. In each list, separate each set with semi-colon. Do not include punctuations.`
    },
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET, 
        name: "Translate with bucket list", 
        description:"Generate sentences in the langauge you know to translate to the langauge you are learning from a bucket list.",
        first_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER} at level ${PLACEHOLDERS.LEVEL_PLACEHOLDER}. Prepare for me 10 sentences in ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}, on the subject of ${PLACEHOLDERS.SUBJECT_PLACEHOLDER}, that I would have to translate to ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER}. Then preapre me a separate list with the full correct answers. In each list, separate each sentence with semi-colon. Do not include punctuations, just the sentences. For each sentence, generate between ${BUCKET_LIST_EXTRA_OPTIONS.MIN_WORDS} and ${BUCKET_LIST_EXTRA_OPTIONS.MAX_WORDS} words in ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} that do not appear in the corresponding sentence. separate each such set of words with a semi-colon, and present this as a third list of wrong extra options.`
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
  ar: { language: 'arb', engine: 'neural', voice: 'Zeina' },        // Arabic - Neural supported
  da: { language: 'da-DK', engine: 'standard', voice: 'Naja' },     // Danish - ONLY Standard supported
  es: { language: 'es-ES', engine: 'neural', voice: 'Lucia' },      // Spanish (Spain) - Neural supported
  fr: { language: 'fr-FR', engine: 'neural', voice: 'Lea' },        // French - Neural supported
  de: { language: 'de-DE', engine: 'neural', voice: 'Vicki' },      // German - Neural supported
  ja: { language: 'ja-JP', engine: 'neural', voice: 'Mizuki' },     // Japanese - Neural supported
  zh: { language: 'cmn-CN', engine: 'neural', voice: 'Zhiyu' },     // Mandarin Chinese - Neural supported
  hi: { language: 'hi-IN', engine: 'neural', voice: 'Aditi' },      // Hindi - Neural supported
  pt: { language: 'pt-PT', engine: 'neural', voice: 'Ines' },       // Portuguese (Portugal) - Neural supported
  ru: { language: 'ru-RU', engine: 'standard', voice: 'Tatyana' },  // Russian - ONLY Standard supported
  bn: { language: 'bn-IN', engine: 'neural', voice: 'Kajal' },      // Bengali - Neural supported
  ko: { language: 'ko-KR', engine: 'neural', voice: 'Seoyeon' },    // Korean - Neural supported
  it: { language: 'it-IT', engine: 'neural', voice: 'Bianca' },     // Italian - Neural supported
  tr: { language: 'tr-TR', engine: 'neural', voice: 'Filiz' },      // Turkish - Neural supported
  vi: { language: 'vi-VN', engine: 'neural', voice: 'Thi Tuyen' },  // Vietnamese - Neural supported
  ta: { language: 'ta-IN', engine: 'standard', voice: 'Valluvar' }, // Tamil - ONLY Standard supported (Male only)
  el: { language: 'el-GR', engine: 'standard', voice: 'Athina' },   // Greek - ONLY Standard supported
  nl: { language: 'nl-NL', engine: 'neural', voice: 'Laura' },      // Dutch - Neural supported
  sv: { language: 'sv-SE', engine: 'neural', voice: 'Astrid' },     // Swedish - Neural supported
  no: { language: 'nb-NO', engine: 'neural', voice: 'Liv' },        // Norwegian - Neural supported
  pl: { language: 'pl-PL', engine: 'neural', voice: 'Maja' },       // Polish - Neural supported
  fi: { language: 'fi-FI', engine: 'neural', voice: 'Suvi' },       // Finnish - Neural supported
  cs: { language: 'cs-CZ', engine: 'standard', voice: 'Jitka' },    // Czech - ONLY Standard supported
  hu: { language: 'hu-HU', engine: 'standard', voice: 'Kinga' },    // Hungarian - ONLY Standard supported
  th: { language: 'th-TH', engine: 'standard', voice: 'Kanya' },    // Thai - ONLY Standard supported
  id: { language: 'id-ID', engine: 'neural', voice: 'Putri' },      // Indonesian - Neural supported
  ro: { language: 'ro-RO', engine: 'standard', voice: 'Carmen' },   // Romanian - ONLY Standard supported
  he: { language: 'he-IL', engine: 'standard', voice: 'Hila' },     // Hebrew - ONLY Standard supported
  sk: { language: 'sk-SK', engine: 'standard', voice: 'Barbora' },  // Slovak - ONLY Standard supported
  ca: { language: 'ca-ES', engine: 'neural', voice: 'Arlet' },      // Catalan - Neural supported

  // --- Updated Support ---
  te: { language: 'te-IN', engine: 'neural', voice: 'Shruti' },     // Telugu - Neural supported
  mr: { language: 'mr-IN', engine: 'neural', voice: 'Aditi' },      // Marathi - Neural supported

  // --- Languages currently unsupported by Amazon Polly ---
  ur: null,      // Urdu
  uk: null,      // Ukrainian
  ms: null,      // Malay
  fa: null,      // Persian
} as const;