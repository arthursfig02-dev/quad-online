import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import AppFooter from './AppFooter'
import SideMenu  from './SideMenu'
import s from './AppShell.module.css'

const MOBILE_BP = 900

export default function AppShell() {
  const location  = useLocation()
  const mainRef   = useRef()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP)
  const [menuOpen, setMenuOpen] = useState(
    () => window.innerWidth >= MOBILE_BP && location.pathname === '/'
  )

  /* Scroll ao topo a cada troca de rota */
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  /* Detecta redimensionamento */
  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < MOBILE_BP
      setIsMobile(mobile)
      if (!mobile && !menuOpen) setMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [menuOpen])

  const contentMargin = isMobile
    ? 0
    : menuOpen
      ? 'var(--shell-menu-w-open)'
      : 'var(--shell-menu-w-icons)'

  return (
    <div className={s.shell}>
      <AppHeader
        onBurgerClick={() => setMenuOpen(o => !o)}
        menuOpen={menuOpen}
      />

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onToggle={() => setMenuOpen(o => !o)}
        isMobile={isMobile}
      />

      <div
        className={s.body}
        style={{ marginLeft: contentMargin }}
        ref={mainRef}
      >
        <main className={s.main}>
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  )
}
