export function generateReference() {
  const now = new Date();

  const datePart = now
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(2, 14);

  const randomPart = Math.floor(Math.random() * 90 + 10);

  return `${(datePart + randomPart).slice(0, 13)}`;
}
