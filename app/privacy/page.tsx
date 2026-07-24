import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Privacy Policy — Curo",
  description: "How Curo collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="24 July 2026">
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy explains how Curo (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses,
        shares, and protects your personal data when you use our booking platform. We are committed
        to handling your data — including health-related information — lawfully, transparently, and
        with care.
      </p>

      <h2>2. Data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> your name, email address, and (optionally) phone number.</li>
        <li><strong>Booking data:</strong> the doctor and time you book, your booking reference, and status.</li>
        <li><strong>Health-related data:</strong> the &ldquo;reason for visit&rdquo; you optionally provide when booking. This is treated as sensitive data (see section 4).</li>
        <li><strong>Technical data:</strong> basic session and device information needed to keep you signed in and to operate the Service securely.</li>
      </ul>

      <h2>3. How we use your data and our lawful basis</h2>
      <ul>
        <li><strong>To provide the Service</strong> — creating your account and processing your bookings (basis: performance of a contract).</li>
        <li><strong>To communicate with you</strong> — sending booking confirmations and essential service messages (basis: contract / legitimate interests).</li>
        <li><strong>To keep the Service secure</strong> — preventing fraud and abuse (basis: legitimate interests).</li>
        <li><strong>Health-related data</strong> is processed only to pass the context of your visit to the doctor you book (basis: your explicit consent).</li>
      </ul>

      <h2>4. Health data and explicit consent</h2>
      <p>
        Information about your health is a special category of personal data. We only collect the
        optional &ldquo;reason for visit&rdquo; you choose to enter, and we use it solely to share
        that context with the doctor or clinic you book. By entering this information you give your
        explicit consent to that use. You may leave it blank, and you may withdraw consent by
        deleting the booking.
      </p>

      <h2>5. Who we share data with</h2>
      <ul>
        <li><strong>The doctor or clinic you book</strong> receives your name, contact number, appointment time, and reason for visit — the information they need to see you.</li>
        <li><strong>Our infrastructure providers</strong> (for hosting, database, and authentication) process data on our behalf under strict confidentiality, solely to run the Service.</li>
        <li><strong>Legal authorities</strong>, only where we are required by law to disclose information.</li>
      </ul>
      <p>We never sell your personal data.</p>

      <h2>6. Data retention</h2>
      <p>
        We keep your data only as long as necessary to provide the Service and to meet legal
        obligations. You can delete individual bookings at any time, and you can request deletion of
        your account and associated data (see section 8).
      </p>

      <h2>7. How we protect your data</h2>
      <p>
        Access to your data is restricted at the database level, so patients can only see their own
        records and doctors can only see their own appointments. Data is encrypted in transit, and
        access is controlled through authenticated sessions.
      </p>

      <h2>8. Your rights</h2>
      <p>Subject to applicable law, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> the personal data we hold about you.</li>
        <li><strong>Rectify</strong> inaccurate or incomplete data.</li>
        <li><strong>Erase</strong> your data (&ldquo;right to be forgotten&rdquo;).</li>
        <li><strong>Restrict</strong> or <strong>object</strong> to certain processing.</li>
        <li><strong>Port</strong> your data to another service.</li>
        <li><strong>Withdraw consent</strong> for health-data processing at any time.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:privacy@curo.demo">privacy@curo.demo</a>.
      </p>

      <h2>9. Cookies and sessions</h2>
      <p>
        We use only the essential cookies needed to keep you signed in and to operate the Service
        securely. We do not use advertising or third-party tracking cookies.
      </p>

      <h2>10. International transfers</h2>
      <p>
        Where data is processed outside your country, we take steps to ensure it receives an
        equivalent level of protection through appropriate safeguards.
      </p>

      <h2>11. Children</h2>
      <p>
        Curo is not directed at children under 18. Bookings for minors should be made and managed by
        a parent or guardian.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this Policy from time to time. Material changes will be notified through the
        Service, and the &ldquo;last updated&rdquo; date above will reflect the revision.
      </p>

      <h2>13. Contact</h2>
      <p>
        For any privacy question, or to reach our data protection contact, email{" "}
        <a href="mailto:privacy@curo.demo">privacy@curo.demo</a>.
      </p>
    </LegalPage>
  );
}
