/**
 * ID generation utility.
 *
 * Uses `crypto.randomUUID()` when available, with a fallback for
 * environments without the Web Crypto API.
 */
export function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
