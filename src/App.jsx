import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { ModalProvider } from './context/ModalContext'
import { TransactionProvider } from './context/TransactionContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import { shouldUseNativeWalletApp } from './mobile/nativeAppDetect'

const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const PlatformSessionPage = lazy(() => import('./pages/PlatformSessionPage'))
const PlatformPathRedirect = lazy(() => import('./pages/PlatformPathRedirect'))
const DepositPage = lazy(() => import('./pages/DepositPage'))
const WithdrawPage = lazy(() => import('./pages/WithdrawPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const BpexchRedirectPage = lazy(() => import('./pages/BpexchRedirectPage'))
const NativeWalletApp = lazy(() => import('./mobile/NativeWalletApp'))

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-navy text-sm text-muted" role="status">
      Loading…
    </div>
  )
}

function WebsiteApp() {
  return (
    <BrowserRouter>
      <ModalProvider>
        <TransactionProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/bpexch/*" element={<BpexchRedirectPage />} />
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                {/* Same layout keeps one BPEXCH iframe across login → dashboard */}
                <Route element={<PlatformSessionPage />}>
                  <Route path="/login" element={<></>} />
                  <Route path="/dashboard" element={<></>} />
                </Route>
                <Route path="/deposit" element={<DepositPage />} />
                <Route path="/withdraw" element={<WithdrawPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/*" element={<PlatformPathRedirect />} />
              </Route>
            </Routes>
          </Suspense>
        </TransactionProvider>
      </ModalProvider>
    </BrowserRouter>
  )
}

export default function App() {
  // Capacitor APK = wallet screens only (not the marketing website)
  if (shouldUseNativeWalletApp() || Capacitor.isNativePlatform()) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <NativeWalletApp />
      </Suspense>
    )
  }
  return <WebsiteApp />
}
