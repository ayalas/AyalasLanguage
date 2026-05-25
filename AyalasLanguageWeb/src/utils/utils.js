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

        // 1. Find where the current segment starts, starting from our last known position
        const segmentStart = fullString.indexOf(currentSegment, currentIndex);
        
        // 2. Move our index to the end of the current segment (where the missing word starts)
        const missingStart = segmentStart + currentSegment.length;

        // 3. Find where the next segment begins
        const missingEnd = fullString.indexOf(nextSegment, missingStart);

        // 4. Extract the piece in between and add it to our results
        const missingWord = fullString.substring(missingStart, missingEnd);
        missingParts.push(missingWord);

        // 5. Update our pointer so the next iteration starts after this current segment
        currentIndex = missingStart;
    }

    return missingParts;
}