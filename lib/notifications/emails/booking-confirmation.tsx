import { Img, Link, Section, Text } from "@react-email/components"
import { BaseEmail, styles } from "./base"
import type { SessionDetails } from "../email-templates"

export type BookingConfirmationEmailProps = {
  guestName: string
  details: SessionDetails
  /** Null only if the ticket could not be read; the email still sends. */
  ticketUrl: string | null
  ticketQrUrl: string | null
  cancelUrl: string
  scheduleUrl: string
}

export function BookingConfirmationEmail({
  guestName,
  details,
  ticketUrl,
  ticketQrUrl,
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

      {/* The ticket is the email's reason to exist for a guest booking: there
          is no account to come back to, so this is the copy they keep. The code
          is here rather than only behind a link, because a link is not a ticket
          when you are standing at a door with no signal. The button stays as
          the fallback for clients that block remote images. */}
      {ticketQrUrl && ticketUrl ? (
        <Section style={{ margin: "24px 0", textAlign: "center" as const }}>
          <Img
            src={ticketQrUrl}
            width="200"
            height="200"
            alt="Ticket QR code"
            style={{
              display: "block",
              margin: "0 auto",
              border: "1px solid #eee",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              padding: "12px",
            }}
          />
          <Link
            href={ticketUrl}
            style={{ ...styles.button, display: "inline-block", marginTop: "20px" }}
          >
            Show My Ticket
          </Link>
        </Section>
      ) : (
        <Section style={{ margin: "24px 0" }}>
          <Link href={scheduleUrl} style={styles.button}>
            Browse Upcoming Classes
          </Link>
        </Section>
      )}

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
