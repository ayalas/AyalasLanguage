// Define a strict type for your custom language codes to ensure type safety
export type AppLanguageCode = 
  | 'en' | 'ar' | 'da' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'hi' | 'pt' 
  | 'ru' | 'bn' | 'ko' | 'it' | 'tr' | 'vi' | 'te' | 'mr' | 'ta' | 'ur' 
  | 'el' | 'nl' | 'sv' | 'no' | 'pl' | 'fi' | 'cs' | 'hu' | 'th' | 'id' 
  | 'ro' | 'uk' | 'he' | 'ms' | 'fa' | 'sk' | 'ca';
  
export interface Language {
  languageId?: number;
  englishName?: string;
  nativeName?: string;
  code?: AppLanguageCode;
}

export interface LanguageSettings {
  targetLanguage?: string;
  knownLanguage?: string;
  knownLanguageIsRightToLeft?: boolean;
  targetLanguageEnglishName?: string;
  targetLanguageIsRightToLeft?: boolean;
  targetLanguageCode: AppLanguageCode;
  otherUserLanguages?: Language[];
  // Added ID fields used across the app
  targetLanguageId?: number;
  knownLanguageId?: number;
  score: number;
}

export interface User {
  userId: number;
  displayName?: string;
  userName: string;
  role: number;
  emailConfirmed: boolean;
  use2FALogin: boolean;
  disablePuter: boolean;
  numOfExercisesToGenerate?: number;
  languageSettings?: LanguageSettings;
}
