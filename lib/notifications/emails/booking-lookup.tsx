import { Link, Section, Text } from "@react-email/components"
import { BaseEmail, styles } from "./base"

export type BookingLookupEmailProps = {
  guestName: string
  bookings: {
    sessionTitle: string
    heading: string
    timeRange: string
    /** Null only if the ticket could not be read; the rest still sends. */
    ticketUrl: string | null
    cancelUrl: string
  }[]
}

/**
 * Sent when someone asks for their booking links back.
 *
 * Same two links per class as the confirmation carried, because that is the
 * whole point — this email exists to replace one that was lost. It says
 * nothing new and confirms nothing beyond what the recipient already booked.
 */
export function BookingLookupEmail({
  guestName,
  bookings,
}: BookingLookupEmailProps) {
  return (
    <BaseEmail preview="Your upcoming reservations at The Wellness Korea.">
      <Section>
        <Text style={styles.p}>{guestName ? `Hi ${guestName},` : "Hello,"}</Text>
        <Text style={styles.p}>
          Here are your upcoming reservations. Each one has a ticket to show
          when you arrive, and a link to cancel if your plans change.
        </Text>
      </Section>

      {bookings.map((b) => (
        <Section key={b.cancelUrl}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}
          >
            <tbody>
              <tr>
                <td style={styles.label}>Class</td>
                <td style={styles.value}>{b.sessionTitle}</td>
              </tr>
              <tr>
                <td style={styles.label}>Date</td>
                <td style={styles.value}>{b.heading}</td>
              </tr>
              <tr>
                <td style={{ ...styles.label, borderBottom: "none" }}>Time</td>
                <td style={{ ...styles.value, borderBottom: "none" }}>
                  {b.timeRange}
                </td>
              </tr>
            </tbody>
          </table>
          <Text style={styles.p}>
            {b.ticketUrl ? (
              <>
                <Link href={b.ticketUrl} style={styles.link}>
                  View ticket
                </Link>
                {"  ·  "}
              </>
            ) : null}
            <Link href={b.cancelUrl} style={styles.link}>
              Cancel this reservation
            </Link>
          </Text>
        </Section>
      ))}

      <Section>
        <Text style={styles.link}>
          If you did not ask for this email, you can ignore it — nothing has
          changed about your reservations.
        </Text>
      </Section>
    </BaseEmail>
  )
}
