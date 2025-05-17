export function extractFromTo(text) {
  const match = text.match(/from (.+?) to (.+)/i);
  return match ? { from: match[1], to: match[2] } : null;
}