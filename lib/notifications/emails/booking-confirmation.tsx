import { Link, Section, Text } from "@react-email/components"
import { BaseEmail, styles } from "./base"
import type { SessionDetails } from "../email-templates"

export type BookingConfirmationEmailProps = {
  guestName: string
  details: SessionDetails
  cancelUrl: string
  scheduleUrl: string
}

export function BookingConfirmationEmail({
  guestName,
  details,
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

      <Section style={{ margin: "24px 0" }}>
        <Link href={scheduleUrl} style={styles.button}>
          View Schedule
        </Link>
      </Section>

      <Section>
        <Text style={{ ...styles.pMuted, marginTop: "16px" }}>
          Need to cancel?{" "}
          <Link href={cancelUrl} style={styles.link}>
            Cancel this reservation
          </Link>
        </Text>
        <Text style={styles.pMuted}>
          We look forward to welcoming you at Brickwell, Seochon.
        </Text>
      </Section>
    </BaseEmail>
  )
}
