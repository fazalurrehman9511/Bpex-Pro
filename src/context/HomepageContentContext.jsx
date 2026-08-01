import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  getHomepageContent,
  loadHomepageContent,
} from '../data/homepageContent'

const HomepageContentContext = createContext(getHomepageContent())

export function HomepageContentProvider({ children }) {
  const [content, setContent] = useState(() => getHomepageContent())

  const refreshContent = useCallback(async () => {
    const next = await loadHomepageContent()
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

  return (
    <HomepageContentContext.Provider value={content}>
      {children}
    </HomepageContentContext.Provider>
  )
}

export function useHomepageContent() {
  return useContext(HomepageContentContext)
}
