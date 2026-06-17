import type { Metadata } from "next"
import { LegalPageLayout, LegalSection } from "@/components/legal/legal-page-layout"

export const metadata: Metadata = {
  title: "Terms of Use — The Wellness Korea",
  description: "Terms and conditions for using The Wellness Korea website and services.",
}

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Use" updated="June 16, 2026">
      <LegalSection title="1. Agreement">
        <p>
          By accessing or using thewellnesskorea.com and related services operated by
          The Wellness Korea (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you
          agree to these Terms of Use. If you do not agree, please do not use our
          website or services.
        </p>
      </LegalSection>

      <LegalSection title="2. Services">
        <p>
          We provide information about K-Wellness programs, schedules, instructors,
          and cultural experiences at Brickwell in Seochon, Seoul. Program
          availability, pricing, and schedules may change without notice. Participation
          in any in-person program is subject to separate booking terms communicated
          at the time of reservation.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and eligibility">
        <p>
          Certain features, including instructor and administrator portals, require an
          account. You are responsible for maintaining the confidentiality of your
          login credentials and for all activity under your account. You must provide
          accurate information and promptly update it if it changes.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the website for unlawful, harmful, or fraudulent purposes</li>
          <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
          <li>Interfere with the proper functioning or security of the website</li>
          <li>Copy, scrape, or redistribute content without our prior written consent</li>
          <li>Misrepresent your identity or affiliation with The Wellness Korea</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Intellectual property">
        <p>
          All content on this website — including text, images, branding, design, and
          program materials — is owned by or licensed to The Wellness Korea and is
          protected by applicable intellectual property laws. You may view content for
          personal, non-commercial use only unless we grant written permission
          otherwise.
        </p>
      </LegalSection>

      <LegalSection title="6. Wellness disclaimer">
        <p>
          Our programs are designed for general wellness, cultural education, and
          restorative experiences. They are not medical treatment, psychotherapy, or a
          substitute for professional healthcare. Consult a qualified healthcare
          provider before participating if you have medical conditions, injuries, or
          pregnancy-related concerns.
        </p>
        <p>
          Participation is at your own risk. You are responsible for disclosing relevant
          health information to instructors when requested.
        </p>
      </LegalSection>

      <LegalSection title="7. Bookings and cancellations">
        <p>
          When booking becomes available, specific cancellation, refund, and
          rescheduling policies will be presented at checkout or in your confirmation
          email. Until then, inquiries about visits may be handled on a case-by-case
          basis through our contact channels.
        </p>
      </LegalSection>

      <LegalSection title="8. Third-party links">
        <p>
          Our website may contain links to third-party websites or services. We are not
          responsible for the content, policies, or practices of those third parties.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimer of warranties">
        <p>
          The website and services are provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. To the fullest extent permitted by law, we disclaim all
          warranties, express or implied, including merchantability, fitness for a
          particular purpose, and non-infringement.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
        <p>
          To the fullest extent permitted by law, The Wellness Korea and its directors,
          employees, partners, and instructors shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use
          of the website or participation in our programs. Our total liability for any
          claim shall not exceed the amount you paid us for the relevant service in the
          twelve months preceding the claim, or KRW 100,000 if no payment was made.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing law">
        <p>
          These Terms are governed by the laws of the Republic of Korea, without regard
          to conflict-of-law principles. Disputes shall be subject to the exclusive
          jurisdiction of the courts located in Seoul, South Korea, unless mandatory
          consumer protection laws in your country provide otherwise.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes">
        <p>
          We may revise these Terms at any time by posting an updated version on this
          page. Continued use of the website after changes become effective constitutes
          acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Questions about these Terms:{" "}
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
