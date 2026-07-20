import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { HeaderBar } from '../components/Header'
import MarqueeTicker from '../components/MarqueeTicker'
import Footer from '../components/Footer'
import BottomNav from '../components/BottomNav'
import RegistrationModal from '../components/RegistrationModal'
import { isPlatformEmbedRoute } from '../utils/platformPaths'

const FloatingWhatsApp = lazy(() => import('../components/FloatingWhatsApp'))
const InstallPrompt = lazy(() => import('../components/InstallPrompt'))

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
      <div className="fixed inset-0 flex flex-col bg-navy overflow-hidden">
        <main id="main-content" className="flex flex-1 flex-col min-h-0 min-w-0">
          <Outlet />
        </main>
        <RegistrationModal />
      </div>
    )
  }

  return (
    <div className={`flex min-h-screen flex-col bg-navy ${isBlogPost ? '' : 'pb-[4.5rem] sm:pb-0'}`}>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <HeaderBar />
      {location.pathname === '/' && <MarqueeTicker />}
      <main id="main-content" className="flex flex-1 flex-col min-h-0">
        <Outlet />
      </main>
      {!isBlogPost && <Footer />}
      {!isBlogPost && <BottomNav />}
      <Suspense fallback={null}>
        {!isBlogPost && <InstallPrompt />}
        <FloatingWhatsApp />
      </Suspense>
      <RegistrationModal />
    </div>
  )
}
