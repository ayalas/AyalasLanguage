export function removeLastCharIfMatch(str, charToRemove) {
  // Check if the string ends with the specified character
  if (str && str.endsWith(charToRemove)) {
    return str.slice(0, -1);
  }
  
  // Return original string if it doesn't match
  return str;
}