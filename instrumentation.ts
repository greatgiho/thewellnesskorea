/**
 * Next.js instrumentation hook.
 * `onRequestError` runs server-side on every unhandled error — full stack is
 * written to the Vercel Function log (visible in the Vercel dashboard under
 * Functions → Logs within 1 h on Hobby, 1 day on Pro).
 *
 * Remove or gate this behind a flag before a high-traffic public launch.
 */
export async function onRequestError(
  err: unknown,
  request: { path: string; method?: string },
  context: { routeType: string },
) {
  const error = err instanceof Error ? err : new Error(String(err))

  // This appears in Vercel Function logs with full detail.
  console.error(
    [
      "══════════════════════════════════════════",
      `[SERVER ERROR] ${context.routeType.toUpperCase()} ${request.method ?? "GET"} ${request.path}`,
      `Message : ${error.message}`,
      `Digest  : ${(error as Error & { digest?: string }).digest ?? "(none)"}`,
      `Stack   :\n${error.stack ?? "(no stack)"}`,
      "══════════════════════════════════════════",
    ].join("\n"),
  )
}
