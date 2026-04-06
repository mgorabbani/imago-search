/** Formats raw restriction tokens into readable labels.
 * "PUBLICATIONxINxGERxSUIxAUTxONLY" → "Publication in GER, SUI, AUT only"
 * "EDITORIALxUSExONLY" → "Editorial use only"
 * "NOxMODELxRELEASE" → "No model release"
 */
export function formatRestriction(raw: string): string {
  const parts = raw.split("x");
  const lower = parts.map((p) => p.toLowerCase());

  // Build a readable sentence
  const words = lower.map((word, i) => {
    // Keep country codes uppercase (2-3 letter words that aren't common English)
    if (word.length <= 3 && !["the", "and", "or", "in", "not", "no", "use"].includes(word)) {
      return word.toUpperCase();
    }
    // Capitalize first word
    if (i === 0) return word.charAt(0).toUpperCase() + word.slice(1);
    return word;
  });

  return words.join(" ");
}
