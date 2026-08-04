import { describe, expect, it } from "vitest"
import { unreferencedUploads } from "@/lib/schedule/images"

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
