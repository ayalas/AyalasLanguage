export function removeLastCharIfMatch(str, charToRemove) {
  // Check if the string ends with the specified character
  if (str && str.endsWith(charToRemove)) {
    return str.slice(0, -1);
  }
  
  // Return original string if it doesn't match
  return str;
}

export function getRandomizedSequence(n) {
  if (typeof n !== 'number' || n <= 0 || !Number.isInteger(n)) {
    throw new Error("Input must be a positive integer greater than zero.");
  }

  // 1. Create an array from 0 to n-1
  const arr = Array.from({ length: n }, (_, index) => index);

  // 2. Shuffle the array using the Fisher-Yates algorithm
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements arr[i] and arr[j]
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
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