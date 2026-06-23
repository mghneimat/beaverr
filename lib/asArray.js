/** Coerce persisted JSON values to arrays — legacy saves may store objects. */
export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
