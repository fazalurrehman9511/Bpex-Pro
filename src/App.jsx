import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { ModalProvider } from './context/ModalContext'
import { TransactionProvider } from './context/TransactionContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import { shouldUseNativeWalletApp } from './mobile/nativeAppDetect'

const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const BrandGuideSlugPage = lazy(() => import('./pages/BrandGuideSlugPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'))
const ResponsibleGamingPage = lazy(() => import('./pages/ResponsibleGamingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
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
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
                <Route path="/responsible-gaming" element={<ResponsibleGamingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/deposit" element={<DepositPage />} />
                <Route path="/withdraw" element={<WithdrawPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/:brandSlug" element={<BrandGuideSlugPage />} />
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
