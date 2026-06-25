import { Link, Section, Text } from "@react-email/components"
import { BaseEmail, styles } from "./base"
import type { SessionDetails } from "../email-templates"

export type BookingCancelledEmailProps = {
  guestName: string
  details: SessionDetails
  scheduleUrl: string
}

export function BookingCancelledEmail({
  guestName,
  details,
  scheduleUrl,
}: BookingCancelledEmailProps) {
  return (
    <BaseEmail preview={`Your reservation for ${details.sessionTitle} has been cancelled.`}>
      <Section>
        <Text style={styles.p}>Hi {guestName},</Text>
        <Text style={styles.p}>
          Your reservation has been cancelled as requested.
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
          Browse Upcoming Classes
        </Link>
      </Section>
    </BaseEmail>
  )
}
