/** Edge-safe helper for middleware (no Node-only imports). */
export function mustChangePassword(
  user: { user_metadata?: Record<string, unknown> } | null,
): boolean {
  return user?.user_metadata?.must_change_password === true
}
