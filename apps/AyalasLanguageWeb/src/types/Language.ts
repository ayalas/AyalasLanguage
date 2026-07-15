import type { AppLanguageCode } from "@ayalaslanguage/types/sharedfrontlib/user";
export interface Language {
  languageId: number;
  englishName: string;
  nativeName?: string;
  code?: AppLanguageCode;
}
