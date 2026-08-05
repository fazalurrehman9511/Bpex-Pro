import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  getResponsibleGamingContent,
  loadResponsibleGamingContent,
} from '../data/responsibleGamingContent'

const ResponsibleGamingContentContext = createContext(getResponsibleGamingContent())

export function ResponsibleGamingContentProvider({ children }) {
  const [content, setContent] = useState(() => getResponsibleGamingContent())

  const refreshContent = useCallback(async () => {
    const next = await loadResponsibleGamingContent()
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
    const onUpdated = () => {
      setContent(getResponsibleGamingContent())
      refreshContent()
    }
    window.addEventListener('responsible-gaming-content-updated', onUpdated)
    return () => window.removeEventListener('responsible-gaming-content-updated', onUpdated)
  }, [refreshContent])

  return (
    <ResponsibleGamingContentContext.Provider value={content}>
      {children}
    </ResponsibleGamingContentContext.Provider>
  )
}

export function useResponsibleGamingContent() {
  return useContext(ResponsibleGamingContentContext)
}
