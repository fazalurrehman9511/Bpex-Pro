import { Navigate, useLocation } from 'react-router-dom'
import { toPublicPath } from '../utils/platformPaths'

/** /bpexch/* → clean URL without exposing bpexch in the address bar */
export default function BpexchRedirectPage() {
  const location = useLocation()
  const target = toPublicPath(location.pathname, location.search) + (location.hash || '')
  return <Navigate to={target} replace />
}
