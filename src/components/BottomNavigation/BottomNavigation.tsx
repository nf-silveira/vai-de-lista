import { NavLink } from 'react-router-dom'
import styles from './BottomNavigation.module.css'

interface NavigationItem {
  to: string
  label: string
  icon: 'list' | 'history' | 'compare' | 'settings'
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { to: '/', label: 'Lista', icon: 'list' },
  { to: '/historico', label: 'Histórico', icon: 'history' },
  { to: '/comparar', label: 'Comparar', icon: 'compare' },
  { to: '/configuracoes', label: 'Ajustes', icon: 'settings' },
]

function NavigationIcon({ name }: { name: NavigationItem['icon'] }) {
  if (name === 'list') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    )
  }

  if (name === 'history') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    )
  }

  if (name === 'compare') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17V9M12 17V5M17 17v-4" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  )
}

export function BottomNavigation() {
  return (
    <nav className={styles.navigation} aria-label="Navegação principal">
      {NAVIGATION_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <NavigationIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
