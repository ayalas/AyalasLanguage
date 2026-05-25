export function removeLastCharIfMatch(str, charToRemove) {
  // Check if the string ends with the specified character
  if (str && str.endsWith(charToRemove)) {
    return str.slice(0, -1);
  }
  
  // Return original string if it doesn't match
  return str;
}

export function getMissingParts(fullString, segments) {
    const missingParts = [];
    let currentIndex = 0;

    for (let i = 0; i < segments.length - 1; i++) {
        const currentSegment = segments[i];
        const nextSegment = segments[i + 1];

        // 1. Find where the current segment starts
        const segmentStart = fullString.indexOf(currentSegment, currentIndex);
        if (segmentStart === -1) continue; // Safety guard
        
        // 2. Move to the end of the current segment
        const missingStart = segmentStart + currentSegment.length;

        // 3. Find where the next segment begins
        const missingEnd = fullString.indexOf(nextSegment, missingStart);
        
        // Safety guard: If the next segment isn't found, we can't determine the gap
        if (missingEnd === -1) {
            missingParts.push(""); 
            continue;
        }

        // 4. Extract the piece in between
        const missingWord = fullString.substring(missingStart, missingEnd);
        missingParts.push(missingWord);

        // 5. Update pointer to the START of the next segment (fixes the "lazy pointer" bug)
        currentIndex = missingEnd;
    }

    return missingParts;
}