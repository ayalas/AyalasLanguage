import type { AppLanguageCode } from "../types/User";

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