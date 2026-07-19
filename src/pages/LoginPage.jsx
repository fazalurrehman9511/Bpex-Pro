import PlatformEmbedPage from './PlatformEmbedPage'
import { BPEXCH_LOGIN_URL } from '../config/embed'

export default function LoginPage() {
  return (
    <PlatformEmbedPage
      src={BPEXCH_LOGIN_URL}
      title="Login"
      pageTitle="Login — BpxPro"
      redirectOnLogin
    />
  )
}
