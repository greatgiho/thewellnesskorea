/**
 * Shared between the change-password form and the action behind it.
 *
 * Its own module because a "use server" file may only export async functions,
 * so the action cannot hand this to the form that submits to it.
 */
export const MIN_PASSWORD_LENGTH = 10
