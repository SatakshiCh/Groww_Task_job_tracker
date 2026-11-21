export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // randomUUID needs a secure context; plain-http LAN previews on a phone don't have one.
  return 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}
