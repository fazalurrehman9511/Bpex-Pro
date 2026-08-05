import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getBrandGuideContent, loadBrandGuideContent } from '../data/brandGuideContent'

const BrandGuideContentContext = createContext(getBrandGuideContent())

export function BrandGuideContentProvider({ children }) {
  const [content, setContent] = useState(() => getBrandGuideContent())

  const refreshContent = useCallback(async () => {
    const next = await loadBrandGuideContent()
    setContent(next)
    return next
  }, [])

  useEffect(() => {
    let cancelled = false
    refreshContent().then((next) => {
      if (!cancelled) setContent(next)
    })
    return () => {
      cancelled = true
    }
  }, [refreshContent])

  useEffect(() => {
    const retry = () => {
      refreshContent()
    }
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [refreshContent])

  useEffect(() => {
    const onUpdated = () => {
      setContent(getBrandGuideContent())
      refreshContent()
    }
    window.addEventListener('brand-guide-content-updated', onUpdated)
    return () => window.removeEventListener('brand-guide-content-updated', onUpdated)
  }, [refreshContent])

  return (
    <BrandGuideContentContext.Provider value={content}>
      {children}
    </BrandGuideContentContext.Provider>
  )
}

export function useBrandGuideContent() {
  return useContext(BrandGuideContentContext)
}
