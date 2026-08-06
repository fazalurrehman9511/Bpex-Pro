import { Navigate, useParams } from 'react-router-dom'
import { useBrandGuideContent } from '../context/BrandGuideContentContext'
import {
  getBrandGuidePath,
  matchBrandGuideSlug,
  normalizeBrandGuideSlug,
} from '../data/brandGuideContent'
import BrandAliasesPage from './BrandAliasesPage'
import PlatformPathRedirect from './PlatformPathRedirect'

/** Resolves CMS brand guide slug + legacy redirects for single-segment paths. */
export default function BrandGuideSlugPage() {
  const { brandSlug } = useParams()
  const content = useBrandGuideContent()
  const segment = normalizeBrandGuideSlug(brandSlug, '')
  const match = matchBrandGuideSlug(segment, content)

  if (match === 'page') return <BrandAliasesPage />
  if (match === 'redirect') return <Navigate to={getBrandGuidePath(content)} replace />
  return <PlatformPathRedirect />
}
