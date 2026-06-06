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
            return str.replace(/[\u064B-\u0652\u0640]/g, '');
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

export function getMissingParts(fullString: string, segments: string[]) {
    const missingParts: string[] = [];
    let currentIndex = 0;

    for (let i = 0; i < segments.length - 1; i++) {
        const currentSegment = segments[i].trim();
        const nextSegment = segments[i + 1].trim();

        const segmentStart = fullString.indexOf(currentSegment, currentIndex);
        if (segmentStart === -1) continue;

        const missingStart = segmentStart + currentSegment.length;

        const missingEnd = fullString.indexOf(nextSegment, missingStart);

        if (missingEnd === -1) {
            //before quitting, see if there is a near match - a match by all but the first letter
            const nearMatch = fullString.indexOf(nextSegment.slice(1), missingStart);
            if (nearMatch !== -1) {
                const missingWord = fullString.substring(missingStart, nearMatch).trim();
                missingParts.push(missingWord);

                currentIndex = nearMatch;
            }
            else {
                missingParts.push("");
            }
            continue;
        }

        const missingWord = fullString.substring(missingStart, missingEnd).trim();
        missingParts.push(missingWord);

        currentIndex = missingEnd;
    }

    return missingParts;
}
