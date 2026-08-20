import { describe, expect, it } from "vitest"
import * as settings from "@/lib/site/settings"
import {
  BUSINESS_INFO_COLUMNS,
  EDITABLE_COLUMNS,
  pickEditableColumns,
} from "@/lib/site/settings"

/**
 * The settings page posts two forms at the same row. What matters is that a
 * save carries only its own section: the first version of this wrote every
 * known column, which would have let someone editing the footer copy wipe the
 * trader details underneath it without touching them.
 */
describe("pickEditableColumns", () => {
  const form = (entries: Record<string, string>) => {
    const fd = new FormData()
    for (const [k, v] of Object.entries(entries)) fd.set(k, v)
    return fd
  }

  it("keeps only the fields the submission carried", () => {
    const patch = pickEditableColumns(
      form({ tagline_en: "Hello", contact_email: "a@b.test" }),
    )
    expect(patch).toEqual({ tagline_en: "Hello", contact_email: "a@b.test" })
    for (const column of Object.values(BUSINESS_INFO_COLUMNS)) {
      expect(patch).not.toHaveProperty(column)
    }
  })

  it("keeps a field that was deliberately cleared", () => {
    // Present-but-empty is an instruction to blank it; absent is not.
    expect(pickEditableColumns(form({ tagline_ko: "" }))).toEqual({
      tagline_ko: "",
    })
  })

  it("trims, so a stray space is not saved as content", () => {
    expect(pickEditableColumns(form({ business_number: "  000-00-00000  " })))
      .toEqual({ business_number: "000-00-00000" })
  })

  it("drops anything that is not an editable column", () => {
    expect(
      pickEditableColumns(
        form({ id: "false", updated_at: "1999-01-01", drop: "table" }),
      ),
    ).toEqual({})
  })

  it("returns nothing for an empty submission", () => {
    expect(pickEditableColumns(form({}))).toEqual({})
  })

  it("lists every mapped column exactly once", () => {
    // Every column map the module exports, found rather than listed. The
    // earlier version named the maps it knew about, which meant adding a third
    // and forgetting EDITABLE_COLUMNS also meant forgetting this line — so the
    // test that exists to catch that could not catch it. It went unnoticed
    // until a bank account was added and CI broke on the assertion instead of
    // on the thing it guards.
    // _INFO_COLUMNS, not _COLUMNS: EDITABLE_COLUMNS ends the same way and is
    // the thing under test, so a looser filter counts every column twice.
    const mapped = Object.entries(settings)
      .filter(([name]) => name.endsWith("_INFO_COLUMNS"))
      .flatMap(([, map]) => Object.values(map as Record<string, string>))

    expect(mapped.length).toBeGreaterThan(0)
    expect([...EDITABLE_COLUMNS].sort()).toEqual([...mapped].sort())
    expect(new Set(EDITABLE_COLUMNS).size).toBe(EDITABLE_COLUMNS.length)
  })
})
