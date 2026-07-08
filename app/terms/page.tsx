import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms and Conditions — Ari Books",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" updated="July 8, 2026">
      <LegalSection heading="1. Acceptance of Terms">
        <p>
          By creating an Ari Books account or using any part of the service,
          you agree to be bound by these Terms and Conditions. If you are
          accepting on behalf of a company, you represent that you have
          authority to bind that company.
        </p>
      </LegalSection>

      <LegalSection heading="2. The Service">
        <p>
          Ari Books provides cloud accounting software for US businesses,
          including a double-entry general ledger, invoicing, bill tracking,
          bank feeds, and financial reporting. Ari Books is a software tool —
          it does not provide accounting, tax, or legal advice. You are
          responsible for reviewing your books and filings with a qualified
          professional.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your Account">
        <p>
          You must provide accurate registration information and keep your
          credentials secure. You are responsible for all activity under your
          account. Notify us immediately of any unauthorized use.
        </p>
      </LegalSection>

      <LegalSection heading="4. Subscription and Billing">
        <p>
          Paid plans are billed monthly in advance. Every plan includes a
          30-day free trial; no credit card is required to start. You may
          cancel at any time from Settings — cancellation takes effect at the
          end of the current billing period and no partial refunds are issued
          except where required by law. Prices may change with at least 30
          days&apos; notice.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your Data">
        <p>
          You own your financial data. We process it only to operate the
          service, as described in our Privacy Policy. You can export your
          data at any time. If your account is closed, we retain your books
          for 90 days so you can retrieve them, after which they are deleted
          from production systems.
        </p>
      </LegalSection>

      <LegalSection heading="6. Acceptable Use">
        <p>
          You may not use Ari Books to violate any law, infringe intellectual
          property, transmit malware, attempt to access other customers&apos;
          data, or resell the service without written permission.
        </p>
      </LegalSection>

      <LegalSection heading="7. Availability and Support">
        <p>
          We target 99.9% monthly uptime, excluding scheduled maintenance.
          Support is provided by email and in-app chat during US business
          hours.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers and Limitation of Liability">
        <p>
          The service is provided &quot;as is&quot; without warranties of any
          kind. To the maximum extent permitted by law, Ari Books&apos; total
          liability for any claim is limited to the amounts you paid us in the
          twelve months preceding the claim. We are not liable for indirect,
          incidental, or consequential damages, including tax penalties
          arising from the use of the software.
        </p>
      </LegalSection>

      <LegalSection heading="9. Termination">
        <p>
          You may close your account at any time. We may suspend or terminate
          accounts that violate these terms, with notice where practicable.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to These Terms">
        <p>
          We may update these terms from time to time. Material changes will
          be announced by email or in-app at least 30 days before taking
          effect. Continued use after the effective date constitutes
          acceptance.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>
          Questions about these terms: <strong>legal@aribooks.com</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
