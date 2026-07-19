import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { ModalProvider } from './context/ModalContext'
import { TransactionProvider } from './context/TransactionContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import PlatformSessionPage from './pages/PlatformSessionPage'
import PlatformPathRedirect from './pages/PlatformPathRedirect'
import DepositPage from './pages/DepositPage'
import WithdrawPage from './pages/WithdrawPage'
import AdminPage from './pages/AdminPage'
import BpexchRedirectPage from './pages/BpexchRedirectPage'
import NativeWalletApp, { shouldUseNativeWalletApp } from './mobile/NativeWalletApp'

function WebsiteApp() {
  return (
    <BrowserRouter>
      <ModalProvider>
        <TransactionProvider>
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
        </TransactionProvider>
      </ModalProvider>
    </BrowserRouter>
  )
}

export default function App() {
  // Capacitor APK = wallet screens only (not the marketing website)
  if (shouldUseNativeWalletApp() || Capacitor.isNativePlatform()) {
    return <NativeWalletApp />
  }
  return <WebsiteApp />
}
