/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react'
import s from './PageActionBar.module.css'

/**
 * PageActionBar
 *
 * unsaved:
 *   true  → badge amarelo "● não salvo"
 *   false → badge verde "✔ salvo" por 3s, depois some
 *
 * Na primeira renderização (montagem) não exibe nenhum badge.
 */
export default function PageActionBar({ actions = [], unsaved = false }) {
  const [sheetOpen,   setSheetOpen]   = useState(false)
  // 'idle' | 'unsaved' | 'saved'
  const [saveState,   setSaveState]   = useState('idle')
  const savedTimerRef = useRef(null)
  const mountedRef    = useRef(false)
  const sheetRef      = useRef(null)
  const fabRef        = useRef(null)

  /* Detecta transições de unsaved para atualizar o badge */
  useEffect(() => {
    // Ignora montagem inicial — não mostra nada
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    clearTimeout(savedTimerRef.current)

    if (unsaved) {
      setSaveState('unsaved')
    } else {
      // Acabou de salvar → mostra "salvo" por 3s depois some
      setSaveState('saved')
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 3000)
    }

    return () => clearTimeout(savedTimerRef.current)
  }, [unsaved])

  /* Fecha sheet ao clicar fora (excluindo o próprio FAB) */
  useEffect(() => {
    if (!sheetOpen) return
    function onPointerDown(e) {
      if (!sheetRef.current?.contains(e.target) && !fabRef.current?.contains(e.target)) {
        setSheetOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [sheetOpen])

  /* Fecha ao Esc */
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

  /* Badge calculado */
  const badge = saveState === 'unsaved'
    ? { label: '● não salvo', cls: s.badgeUnsaved }
    : saveState === 'saved'
    ? { label: '✔ salvo',     cls: s.badgeSaved }
    : null

  /* Badge do sheet (mobile) — igual mas compacto */
  const sheetBadge = saveState === 'unsaved'
    ? { label: '● não salvo', cls: s.sheetBadgeUnsaved }
    : saveState === 'saved'
    ? { label: '✔ salvo',     cls: s.sheetBadgeSaved }
    : null

  return (
    <>
      {/* ── DESKTOP ─────────────────────────────────────── */}
      <div className={s.bar}>
        {badge && (
          <span className={`${s.badge} ${badge.cls}`} role="status" aria-live="polite">
            {badge.label}
          </span>
        )}
        {actions.map(({ id, icon, label, onClick }) => (
          <button key={id} className={s.btn} onClick={onClick} title={label}>
            <i className={`fa-solid ${icon}`} aria-hidden="true" />
            <span className={s.label}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── MOBILE: FAB + bottom sheet ───────────────────── */}
      <div className={s.mobileArea}>
        {sheetOpen && (
          <div className={s.overlay} aria-hidden="true" onPointerDown={() => setSheetOpen(false)} />
        )}

        <div
          ref={sheetRef}
          className={`${s.sheet} ${sheetOpen ? s.sheetOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Ações da página"
        >
          <div className={s.sheetHandle} />
          <p className={s.sheetTitle}>
            {sheetBadge && (
              <span className={`${s.sheetBadgeBase} ${sheetBadge.cls}`} role="status" aria-live="polite">
                {sheetBadge.label}
              </span>
            )}
            Ações
          </p>
          <ul className={s.sheetList}>
            {actions.map(({ id, icon, label, onClick }) => (
              <li key={id}>
                <button className={s.sheetItem} onClick={() => handleAction(onClick)}>
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

        <button
          ref={fabRef}
          className={`${s.fab} ${sheetOpen ? s.fabOpen : ''}`}
          onClick={() => setSheetOpen(o => !o)}
          aria-label={sheetOpen ? 'Fechar ações' : 'Abrir ações'}
          aria-expanded={sheetOpen}
        >
          <i className={`fa-solid ${sheetOpen ? 'fa-xmark' : 'fa-ellipsis-vertical'}`} />
        </button>

        {/* Pip de status no FAB quando sheet fechado */}
        {!sheetOpen && saveState !== 'idle' && (
          <span
            className={`${s.fabPip} ${saveState === 'unsaved' ? s.fabPipUnsaved : s.fabPipSaved}`}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  )
}
