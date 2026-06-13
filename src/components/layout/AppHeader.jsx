import s from './AppHeader.module.css'

export default function AppHeader({ onBurgerClick, menuOpen }) {
  return (
    <header className={s.header}>
      <div className={s.brand}>
        <i className="fa-solid fa-book-open" aria-hidden="true" />
        <span className={s.brandName}>Quadro Online</span>
      </div>
      <button
        className={s.burger}
        onClick={onBurgerClick}
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
      >
        <i className="fa-solid fa-bars" aria-hidden="true" />
      </button>
    </header>
  )
}
