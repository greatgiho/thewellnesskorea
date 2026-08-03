import { describe, expect, it } from "vitest"
import {
  SIGNED_OUT_MESSAGE,
  unreferencedUploads,
  uploadErrorMessage,
} from "@/lib/schedule/images"

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

describe("unreferencedUploads", () => {
  it("returns everything uploaded for a session that had no photos", () => {
    expect(unreferencedUploads(["s/img-0.jpg", "s/img-1.jpg"], [])).toEqual([
      "s/img-0.jpg",
      "s/img-1.jpg",
    ])
  })

  it("keeps a path the row already points at", () => {
    // Uploads are upserts: img-0.jpg overwrote the row's current image, so
    // deleting it would take that image away from a row still referencing it.
    expect(
      unreferencedUploads(["s/img-0.jpg", "s/img-1.png"], ["s/img-0.jpg"]),
    ).toEqual(["s/img-1.png"])
  })

  it("returns nothing when every upload replaced an existing photo", () => {
    expect(unreferencedUploads(["s/img-0.jpg"], ["s/img-0.jpg"])).toEqual([])
  })

  it("returns nothing when no upload happened", () => {
    expect(unreferencedUploads([], ["s/img-0.jpg"])).toEqual([])
  })
})
