import type { AppLanguageCode } from "./User";
export interface Language {
  languageId: number;
  englishName: string;
  nativeName?: string;
  code?: AppLanguageCode;
}
