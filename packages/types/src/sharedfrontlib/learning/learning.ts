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
  en: { language: 'en-US', engine: 'generative', voice: 'Ruth', openAIVoice: 'en-US-AvaNeural' },
  ar: { language: 'arb', engine: 'standard', voice: 'Zeina', openAIVoice: 'ar-EG-SalmaNeural' },
  "ar-MA": { language: "ar-MA", engine: 'standard', voice: 'Mouna', openAIVoice: 'ar-MA-MounaNeural' },
  da: { language: 'da-DK', engine: 'standard', voice: 'Naja', openAIVoice: 'da-DK-ChristelNeural' },
  es: { language: 'es-ES', engine: 'neural', voice: 'Lucia', openAIVoice: 'es-ES-ElviraNeural' },
  fr: { language: 'fr-FR', engine: 'neural', voice: 'Lea', openAIVoice: 'fr-FR-DeniseNeural' },
  de: { language: 'de-DE', engine: 'neural', voice: 'Vicki', openAIVoice: 'de-DE-KatjaNeural' },
  ja: { language: 'ja-JP', engine: 'standard', voice: 'Mizuki', openAIVoice: 'ja-JP-NanamiNeural' },
  zh: { language: 'cmn-CN', engine: 'neural', voice: 'Zhiyu', openAIVoice: 'zh-CN-XiaoxiaoNeural' },
  hi: { language: 'hi-IN', engine: 'standard', voice: 'Aditi', openAIVoice: 'hi-IN-SwaraNeural' },
  pt: { language: 'pt-PT', engine: 'neural', voice: 'Ines', openAIVoice: 'pt-PT-RaquelNeural' },
  ru: { language: 'ru-RU', engine: 'standard', voice: 'Tatyana', openAIVoice: 'ru-RU-SvetlanaNeural' },
  ko: { language: 'ko-KR', engine: 'neural', voice: 'Seoyeon', openAIVoice: 'ko-KR-SunHiNeural' },
  it: { language: 'it-IT', engine: 'neural', voice: 'Bianca', openAIVoice: 'it-IT-ElsaNeural' },
  tr: { language: 'tr-TR', engine: 'standard', voice: 'Filiz', openAIVoice: 'tr-TR-EmelNeural' },
  nl: { language: 'nl-NL', engine: 'neural', voice: 'Laura', openAIVoice: 'nl-NL-FennaNeural' },
  sv: { language: 'sv-SE', engine: 'standard', voice: 'Astrid', openAIVoice: 'sv-SE-SofieNeural' },
  no: { language: 'nb-NO', engine: 'standard', voice: 'Liv', openAIVoice: 'nb-NO-PernilleNeural' },
  pl: { language: 'pl-PL', engine: 'standard', voice: 'Maja', openAIVoice: 'pl-PL-ZofiaNeural' },
  fi: { language: 'fi-FI', engine: 'neural', voice: 'Suvi', openAIVoice: 'fi-FI-NooraNeural' },
  cs: { language: 'cs-CZ', engine: 'neural', voice: 'Jitka', openAIVoice: 'cs-CZ-VlastaNeural' },
  ro: { language: 'ro-RO', engine: 'standard', voice: 'Carmen', openAIVoice: 'ro-RO-AlinaNeural' },
  ca: { language: 'ca-ES', engine: 'neural', voice: 'Arlet' , openAIVoice: 'ca-ES-JoanaNeural' },
 
  // --- Languages supported by Edge TTS (previously unsupported by Polly) ---
  te: { language: 'te-IN', engine: 'standard', voice: '' , openAIVoice: 'te-IN-ShrutiNeural' },
  mr: { language: 'mr-IN', engine: 'standard', voice: '' , openAIVoice: 'mr-IN-AarohiNeural' },
  sk: { language: 'sk-SK', engine: 'standard', voice: '' , openAIVoice: 'sk-SK-ViktoriaNeural' },
  he: { language: 'he-IL', engine: 'standard', voice: '' , openAIVoice: 'he-IL-HilaNeural' },
  th: { language: 'th-TH', engine: 'standard', voice: '' , openAIVoice: 'th-TH-PremwadeeNeural' },
  id: { language: 'id-ID', engine: 'standard', voice: '' , openAIVoice: 'id-ID-GadisNeural' },
  hu: { language: 'hu-HU', engine: 'standard', voice: '' , openAIVoice: 'hu-HU-NoemiNeural' },
  el: { language: 'el-GR', engine: 'standard', voice: '' , openAIVoice: 'el-GR-AthinaNeural' },
  ta: { language: 'ta-IN', engine: 'standard', voice: '' , openAIVoice: 'ta-IN-PallaviNeural' },
  vi: { language: 'vi-VN', engine: 'standard', voice: '' , openAIVoice: 'vi-VN-HoaiMyNeural' },
  bn: { language: 'bn-IN', engine: 'standard', voice: '' , openAIVoice: 'bn-IN-TanishaNeural' },
  ur: { language: 'ur-PK', engine: 'standard', voice: '' , openAIVoice: 'ur-PK-UzmaNeural' },
  uk: { language: 'uk-UA', engine: 'standard', voice: '' , openAIVoice: 'uk-UA-PolinaNeural' },
  ms: { language: 'ms-MY', engine: 'standard', voice: '' , openAIVoice: 'ms-MY-YasminNeural' },
  fa: { language: 'fa-IR', engine: 'standard', voice: '' , openAIVoice: 'fa-IR-DilaraNeural' }
} as const;