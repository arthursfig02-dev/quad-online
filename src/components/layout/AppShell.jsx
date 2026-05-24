import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import AppFooter from './AppFooter'
import SideMenu  from './SideMenu'
import s from './AppShell.module.css'

const MOBILE_BP = 900  // px — breakpoint mobile/desktop

export default function AppShell() {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP)

  // Menu aberto por padrão em desktop na página inicial, fechado nas demais
  const [menuOpen, setMenuOpen] = useState(
    () => window.innerWidth >= MOBILE_BP && location.pathname === '/'
  )

  /* Detecta redimensionamento */
  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < MOBILE_BP
      setIsMobile(mobile)
      // Ao passar para desktop, garante que o menu inicia no estado ícones
      if (!mobile && !menuOpen) setMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [menuOpen])

  /* Em desktop, a largura do menu afeta o margin-left do conteúdo */
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
      >
        <main className={s.main}>
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  )
}
