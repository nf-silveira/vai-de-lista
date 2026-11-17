import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader/AppHeader'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { signOut, useSession } from '../lib/auth-client'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className={styles.shell}>
      <AppHeader
        userName={session?.user.name}
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
