export interface Language {
  languageId?: number;
  englishName?: string;
  nativeName?: string;
  code?: string;
}

export interface LanguageSettings {
  targetLanguage?: string;
  knownLanguage?: string;
  targetLanguageEnglishName?: string;
  targetLanguageIsRightToLeft?: boolean;
  otherUserLanguages?: Language[];
  // Added ID fields used across the app
  targetLanguageId?: number;
  knownLanguageId?: number;
}

export interface User {
  id?: number | string;
  displayName?: string;
  languageSettings?: LanguageSettings;
  [key: string]: unknown;
}
