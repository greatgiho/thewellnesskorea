import { describe, expect, it } from "vitest"
import { qrDateStamp, qrFilename } from "@/lib/referrals/links"

/**
 * These names end up in a downloads folder holding QRs for five different
 * cafés. A name you cannot read is a QR you reprint.
 */
describe("qrFilename", () => {
  it("carries the code, the class and the date", () => {
    expect(qrFilename("cafe-tongui", "달항아리 데이 리트릿", "20260825")).toBe(
      "twk-qr-cafe-tongui-달항아리-데이-리트릿-20260825",
    )
  })

  it("keeps Korean", () => {
    // Every system these files touch handles it, and the person reading the
    // folder reads Korean.
    expect(qrFilename("사이트")).toBe("twk-qr-사이트")
  })

  it("drops the characters a filesystem refuses", () => {
    // A class titled "요가 / 명상" would otherwise be saved into a directory
    // that does not exist, or refused outright.
    expect(qrFilename("jin", "요가 / 명상: 저녁")).toBe("twk-qr-jin-요가-명상-저녁")
    expect(qrFilename("jin", 'a"b<c>d|e?f*g')).toBe("twk-qr-jin-abcdefg")
  })

  it("skips parts that are missing rather than leaving gaps", () => {
    // A class with no title, or a partner QR with no date, should not come out
    // as twk-qr--20260825.
    expect(qrFilename("cafe", null, "20260825")).toBe("twk-qr-cafe-20260825")
    expect(qrFilename("cafe", "  ", undefined)).toBe("twk-qr-cafe")
  })

  it("never returns something empty", () => {
    // The value goes straight into a download attribute; an empty one saves a
    // file the browser names itself.
    expect(qrFilename()).toBe("twk-qr")
    expect(qrFilename("///")).toBe("twk-qr")
  })

  it("stays short enough for any filesystem", () => {
    expect(qrFilename("x".repeat(200)).length).toBe(80)
  })
})

describe("qrDateStamp", () => {
  it("stamps the class date in KST", () => {
    // 08:00 KST on 12 August is 23:00 UTC on the 11th. A filename built off
    // the UTC date would label every morning class with yesterday — the same
    // slip as #176, this time on a file nobody thinks to double-check.
    expect(qrDateStamp("2026-08-11T23:00:00+00:00")).toBe("20260812")
    expect(qrDateStamp("2026-08-25T01:00:00+00:00")).toBe("20260825")
  })
})
