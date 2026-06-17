import type { Metadata } from "next"
import { LegalPageLayout, LegalSection } from "@/components/legal/legal-page-layout"

export const metadata: Metadata = {
  title: "Privacy Policy — The Wellness Korea",
  description: "How The Wellness Korea collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="June 16, 2026">
      <LegalSection title="1. Who we are">
        <p>
          The Wellness Korea (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
          thewellnesskorea.com and wellness programs at Brickwell in Seochon, Seoul,
          South Korea. This Privacy Policy explains how we handle personal information
          when you visit our website, register for programs, book sessions, or
          communicate with us.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>We may collect the following categories of information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Contact details</strong> — name,
            email address, phone number, and country of residence.
          </li>
          <li>
            <strong className="text-foreground">Account information</strong> — login
            credentials and profile details for instructors and administrators who use
            our portals.
          </li>
          <li>
            <strong className="text-foreground">Booking and program data</strong> —
            session selections, attendance preferences, and communications related to
            your visit.
          </li>
          <li>
            <strong className="text-foreground">Technical data</strong> — IP address,
            browser type, device information, and usage data collected through cookies
            or similar technologies.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, operate, and improve our website and wellness programs</li>
          <li>Process registrations, bookings, and instructor applications</li>
          <li>Send service-related messages, including schedule updates and account notices</li>
          <li>Respond to inquiries and provide customer support</li>
          <li>Maintain security, prevent fraud, and comply with legal obligations</li>
          <li>Analyze aggregated usage to improve our services</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal bases (where applicable)">
        <p>
          Depending on your location, we process personal information based on your
          consent, performance of a contract, legitimate interests in operating our
          business, or compliance with applicable law.
        </p>
      </LegalSection>

      <LegalSection title="5. Sharing of information">
        <p>
          We do not sell your personal information. We may share data with trusted
          service providers who help us host our website, send email, process
          analytics, or operate our booking systems. These providers are permitted to
          use your information only as needed to perform services on our behalf and
          must protect it appropriately.
        </p>
        <p>
          We may also disclose information if required by law, to protect our rights,
          or in connection with a merger, acquisition, or asset sale.
        </p>
      </LegalSection>

      <LegalSection title="6. International transfers">
        <p>
          Our services are operated from South Korea. If you access our website from
          outside Korea, your information may be transferred to, stored in, or
          processed in Korea or other countries where our service providers operate.
        </p>
      </LegalSection>

      <LegalSection title="7. Data retention">
        <p>
          We retain personal information only for as long as necessary to fulfill the
          purposes described in this policy, unless a longer retention period is
          required or permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          Depending on applicable law, you may have the right to access, correct,
          delete, or restrict the processing of your personal information, or to
          withdraw consent where processing is consent-based. To make a request,
          contact us at{" "}
          <a
            href="mailto:hello@thewellnesskorea.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            hello@thewellnesskorea.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          We may use cookies and similar technologies to remember preferences, measure
          site performance, and improve user experience. You can control cookies
          through your browser settings, though some features may not function
          properly if cookies are disabled.
        </p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>
          Our services are not directed to children under 16. We do not knowingly
          collect personal information from children. If you believe a child has
          provided us with personal information, please contact us so we can delete it.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the
          revised version on this page and update the &quot;Last updated&quot; date above.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          For privacy-related questions, contact:{" "}
          <a
            href="mailto:hello@thewellnesskorea.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            hello@thewellnesskorea.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
