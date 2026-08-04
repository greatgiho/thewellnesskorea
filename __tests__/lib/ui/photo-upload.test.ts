import { describe, expect, it } from "vitest"
import {
  REFUSED_MESSAGE,
  SIGNED_OUT_MESSAGE,
  uploadErrorMessage,
} from "@/lib/ui/photo-upload"

// Storage says exactly this whether the client has no session or the bucket
// has no policy, so the wording has to come from somewhere else.
const RLS = "new row violates row-level security policy"

describe("uploadErrorMessage", () => {
  it("tells a signed-out user to sign in", () => {
    expect(uploadErrorMessage(RLS, false)).toBe(SIGNED_OUT_MESSAGE)
  })

  it("does not blame the session when there is one", () => {
    // 2026-08-03: a dev project cloned without its storage policies refused
    // every upload, and an admin who was plainly signed in was told their
    // session had expired.
    expect(uploadErrorMessage(RLS, true)).toBe(REFUSED_MESSAGE)
  })

  it("matches the refusal whatever its case", () => {
    expect(uploadErrorMessage("New Row Violates Row-Level Security Policy", false)).toBe(
      SIGNED_OUT_MESSAGE,
    )
  })

  it("keeps any other cause visible, signed in or not", () => {
    expect(uploadErrorMessage("Payload too large", true)).toBe(
      "Photo upload failed: Payload too large",
    )
    expect(uploadErrorMessage("Payload too large", false)).toBe(
      "Photo upload failed: Payload too large",
    )
  })
})
