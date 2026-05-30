export function replaceCharsForLanguage(language, str) {
    if (!str) return str;

    str = str.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');

    switch (language.toLowerCase()) {
        case 'dansk': // Danish
        case 'norsk': // Norwegian (uses the same characters)
            return str
                .replaceAll('aa', 'å').replaceAll('Aa', 'Å').replaceAll('AA', 'Å')
                .replaceAll('oe', 'ø').replaceAll('Oe', 'Ø').replaceAll('OE', 'Ø')
                .replaceAll('ae', 'æ').replaceAll('Ae', 'Æ').replaceAll('AE', 'Æ');

        case 'deutsch': // German
            return str
                .replaceAll('ae', 'ä').replaceAll('Ae', 'Ä').replaceAll('AE', 'Ä')
                .replaceAll('oe', 'ö').replaceAll('Oe', 'Ö').replaceAll('OE', 'Ö')
                .replaceAll('ue', 'ü').replaceAll('Ue', 'Ü').replaceAll('UE', 'Ü');

        case 'suomi': // Finnish
        case 'svenska': // Swedish
            return str
                // Handle ae and oe first so 'aa' doesn't intercept letters unexpectedly
                .replaceAll('ae', 'ä').replaceAll('Ae', 'Ä').replaceAll('AE', 'Ä')
                .replaceAll('oe', 'ö').replaceAll('Oe', 'Ö').replaceAll('OE', 'Ö')
                .replaceAll('aa', 'å').replaceAll('Aa', 'Å').replaceAll('AA', 'Å');

        case 'islandska': // Icelandic
            return str
                .replaceAll('ae', 'æ').replaceAll('Ae', 'Æ').replaceAll('AE', 'Æ')
                .replaceAll('oe', 'ó').replaceAll('Oe', 'Ó').replaceAll('OE', 'Ó') // <-- Changed to ó/Ó
                .replaceAll('th', 'þ').replaceAll('Th', 'Þ').replaceAll('TH', 'Þ')
                .replaceAll('dh', 'ð').replaceAll('Dh', 'Ð').replaceAll('DH', 'Ð');
        case 'العربية':
            return str.replace(/[\u064B-\u0652\u0640]/g, '');
        default:
            return str;
    }
}

export async function reloadLanguageSettings(axios, user, login) {

    const newUser = { ...user };
    const response = await axios.get('/api/profile/current');
    newUser.languageSettings = response.data;
    login(newUser);
    return newUser;
}

export async function switchLanguage(axios, user, login, targetLanguageId, knownLangaugeId) {

    await axios.post('/api/profile/current', {
        TargetLanguageId: targetLanguageId,
        KnownLanguageId: knownLangaugeId
    });

    return reloadLanguageSettings(axios, user, login);
}

export function getMissingParts(fullString, segments) {
    const missingParts = [];
    let currentIndex = 0;

    for (let i = 0; i < segments.length - 1; i++) {
        // Trim the segments to remove accidental outer spaces
        const currentSegment = segments[i].trim();
        const nextSegment = segments[i + 1].trim();

        // 1. Find where the current segment starts
        const segmentStart = fullString.indexOf(currentSegment, currentIndex);
        if (segmentStart === -1) continue; 
        
        // 2. Move to the end of the current segment
        const missingStart = segmentStart + currentSegment.length;

        // 3. Find where the next segment begins
        const missingEnd = fullString.indexOf(nextSegment, missingStart);
        
        if (missingEnd === -1) {
            missingParts.push(""); 
            continue;
        }

        // 4. Extract the piece in between and trim it to remove extra spaces
        const missingWord = fullString.substring(missingStart, missingEnd).trim();
        missingParts.push(missingWord);

        // 5. Update pointer
        currentIndex = missingEnd;
    }

    return missingParts;
}