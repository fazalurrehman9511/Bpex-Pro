import { Navigate, useLocation } from 'react-router-dom'
import { repairPublicLocation } from '../utils/platformPaths'

/** Redirect legacy BPEXCH-style URLs to /dashboard or /login */
export default function PlatformPathRedirect() {
  const location = useLocation()
  const target = repairPublicLocation(location.pathname)

  if (target === location.pathname) {
    return <Navigate to="/" replace />
  }

  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}
