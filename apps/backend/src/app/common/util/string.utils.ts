export function generateRandomString(length: number): string {
  const amountCharsAndNumbers = 36;

  const chars = new Uint8Array(length);

  const randomValues = Array.from(crypto.getRandomValues(chars));

  return randomValues
    .map((c) => c % amountCharsAndNumbers)
    .map((c) => c.toString(amountCharsAndNumbers))
    .join('');
}
