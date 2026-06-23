import type { LanguageSettings, User } from '../types/shared/User';

export function replaceCharsForLanguage(language: string | undefined, str: string | undefined): string | undefined {
    if (!str) return str;

    str = str.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');

    switch ((language || '').toLowerCase()) {
        case 'dansk':
        case 'norsk':
            return str
                .replaceAll('aa', 'å').replaceAll('Aa', 'Å').replaceAll('AA', 'Å')
                .replaceAll('oe', 'ø').replaceAll('Oe', 'Ø').replaceAll('OE', 'Ø')
                .replaceAll('ae', 'æ').replaceAll('Ae', 'Æ').replaceAll('AE', 'Æ');

        case 'deutsch':
            return str
                .replaceAll('ae', 'ä').replaceAll('Ae', 'Ä').replaceAll('AE', 'Ä')
                .replaceAll('oe', 'ö').replaceAll('Oe', 'Ö').replaceAll('OE', 'Ö')
                .replaceAll('ue', 'ü').replaceAll('Ue', 'Ü').replaceAll('UE', 'Ü');

        case 'suomi':
        case 'svenska':
            return str
                .replaceAll('ae', 'ä').replaceAll('Ae', 'Ä').replaceAll('AE', 'Ä')
                .replaceAll('oe', 'ö').replaceAll('Oe', 'Ö').replaceAll('OE', 'Ö')
                .replaceAll('aa', 'å').replaceAll('Aa', 'Å').replaceAll('AA', 'Å');

        case 'islandska':
            return str
                .replaceAll('ae', 'æ').replaceAll('Ae', 'Æ').replaceAll('AE', 'Æ')
                .replaceAll('oe', 'ó').replaceAll('Oe', 'Ó').replaceAll('OE', 'Ó')
                .replaceAll('th', 'þ').replaceAll('Th', 'Þ').replaceAll('TH', 'Þ')
                .replaceAll('dh', 'ð').replaceAll('Dh', 'Ð').replaceAll('DH', 'Ð');
        case 'العربية':
            return str.replace(/[\u064B-\u0652\u0640]/g, '').replaceAll('إ', 'ا')
                .replaceAll('أ', 'ا').replaceAll('آ', 'ا').replaceAll('ئ', 'ى')
                .replaceAll('ؤ','و');
        default:
            return str;
    }
}

export async function reloadLanguageSettings(axios: any, user: User, login: (u: User) => void) {
    const response = await axios.get('/api/profile/current');
    return setLanguageSettings(response.data, user, login);
}

export async function setLanguageSettings(languageSettings: LanguageSettings, user: User, login: (u: User) => void) {
    const newUser = { ...user } as User;
    newUser.languageSettings = languageSettings;
    login(newUser);
    return newUser;
}

export async function switchLanguage(axios: any, user: User, login: (u: User) => void, targetLanguageId: number, knownLangaugeId: number) {
    await axios.post('/api/profile/current', {
        TargetLanguageId: targetLanguageId,
        KnownLanguageId: knownLangaugeId
    });

    return reloadLanguageSettings(axios, user, login);
}

/**
 * Splits a string by a separator and keeps the separator in the resulting array.
 * 
 * @param source - The original string to split
 * @param separator - The string to split by
 * @returns An array of strings including the segments and the separators
 */
export function splitAndKeep(source: string, separator: string): string[] {
  if (!separator) return [source];

  // Escape special regex characters in the separator (like ., *, +, etc.)
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create a regex with capturing groups: (separator)
  const regex = new RegExp(`(${escapedSeparator})`, 'g');

  // Split the string. The capturing group ensures separators are kept.
  // We filter out empty strings that occur if the separator is at the start/end
  return source.split(regex).filter(part => part.length > 0);
}

export function getMissingParts(fullString: string, segments: string[]) {
    if (segments.length === 0) return [];

    const missingParts: string[] = [];
    let currentIndex = 0;

    // 1. Handle text BEFORE the very first segment
    const firstSegment = segments[0].trim();
    const firstSegmentStart = fullString.indexOf(firstSegment);

    if (firstSegmentStart !== -1) {
        const leadingText = fullString.substring(0, firstSegmentStart).trim();
        if (leadingText) {
            missingParts.push(leadingText);
        }
        // Move the index to the end of the first segment to start looking for gaps
        currentIndex = firstSegmentStart;
    }

    // 2. Find gaps BETWEEN segments
    for (let i = 0; i < segments.length - 1; i++) {
        const currentSegment = segments[i].trim();
        const nextSegment = segments[i + 1].trim();

        const segmentStart = fullString.indexOf(currentSegment, currentIndex);
        if (segmentStart === -1) {
            missingParts.push("");
            continue;
        }

        const missingStart = segmentStart + currentSegment.length;
        let missingEnd = fullString.indexOf(nextSegment, missingStart);

        if (missingEnd === -1) {
            // Near match logic: check if next segment matches minus its first character
            const nearMatch = fullString.indexOf(nextSegment.slice(1), missingStart);
            if (nearMatch !== -1) {
                missingEnd = nearMatch;
            }
        }

        if (missingEnd !== -1) {
            const missingWord = fullString.substring(missingStart, missingEnd).trim();
            missingParts.push(missingWord);
            currentIndex = missingEnd;
        } else {
            missingParts.push("");
            currentIndex = missingStart;
        }
    }

    // 3. Handle the "tail" (text after the very last segment)
    const lastSegment = segments[segments.length - 1].trim();
    const lastSegmentStart = fullString.indexOf(lastSegment, currentIndex);

    if (lastSegmentStart !== -1) {
        const lastSegmentEnd = lastSegmentStart + lastSegment.length;
        const trailingText = fullString.substring(lastSegmentEnd).trim();

        if (trailingText) {
            missingParts.push(trailingText);
        }
    }

    return missingParts;
}
