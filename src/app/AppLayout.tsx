import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader/AppHeader'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { resetAccountCache, useAccount } from '../lib/account'
import { signOut, useSession } from '../lib/auth-client'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { data: session } = useSession()
  const { account } = useAccount()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      await signOut()
      resetAccountCache()
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className={styles.shell}>
      <AppHeader
        userName={session?.user.name}
        isAdmin={account?.role === 'admin'}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}
