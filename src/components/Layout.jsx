import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { HeaderBar } from '../components/Header'
import { isPlatformEmbedRoute } from '../utils/platformPaths'

const MarqueeTicker = lazy(() => import('../components/MarqueeTicker'))
const Footer = lazy(() => import('../components/Footer'))
const BottomNav = lazy(() => import('../components/BottomNav'))
const FloatingWhatsApp = lazy(() => import('../components/FloatingWhatsApp'))
const InstallPrompt = lazy(() => import('../components/InstallPrompt'))
const RegistrationModal = lazy(() => import('../components/RegistrationModal'))

export default function Layout() {
  const location = useLocation()
  const isFullscreen = isPlatformEmbedRoute(location.pathname)
  const isBlogPost = location.pathname.startsWith('/blog/') && location.pathname !== '/blog'

  useEffect(() => {
    if (!isFullscreen) window.scrollTo(0, 0)
  }, [location.pathname, isFullscreen])

  // Fullscreen embed — no FlowExch chrome, BPEXCH gets entire viewport
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-navy">
        <main id="main-content" className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
        <Suspense fallback={null}>
          <RegistrationModal />
        </Suspense>
      </div>
    )
  }

  return (
    <div className={`flex min-h-screen flex-col bg-navy ${isBlogPost ? '' : 'pb-[4.5rem] sm:pb-0'}`}>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <HeaderBar />
      {location.pathname === '/' && (
        <Suspense fallback={null}>
          <MarqueeTicker />
        </Suspense>
      )}
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <Suspense fallback={null}>
        {!isBlogPost && <Footer />}
        {!isBlogPost && <BottomNav />}
        {!isBlogPost && <InstallPrompt />}
        <FloatingWhatsApp />
        <RegistrationModal />
      </Suspense>
    </div>
  )
}
