import { Link, Section, Text } from "@react-email/components"
import { BaseEmail, styles } from "./base"

export type WaitlistAvailableEmailProps = {
  guestName: string
  sessionTitle: string
  heading: string
  timeRange: string
  bookUrl: string
}

export function WaitlistAvailableEmail({
  guestName,
  sessionTitle,
  heading,
  timeRange,
  bookUrl,
}: WaitlistAvailableEmailProps) {
  return (
    <BaseEmail preview={`A spot opened up in ${sessionTitle} — book now.`}>
      <Section>
        <Text style={styles.p}>Hi {guestName},</Text>
        <Text style={styles.p}>
          Good news — a spot just opened up in a class you were waiting for.
        </Text>
      </Section>

      <Section>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
          <tbody>
            <tr>
              <td style={styles.label}>Class</td>
              <td style={styles.value}>{sessionTitle}</td>
            </tr>
            <tr>
              <td style={{ ...styles.label, borderBottom: "none" }}>Date</td>
              <td style={{ ...styles.value, borderBottom: "none" }}>
                {heading} · {timeRange}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={{ margin: "24px 0" }}>
        <Link href={bookUrl} style={styles.button}>
          Book Now
        </Link>
      </Section>

      <Section>
        <Text style={styles.pMuted}>
          Spots fill quickly — this notification was sent to everyone on the waitlist.
        </Text>
      </Section>
    </BaseEmail>
  )
}
