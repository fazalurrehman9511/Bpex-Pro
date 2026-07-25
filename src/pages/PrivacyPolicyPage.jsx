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

export default function PrivacyPolicyPage() {
  const title = `Privacy Policy | ${BRAND_NAME}`
  const description =
    'Read how BpxPro collects, uses and stores account details, contact submissions, transaction data, cookies and local device data across the website and app.'

  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro={`${BRAND_NAME}, also searched as ${BRAND_ALIAS_TEXT}, provides registration, support, payment coordination and betting platform access. This page explains what information we collect, how we use it and how we handle account-related data on the website and app.`}
      lastUpdated={LAST_UPDATED}
    >
      <SeoHead
        title={title}
        description={description}
        canonicalPath="/privacy-policy"
        ogTitle={title}
        ogDescription={description}
        twitterTitle={title}
        twitterDescription={description}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          url: `${SITE_URL}/privacy-policy`,
          description,
        }}
      />

      <Section title="1. Information We Collect">
        <p>
          We may collect the information you provide directly when you register, contact support,
          submit a payment request or use account-related features. This can include your name,
          phone number, email address, username, password, country selection and messages you send
          through forms or WhatsApp support channels.
        </p>
        <p>
          We also collect transaction-related details you submit through the website or app, such as
          deposit or withdrawal requests, payment method selection, screenshots or proof you share,
          available balance data and account notes needed to process support requests.
        </p>
      </Section>

      <Section title="2. Data Stored on Your Device">
        <p>
          The website and app use browser or device storage, including local storage, session
          storage and cookies, to keep you signed in, remember usernames, keep transaction state,
          preserve temporary interface messages and support embedded dashboard access.
        </p>
        <p>
          If you use the Android app or embedded platform access, technical session tokens and
          authentication cookies may also be created so the dashboard or account area can function
          correctly.
        </p>
      </Section>

      <Section title="3. How We Use Information">
        <p>We use collected information to:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Create or help manage your account</li>
          <li>Connect you with the correct WhatsApp agent or support contact</li>
          <li>Process registration, deposit and withdrawal-related requests</li>
          <li>Respond to contact messages and account support inquiries</li>
          <li>Maintain login sessions and improve platform reliability</li>
          <li>Prevent misuse, duplicate registrations, fraud or unauthorized access</li>
        </ul>
      </Section>

      <Section title="4. Embedded Platforms and Third-Party Services">
        <p>
          Some account actions may involve embedded or connected betting platform services. When you
          access those services through our website or app, session cookies, technical identifiers
          or account information may be exchanged as needed to open the dashboard, verify login or
          sync balances and account status.
        </p>
        <p>
          We may also use infrastructure or hosting providers needed to run the site, API, media
          uploads, app delivery and contact workflows.
        </p>
      </Section>

      <Section title="5. Sharing of Information">
        <p>
          We may share relevant account and support information with internal operators, support
          staff, admins, payment handling personnel or connected platform providers when necessary to
          register your account, process transactions, verify your identity, investigate issues or
          provide support.
        </p>
        <p>
          We do not publish your personal information publicly through the website. We may disclose
          information when required to comply with law, enforce platform rules or protect the
          security of the service, our staff or other users.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We keep information for as long as needed for operational, support, security, transaction
          tracking and recordkeeping purposes. Contact form submissions, account records and
          transaction requests may remain in our systems after completion where needed for support,
          dispute handling, audit history or fraud prevention.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          We take reasonable steps to protect stored information, but no website, browser storage,
          network or messaging system can guarantee complete security. You are responsible for
          keeping your login credentials private and for contacting support quickly if you believe
          your account has been accessed without authorization.
        </p>
      </Section>

      <Section title="8. Children">
        <p>
          This website and app are intended only for adults. Users must be 18 or older. We do not
          knowingly offer services to children.
        </p>
      </Section>

      <Section title="9. Your Choices">
        <p>
          You can contact support if you need help updating contact details, reviewing account
          information or closing access. You can also clear browser storage or log out of your
          account, although doing so may remove saved session data on your device.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Updated versions will be posted on
          this page with a revised last updated date.
        </p>
      </Section>
    </LegalPageLayout>
  )
}
