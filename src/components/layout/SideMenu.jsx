import { NavLink, useNavigate } from 'react-router-dom'
import s from './SideMenu.module.css'

const NAV_ITEMS = [
  { to: '/',                icon: 'fa-house',      label: 'Início'            },
  { to: '/vida-ministerio', icon: 'fa-book-bible', label: 'Vida e Ministério' },
  { to: '/reuniao-publica', icon: 'fa-person-chalkboard', label: 'Reunião Pública' },
]

/**
 * SideMenu
 *
 * open         → bool — menu aberto?
 * onClose      → fn   — fecha o menu (mobile)
 * onToggle     → fn   — alterna aberto/fechado (desktop)
 * isMobile     → bool — estamos em tela < 900px?
 */
export default function SideMenu({ open, onClose, onToggle, isMobile }) {
  const navigate = useNavigate()

  function handleNavClick(to) {
    navigate(to)
    // Em qualquer tamanho recolhe ao navegar
    if (isMobile) {
      onClose()
    } else {
      // Desktop: recolhe para modo ícones
      if (open) onToggle()
    }
  }

  return (
    <>
      {/* Overlay escuro — apenas mobile */}
      {isMobile && open && (
        <div className={s.overlay} onClick={onClose} aria-hidden="true" />
      )}

      <nav
        className={[
          s.menu,
          open ? s.open : s.closed,
          isMobile ? s.mobile : s.desktop,
        ].join(' ')}
        aria-label="Menu de navegação"
      >
        {/* Botão toggle visível em desktop */}
        {!isMobile && (
          <button
            className={s.toggleBtn}
            onClick={onToggle}
            title={open ? 'Recolher menu' : 'Expandir menu'}
            aria-label={open ? 'Recolher menu' : 'Expandir menu'}
          >
            <i className={`fa-solid ${open ? 'fa-angles-left' : 'fa-angles-right'}`} />
          </button>
        )}

        <ul className={s.list}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <li key={to}>
              <button
                className={s.item}
                onClick={() => handleNavClick(to)}
                title={label}
              >
                <i className={`fa-solid ${icon} ${s.icon}`} aria-hidden="true" />
                <span className={s.label}>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
