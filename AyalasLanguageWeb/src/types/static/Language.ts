import type { AppLanguageCode } from "../../types/shared/User";
export interface Language {
  languageId: number;
  englishName: string;
  nativeName?: string;
  code?: AppLanguageCode;
}
