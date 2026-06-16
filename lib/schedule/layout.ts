import type { SessionRow } from "./types"

export type SessionBlockLayout = {
  top: number
  height: number
  left: string
  width: string
}

const LANE_GAP_PX = 2

export function layoutWidthForSession(session: SessionRow): string {
  if (session.status === "confirmed") {
    return "100%"
  }
  return `calc(50% - ${LANE_GAP_PX / 2}px)`
}

export function layoutLeftForSession(session: SessionRow): string {
  if (session.status === "confirmed") {
    return "0"
  }
  return session.slot_lane === 1 ? "50%" : "0"
}
