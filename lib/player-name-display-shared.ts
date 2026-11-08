/**
 * Display formatting for player names on reports (client-safe).
 * Only title-cases words that are entirely lowercase so McElroy, O'Malley, and AJ stay as entered.
 */

export function formatPlayerDisplayName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "";
  }

  return trimmed
    .split(" ")
    .map((word) => {
      if (!word) {
        return word;
      }
      if (word !== word.toLowerCase()) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
