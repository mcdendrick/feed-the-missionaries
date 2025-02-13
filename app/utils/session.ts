// Keep track of valid session tokens
const validSessions = new Set<string>();

export function addValidSession(token: string) {
  validSessions.add(token);
  // Expire the token after 7 days
  setTimeout(() => {
    validSessions.delete(token);
  }, 7 * 24 * 60 * 60 * 1000);
}

export function isValidSession(token: string): boolean {
  return validSessions.has(token);
}

export function removeSession(token: string) {
  validSessions.delete(token);
} 