export function countVowels(str) {
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  let count = 0;

  for (const char of String(str).toLowerCase()) {
    if (vowels.has(char)) {
      count++;
    }
  }

  return count;
}
