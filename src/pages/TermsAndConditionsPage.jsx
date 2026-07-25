import SeoHead from '../components/SeoHead'
import LegalPageLayout from '../components/LegalPageLayout'
import { BRAND_ALIAS_TEXT, BRAND_NAME, SITE_URL } from '../config/brand'

const LAST_UPDATED = 'July 25, 2026'

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-text sm:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted sm:text-base">{children}</div>
    </section>
  )
}

export default function TermsAndConditionsPage() {
  const title = `Terms & Conditions | ${BRAND_NAME}`
  const description =
    'Read the terms for using BpxPro, including registration, account responsibility, deposits, withdrawals, support workflows, age restrictions and acceptable use.'

  return (
    <LegalPageLayout
      title="Terms & Conditions"
      intro={`${BRAND_NAME}, also searched as ${BRAND_ALIAS_TEXT}, offers website, app, registration, support and betting-platform access services. By using the website, app or support flows, you agree to these Terms & Conditions.`}
      lastUpdated={LAST_UPDATED}
    >
      <SeoHead
        title={title}
        description={description}
        canonicalPath="/terms-and-conditions"
        ogTitle={title}
        ogDescription={description}
        twitterTitle={title}
        twitterDescription={description}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          url: `${SITE_URL}/terms-and-conditions`,
          description,
        }}
      />

      <Section title="1. Eligibility">
        <p>
          You must be at least 18 years old to use this website, app or related support services.
          By using the service, you confirm that you are legally allowed to access it in your
          location and that you are responsible for complying with local laws and restrictions.
        </p>
      </Section>

      <Section title="2. Nature of the Service">
        <p>
          {BRAND_NAME} provides registration, support, transaction coordination, app access and
          connected betting-platform access. Some parts of the experience may rely on embedded or
          linked third-party betting systems, account agents, payment operators or support staff.
        </p>
        <p>
          Availability of markets, dashboard access, payment handling, bonuses, limits and support
          responses may change at any time.
        </p>
      </Section>

      <Section title="3. Account Information and Security">
        <p>
          You are responsible for providing accurate registration and contact information. You are
          also responsible for maintaining the confidentiality of your username, password, device
          access and any login links or OTP-style verification you receive.
        </p>
        <p>
          You must notify support promptly if you believe your account, device or login credentials
          have been compromised.
        </p>
      </Section>

      <Section title="4. Deposits, Withdrawals and Payment Requests">
        <p>
          Deposit and withdrawal requests are subject to review, confirmation and operational
          processing. Processing times can vary depending on payment method, verification status,
          support load, network conditions or third-party service availability.
        </p>
        <p>
          You must send payments only through official instructions provided by the website or the
          authorized support/agent flow. Sending funds to unofficial contacts, wrong wallet
          networks, incorrect account numbers or unverified third parties is your responsibility.
        </p>
      </Section>

      <Section title="5. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Use false identity details or impersonate another person</li>
          <li>Attempt unauthorized access to accounts, systems or admin areas</li>
          <li>Abuse promotions, payment workflows, support staff or dispute processes</li>
          <li>Use bots, scraping tools or attacks that harm site performance or security</li>
          <li>Register or operate accounts on behalf of minors</li>
        </ul>
      </Section>

      <Section title="6. Suspensions and Refusals">
        <p>
          We may suspend, limit or refuse access, support, transactions or account-related actions
          if we believe there is a security issue, policy violation, fraud risk, abusive conduct,
          duplicate activity, false information or legal/regulatory concern.
        </p>
      </Section>

      <Section title="7. No Guarantee of Availability or Results">
        <p>
          We do not guarantee uninterrupted access to the website, app, dashboard, betting markets,
          payment methods, WhatsApp support or any specific features. Odds, balances, availability,
          interfaces and market listings may change without notice.
        </p>
        <p>
          Betting involves financial risk. You are solely responsible for your betting decisions,
          bankroll management and losses.
        </p>
      </Section>

      <Section title="8. Responsible Gambling">
        <p>
          Betting should be used responsibly. If you believe gambling is becoming harmful, stop
          using the service and contact support to request limits, account restrictions or a break
          from access where available.
        </p>
      </Section>

      <Section title="9. Intellectual Property and Content">
        <p>
          Website content, branding, layout, copy, logos and downloadable assets remain the property
          of the platform or its licensors unless otherwise stated. You may not reproduce, resell or
          redistribute protected content without permission.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, the website, app and related services
          are provided on an as available basis. We are not liable for indirect, incidental,
          consequential or speculative losses arising from downtime, delayed support, payment
          mistakes, device issues, third-party services, market outcomes or unauthorized access that
          occurs outside our reasonable control.
        </p>
      </Section>

      <Section title="11. Changes to These Terms">
        <p>
          We may update these Terms & Conditions from time to time. Continued use of the website,
          app or support services after updates means you accept the revised terms.
        </p>
      </Section>
    </LegalPageLayout>
  )
}
