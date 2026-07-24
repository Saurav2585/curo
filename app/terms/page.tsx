import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Terms of Service — Curo",
  description: "The terms that govern your use of Curo.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="24 July 2026">
      <h2>1. About these terms</h2>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Curo
        (the &ldquo;Service&rdquo;) — a platform that helps patients discover doctors and book
        appointment slots. By creating an account or booking through Curo, you agree to these
        Terms. If you do not agree, please do not use the Service.
      </p>

      <h2>2. What Curo is — and is not</h2>
      <p>
        Curo is a <strong>booking facilitator</strong>. We connect you with independent doctors
        and clinics and let you reserve their available appointment times. Curo does not employ
        the doctors listed, does not provide medical care, and is not a healthcare provider. The
        medical relationship is solely between you and the doctor or clinic you choose.
      </p>

      <h2>3. Eligibility and your account</h2>
      <ul>
        <li>You must be at least 18 years old, or use the Service under the supervision of a parent or guardian, to book an appointment.</li>
        <li>You are responsible for the accuracy of the information you provide, including the patient&apos;s name and contact details.</li>
        <li>You are responsible for keeping your account credentials secure and for all activity under your account.</li>
      </ul>

      <h2>4. Booking appointments</h2>
      <p>
        Availability shown in Curo is computed in real time from each doctor&apos;s schedule.
        When you confirm a slot, we reserve that specific time for you and issue a booking
        reference. A slot can be held by only one patient at a time; if a slot is taken while you
        are booking, we will offer you the nearest alternatives.
      </p>
      <p>
        A confirmed booking is a request for a consultation at the stated time. Doctors and
        clinics may, in exceptional circumstances, need to reschedule or cancel; where this
        happens we will notify you and help you rebook.
      </p>

      <h2>5. Cancellations and no-shows</h2>
      <ul>
        <li>You may cancel an upcoming appointment from your bookings page at any time before it starts.</li>
        <li>Repeated no-shows or last-minute cancellations may lead a clinic to decline future bookings.</li>
        <li>Individual clinics may operate their own cancellation windows, which will be made clear where they apply.</li>
      </ul>

      <h2>6. Fees and payment</h2>
      <p>
        Curo is free for patients to search and book. Consultation fees shown on a doctor&apos;s
        profile are set by the doctor or clinic and are <strong>payable at the clinic</strong>,
        not through Curo. Clinics may subscribe to paid Curo plans; those plan terms are set out
        on our pricing page and may change over time, though changes will not affect bookings
        already made.
      </p>

      <h2>7. Medical disclaimer</h2>
      <p>
        Curo does not provide medical advice, diagnosis, or treatment, and nothing on the Service
        should be treated as such. <strong>In an emergency, call your local emergency number or go
        to the nearest emergency department.</strong> Do not use Curo to seek urgent or emergency
        care.
      </p>

      <h2>8. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Make bookings you do not intend to keep, or book on behalf of someone without their consent.</li>
        <li>Attempt to access data belonging to other users, doctors, or clinics.</li>
        <li>Interfere with, disrupt, or reverse-engineer the Service, or use it for any unlawful purpose.</li>
      </ul>

      <h2>9. Doctors and clinics</h2>
      <p>
        Doctors and clinics are responsible for the accuracy of their listings, their availability,
        and the care they provide. Curo is not liable for the acts or omissions of any doctor or
        clinic, or for the outcome of any consultation.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        The Service, including its design, software, and content, is owned by Curo and protected by
        applicable laws. You may use the Service only as permitted by these Terms.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Curo is provided &ldquo;as is&rdquo; without
        warranties of any kind. Curo will not be liable for any indirect, incidental, or
        consequential loss arising from your use of the Service or from any consultation booked
        through it.
      </p>

      <h2>12. Suspension and termination</h2>
      <p>
        We may suspend or close an account that breaches these Terms or that is used in a way that
        harms patients, doctors, clinics, or the Service. You may close your account at any time.
      </p>

      <h2>13. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be notified through the
        Service. Continuing to use Curo after an update means you accept the revised Terms.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These Terms are governed by the laws of India, without regard to conflict-of-laws
        principles. Any disputes will be subject to the exclusive jurisdiction of the courts of
        Bengaluru, Karnataka.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:hello@curo.demo">hello@curo.demo</a>.
      </p>
    </LegalPage>
  );
}
