import { isValidEmail } from "@/lib/people/utils"

export type GuestBookingInput = {
  guestName: string
  guestEmail: string
  guestPhone?: string | null
}

export function validateGuestBookingInput(input: GuestBookingInput): void {
  const name = input.guestName.trim()
  const email = input.guestEmail.trim()

  if (!name) {
    throw new Error("Please enter your name.")
  }
  if (!email) {
    throw new Error("Please enter your email.")
  }
  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address.")
  }
}
