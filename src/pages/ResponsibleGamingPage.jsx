import SeoHead from '../components/SeoHead'
import LegalPageLayout from '../components/LegalPageLayout'
import { useResponsibleGamingContent } from '../context/ResponsibleGamingContentContext'
import { SITE_URL } from '../config/brand'

function Section({ title, children, light = false }) {
  return (
    <section>
      <h2
        className={
          light
            ? 'text-lg font-bold text-slate-900 sm:text-xl'
            : 'text-lg font-bold text-text sm:text-xl'
        }
      >
        {title}
      </h2>
      <div
        className={
          light
            ? 'mt-3 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base'
            : 'mt-3 space-y-3 text-sm leading-relaxed text-muted sm:text-base'
        }
      >
        {children}
      </div>
    </section>
  )
}

export default function ResponsibleGamingPage() {
  const { seo, page, sections } = useResponsibleGamingContent()

  return (
    <LegalPageLayout
      title={page.title}
      intro={page.intro}
      lastUpdated={page.lastUpdated}
      badge={page.badge}
      theme="light"
    >
      <SeoHead
        title={seo.metaTitle}
        description={seo.metaDescription}
        keywords={seo.metaKeywords}
        canonicalPath="/responsible-gaming"
        ogTitle={seo.metaTitle}
        ogDescription={seo.metaDescription}
        twitterTitle={seo.metaTitle}
        twitterDescription={seo.metaDescription}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: seo.metaTitle,
          url: `${SITE_URL}/responsible-gaming`,
          description: seo.metaDescription,
        }}
      />

      {sections.map((section) => (
        <Section key={section.title} title={section.title} light>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets?.length ? (
            <ul className="ml-5 list-disc space-y-2">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </Section>
      ))}
    </LegalPageLayout>
  )
}
