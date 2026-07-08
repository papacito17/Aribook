import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Ari Books",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 8, 2026">
      <LegalSection heading="1. What We Collect">
        <p>
          <strong>Account data:</strong> name, email, company name, and
          password (stored as a salted hash — we never see it in plain text).
        </p>
        <p>
          <strong>Financial data:</strong> the journal entries, invoices,
          bills, and bank transactions you record or import. This data exists
          solely to run your books.
        </p>
        <p>
          <strong>Usage data:</strong> basic product analytics (pages visited,
          features used) to improve the service.
        </p>
      </LegalSection>

      <LegalSection heading="2. How We Use It">
        <p>
          We use your data to operate the service, provide support, send
          transactional emails (receipts, security alerts), and — only if you
          opted in — product updates. We do not sell your data. We do not use
          your financial data for advertising.
        </p>
      </LegalSection>

      <LegalSection heading="3. Who Can See It">
        <p>
          Your books are visible only to members of your organization,
          according to the roles you assign. Our staff access customer data
          only for support, with your permission, and every access is logged.
        </p>
        <p>
          We share data with subprocessors strictly needed to run the service
          (cloud hosting, bank data aggregation, payment processing), each
          bound by data-protection agreements.
        </p>
      </LegalSection>

      <LegalSection id="security" heading="4. Security">
        <p>
          All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).
          Access to production systems requires hardware-key MFA. Every
          organization&apos;s data is isolated with database-level row
          security, and the ledger itself is append-only with a full audit
          trail.
        </p>
      </LegalSection>

      <LegalSection heading="5. Data Retention and Deletion">
        <p>
          Your data is retained while your account is active. After account
          closure we keep your books for 90 days for retrieval, then delete
          them from production systems. You may request earlier deletion at
          any time.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your Rights">
        <p>
          You may access, correct, export, or delete your personal data at any
          time. California residents have additional rights under the CCPA,
          including the right to know and the right to non-discrimination.
          Contact us to exercise any of these rights.
        </p>
      </LegalSection>

      <LegalSection heading="7. Cookies">
        <p>
          We use only essential cookies for authentication and session
          management. We do not use third-party advertising cookies.
        </p>
      </LegalSection>

      <LegalSection heading="8. Changes to This Policy">
        <p>
          Material changes will be announced by email or in-app at least 30
          days before taking effect.
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>
          Privacy questions: <strong>privacy@aribooks.com</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
