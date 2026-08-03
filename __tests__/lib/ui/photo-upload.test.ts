import { describe, expect, it } from "vitest"
import { SIGNED_OUT_MESSAGE, uploadErrorMessage } from "@/lib/ui/photo-upload"

describe("uploadErrorMessage", () => {
  it("reads an RLS refusal as an expired session", () => {
    // What storage actually returns when the browser client sends no token.
    expect(uploadErrorMessage("new row violates row-level security policy")).toBe(
      SIGNED_OUT_MESSAGE,
    )
  })

  it("matches the wording whatever its case", () => {
    expect(uploadErrorMessage("New row violates Row-Level Security policy")).toBe(
      SIGNED_OUT_MESSAGE,
    )
  })

  it("keeps any other cause visible", () => {
    expect(uploadErrorMessage("Payload too large")).toBe(
      "Photo upload failed: Payload too large",
    )
  })
})
