export function replaceCharsForLanguage(language, str) {
    if (!str) return str;

    switch(language.toLowerCase()) {
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

        default:
            return str;
    }
}