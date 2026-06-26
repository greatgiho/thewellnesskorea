"use client"

import { useEffect } from "react"

/**
 * Root-level error boundary — catches errors in the root layout itself.
 * Must include <html> and <body> since the layout is broken at this point.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isDev = process.env.NODE_ENV !== "production"

  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f9f6f0",
          color: "#1c2821",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.5rem", fontWeight: 300, marginBottom: "1rem" }}>
          Something went wrong
        </p>

        {isDev ? (
          <pre
            style={{
              maxWidth: "680px",
              overflow: "auto",
              borderRadius: "0.75rem",
              border: "1px solid rgba(220,38,38,0.3)",
              background: "rgba(220,38,38,0.08)",
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.75rem",
              color: "rgb(185,28,28)",
            }}
          >
            {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
        ) : (
          <div style={{ marginTop: "0.5rem" }}>
            <p style={{ fontSize: "0.875rem", color: "#5a7a6e", marginBottom: "0.5rem" }}>
              An unexpected error occurred. Check Vercel Function Logs for details.
            </p>
            {error.digest && (
              <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#8a9e97" }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.25rem",
            border: "1px solid #c8d4cc",
            borderRadius: "0.375rem",
            background: "transparent",
            fontSize: "0.875rem",
            cursor: "pointer",
            color: "#1c2821",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
