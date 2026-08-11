import { Link, Section, Text } from "@react-email/components"
import { BaseEmail, styles } from "./base"
import type { SessionDetails } from "../email-templates"

export type BookingConfirmationEmailProps = {
  guestName: string
  details: SessionDetails
  /** Null only if the ticket could not be read; the email still sends. */
  ticketUrl: string | null
  cancelUrl: string
  scheduleUrl: string
}

export function BookingConfirmationEmail({
  guestName,
  details,
  ticketUrl,
  cancelUrl,
  scheduleUrl,
}: BookingConfirmationEmailProps) {
  return (
    <BaseEmail preview={`Your reservation for ${details.sessionTitle} is confirmed.`}>
      <Section>
        <Text style={styles.p}>Hi {guestName},</Text>
        <Text style={styles.p}>
          Your reservation at The Wellness Korea is confirmed.
        </Text>
      </Section>

      <Section>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
          <tbody>
            <tr>
              <td style={styles.label}>Class</td>
              <td style={styles.value}>{details.sessionTitle}</td>
            </tr>
            <tr>
              <td style={styles.label}>Date</td>
              <td style={styles.value}>{details.heading}</td>
            </tr>
            <tr>
              <td style={styles.label}>Time</td>
              <td style={styles.value}>{details.timeRange}</td>
            </tr>
            <tr>
              <td style={styles.label}>Floor</td>
              <td style={styles.value}>{details.floorName}</td>
            </tr>
            <tr>
              <td style={{ ...styles.label, borderBottom: "none" }}>Guide</td>
              <td style={{ ...styles.value, borderBottom: "none" }}>
                {details.instructorName}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* The QR itself is not in here. Gmail strips inline SVG and blocks
          data: URIs, so it would have to be a hosted image — which only shows
          when the client agrees to load remote images, and is a broken icon
          when it does not. A link that opens the code in a browser is the one
          form that behaves the same everywhere. */}
      <Section style={{ margin: "24px 0" }}>
        {ticketUrl ? (
          <Link href={ticketUrl} style={styles.button}>
            Show My Ticket
          </Link>
        ) : (
          <Link href={scheduleUrl} style={styles.button}>
            Browse Upcoming Classes
          </Link>
        )}
      </Section>

      <Section>
        <Text style={{ ...styles.pMuted, marginTop: "16px" }}>
          Need to cancel?{" "}
          <Link href={cancelUrl} style={styles.link}>
            Cancel this reservation
          </Link>
        </Text>
        {ticketUrl ? (
          <Text style={styles.pMuted}>
            <Link href={scheduleUrl} style={styles.link}>
              Browse upcoming classes
            </Link>
          </Text>
        ) : null}
        <Text style={styles.pMuted}>
          We look forward to welcoming you at Brickwell, Seochon.
        </Text>
      </Section>
    </BaseEmail>
  )
}
