import type { AppLanguageCode } from "../User";

export const PLACEHOLDERS = {
    KNOWN_LANGUAGE_PLACEHOLDER: "kkknownnn",
    TARGET_LANGUAGE_PLACEHOLDER: "tttargettt",
    BLANKS: "___",
    SUBJECT_PLACEHOLDER: "sssubjectsss",
    NUM_OF_EXERCISES_PLACEHOLDER: 'nnnumofexercisesnnn',
    NUM_OF_MATCHES_PLACEHOLDER: 'nnnumofmatchesnnn',
    NUM_OF_WRONG_OPTIONS_PLACEHOLDER: 'nnnumofwrongoptionsnnn'
} as const;

export const DEFAULT_NUM_OF_EXERCISES = 10;

export const BUCKET_LIST_EXTRA_OPTIONS = 
{
    MIN_WORDS: 1,
    MAX_WORDS: 5
} as const;

export const MIN_MATCHES = 2;
export const MAX_MATCHES = 6;

export const LEANRING_STATUS = 
{
    NEW: 0,
    DONE: 1,
    IN_PROGRESS: 2
} as const;


/**
 * Maps custom application language codes to voice and engines (Amazon Polly - not in use).
 * 
 * unclosed ai voices:
 * "aria","clara","elena","grace","hazel","iris","luna","maya","ruby","sage","sofia","amber","brooke","cora",
            "diana","eden","faye","gemma","hope","ivy","atlas","caleb","felix","hugo","jasper","kai","leo","marcus","owen","theo","archer",
            "blake","cole","dane","ezra","finn","grant","heath","ivan","jude","foxhop"

 */
export const LANGUAGE_TO_POLLY_MAP: Record<
  AppLanguageCode,
  { language: string; engine: 'standard' | 'neural' | 'long-form' | 'generative'; voice: string; openAIVoice: string } | null
> = {
  en: { language: 'en-US', engine: 'generative', voice: 'Ruth', openAIVoice: 'elena' },    // English (US) - Generative supported
  ar: { language: 'arb', engine: 'standard', voice: 'Zeina', openAIVoice: 'elena' },        // Arabic - ONLY Standard supported
  da: { language: 'da-DK', engine: 'standard', voice: 'Naja', openAIVoice: 'elena' },     // Danish - ONLY Standard supported
  es: { language: 'es-ES', engine: 'neural', voice: 'Lucia', openAIVoice: 'elena' },      // Spanish (Spain) - Neural supported
  fr: { language: 'fr-FR', engine: 'neural', voice: 'Lea', openAIVoice: 'elena' },        // French - Neural supported
  de: { language: 'de-DE', engine: 'neural', voice: 'Vicki', openAIVoice: 'elena' },      // German - Neural supported
  ja: { language: 'ja-JP', engine: 'standard', voice: 'Mizuki', openAIVoice: 'elena' },     // Japanese - ONLY Standard supported
  zh: { language: 'cmn-CN', engine: 'neural', voice: 'Zhiyu', openAIVoice: 'elena' },     // Mandarin Chinese - Neural supported
  hi: { language: 'hi-IN', engine: 'standard', voice: 'Aditi', openAIVoice: 'elena' },      // Hindi - ONLY Standard supported
  pt: { language: 'pt-PT', engine: 'neural', voice: 'Ines', openAIVoice: 'elena' },       // Portuguese (Portugal) - Neural supported
  ru: { language: 'ru-RU', engine: 'standard', voice: 'Tatyana', openAIVoice: 'elena' },  // Russian - ONLY Standard supported
  ko: { language: 'ko-KR', engine: 'neural', voice: 'Seoyeon', openAIVoice: 'elena' },    // Korean - Neural supported
  it: { language: 'it-IT', engine: 'neural', voice: 'Bianca', openAIVoice: 'elena' },     // Italian - Neural supported
  tr: { language: 'tr-TR', engine: 'standard', voice: 'Filiz', openAIVoice: 'elena' },      // Turkish - ONLY Standard supported
  nl: { language: 'nl-NL', engine: 'neural', voice: 'Laura', openAIVoice: 'elena' },      // Dutch - Neural supported
  sv: { language: 'sv-SE', engine: 'standard', voice: 'Astrid', openAIVoice: 'elena' },     // Swedish - ONLY Standard supported
  no: { language: 'nb-NO', engine: 'standard', voice: 'Liv', openAIVoice: 'elena' },        // Norwegian - ONLY Standard supported
  pl: { language: 'pl-PL', engine: 'standard', voice: 'Maja', openAIVoice: 'elena' },       // Polish - ONLY Standard supported
  fi: { language: 'fi-FI', engine: 'neural', voice: 'Suvi', openAIVoice: 'finn' },       // Finnish - Neural supported
  cs: { language: 'cs-CZ', engine: 'neural', voice: 'Jitka', openAIVoice: 'elena' },    // Czech - ONLY Standard supported
  ro: { language: 'ro-RO', engine: 'standard', voice: 'Carmen', openAIVoice: 'elena' },   // Romanian - ONLY Standard supported
  ca: { language: 'ca-ES', engine: 'neural', voice: 'Arlet' , openAIVoice: 'elena' },      // Catalan - Neural supported
 
  // --- Languages currently unsupported by Amazon Polly ---
  te: { language: 'te-IN', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  mr: { language: 'mr-IN', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  sk: { language: 'sk-SK', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  he: { language: 'he-IL', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  th: { language: 'th-TH', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  id: { language: 'id-ID', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  hu: { language: 'hu-HU', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  el: { language: 'el-GR', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  ta: { language: 'el-GR', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  vi: { language: 'vi-VN', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  bn: { language: 'bn-BD', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  ur: { language: 'ur-PK', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  uk: { language: 'uk-UA', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  ms: { language: 'ms-MY', engine: 'standard', voice: '' , openAIVoice: 'elena' },
  fa: { language: 'fa-IR', engine: 'standard', voice: '' , openAIVoice: 'elena' }
} as const;