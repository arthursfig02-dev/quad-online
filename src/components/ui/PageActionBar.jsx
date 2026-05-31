import { useState, useEffect, useRef } from 'react'
import s from './PageActionBar.module.css'

export default function PageActionBar({ actions = [], unsaved = false }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetRef = useRef(null)
  const fabRef   = useRef(null)

  // Fecha ao clicar fora — exclui o próprio FAB da verificação
  // (o FAB tem seu próprio onClick que cuida do toggle)
  useEffect(() => {
    if (!sheetOpen) return
    function onPointerDown(e) {
      const clickedSheet = sheetRef.current?.contains(e.target)
      const clickedFab   = fabRef.current?.contains(e.target)
      if (!clickedSheet && !clickedFab) {
        setSheetOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [sheetOpen])

  // Fecha ao pressionar Esc
  useEffect(() => {
    if (!sheetOpen) return
    function onKey(e) { if (e.key === 'Escape') setSheetOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  function handleAction(onClick) {
    setSheetOpen(false)
    onClick?.()
  }

  return (
    <>
      {/* ── DESKTOP: barra fixa no topo ─────────────────── */}
      <div className={s.bar}>
        {unsaved && <span className={s.badge}>● não salvo</span>}
        {actions.map(({ id, icon, label, onClick }) => (
          <button key={id} className={s.btn} onClick={onClick} title={label}>
            <i className={`fa-solid ${icon}`} aria-hidden="true" />
            <span className={s.label}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── MOBILE: FAB + bottom sheet ───────────────────── */}
      <div className={s.mobileArea}>

        {/* Overlay — clique nele fecha o sheet */}
        {sheetOpen && (
          <div
            className={s.overlay}
            aria-hidden="true"
            onPointerDown={() => setSheetOpen(false)}
          />
        )}

        {/* Bottom sheet */}
        <div
          ref={sheetRef}
          className={`${s.sheet} ${sheetOpen ? s.sheetOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Ações da página"
        >
          <div className={s.sheetHandle} />
          <p className={s.sheetTitle}>
            {unsaved && <span className={s.sheetBadge}>● não salvo</span>}
            Ações
          </p>
          <ul className={s.sheetList}>
            {actions.map(({ id, icon, label, onClick }) => (
              <li key={id}>
                <button
                  className={s.sheetItem}
                  onClick={() => handleAction(onClick)}
                >
                  <span className={s.sheetIcon}>
                    <i className={`fa-solid ${icon}`} aria-hidden="true" />
                  </span>
                  <span className={s.sheetLabel}>{label}</span>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: '#9aa3c7' }} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* FAB — ref própria para excluir da detecção de "clicou fora" */}
        <button
          ref={fabRef}
          className={`${s.fab} ${sheetOpen ? s.fabOpen : ''}`}
          onClick={() => setSheetOpen(o => !o)}
          aria-label={sheetOpen ? 'Fechar ações' : 'Abrir ações'}
          aria-expanded={sheetOpen}
        >
          <i className={`fa-solid ${sheetOpen ? 'fa-xmark' : 'fa-ellipsis-vertical'}`} />
        </button>
      </div>
    </>
  )
}
