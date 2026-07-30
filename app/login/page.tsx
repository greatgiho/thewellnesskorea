import { redirect } from "next/navigation"

// TODO: DEPRECATED (blocked) — legacy magic-link member login at "/login".
// Superseded by /u/signin (email + password) and Google OAuth. This page is
// blocked by redirecting to /u/signin. Full removal is tracked in issue #48:
// delete this page, /login/check-email, MemberLoginForm, the magic-link server
// actions, and the /login references in middleware.ts.
export default function LoginPage() {
  redirect("/u/signin")
}
