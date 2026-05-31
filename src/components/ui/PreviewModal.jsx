import { useEffect, useRef } from 'react'
import s from './PreviewModal.module.css'

/**
 * PreviewModal — duas estratégias de renderização:
 *
 * 1. previewRef  → clona o elemento (VM, RP, DM)
 *                  Remove ids e <style> internos para evitar conflito CSS.
 *
 * 2. docRef      → move o elemento A4 real para dentro do modal e devolve
 *                  ao desmontar (Programação de Campo).
 *
 * Apenas um dos dois props deve ser passado.
 */
export default function PreviewModal({ previewRef, docRef, onClose, title = 'Pré-visualização' }) {
  const scrollRef    = useRef()
  const containerRef = useRef()

  /* ── ESTRATÉGIA 1: clone (previewRef) ───────────────── */
  useEffect(() => {
    if (!previewRef) return
    const original  = previewRef.current
    const container = containerRef.current
    if (!original || !container) return

    const clone = original.cloneNode(true)
    clone.removeAttribute('id')
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
    clone.querySelectorAll('style').forEach(el => el.remove())
    clone.style.cssText = [
      'display:block', 'visibility:visible', 'opacity:1',
      'position:relative', 'left:auto', 'top:auto',
      'width:21cm', 'min-height:29.7cm',
      'transform-origin:top left', 'flex-shrink:0',
    ].join(';')
    container.appendChild(clone)

    function escalar() {
      const scroll = scrollRef.current
      if (!scroll || !clone) return
      const availW = scroll.clientWidth  - 32
      const availH = scroll.clientHeight - 32
      const docW   = clone.scrollWidth  || 794
      const docH   = clone.scrollHeight || 1123
      const scale  = Math.min(availW / docW, availH / docH, 1)
      clone.style.transform       = `scale(${scale})`
      container.style.width       = (docW * scale) + 'px'
      container.style.height      = (docH * scale) + 'px'
    }

    const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      escalar()
      window.addEventListener('resize', escalar)
    }))

    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', escalar)
      document.removeEventListener('keydown', onKey)
      clone.remove()
    }
  }, [previewRef, onClose])

  /* ── ESTRATÉGIA 2: move elemento real (docRef) ──────── */
  useEffect(() => {
    if (!docRef) return
    const el        = docRef.current
    const container = containerRef.current
    if (!el || !container) return

    // salva estado original para restaurar ao fechar
    const origVisibility = el.style.visibility
    const origPosition   = el.style.position
    const origTransform  = el.style.transform
    const origParent     = el.parentElement

    el.style.visibility = 'visible'
    el.style.position   = 'relative'
    el.style.transform  = 'none'
    container.appendChild(el)

    function escalar() {
      const scroll = scrollRef.current
      if (!scroll || !el) return
      const availW = scroll.clientWidth  - 32
      const availH = scroll.clientHeight - 32
      const scale  = Math.min(availW / 794, availH / 1123, 1)
      el.style.transform       = `scale(${scale})`
      el.style.transformOrigin = 'top left'
      container.style.width    = (794 * scale) + 'px'
      container.style.height   = (1123 * scale) + 'px'
    }

    const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      escalar()
      window.addEventListener('resize', escalar)
    }))

    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', escalar)
      document.removeEventListener('keydown', onKey)
      // devolve o elemento ao lugar original
      el.style.visibility = origVisibility
      el.style.position   = origPosition
      el.style.transform  = origTransform
      if (origParent) origParent.appendChild(el)
    }
  }, [docRef, onClose])

  return (
    <div
      className={s.overlay}
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={s.box}>
        <div className={s.header}>
          <span className={s.label}>{title} — A4</span>
          <button className={s.closeBtn} onClick={onClose} aria-label="Fechar pré-visualização">
            ✕
          </button>
        </div>
        <div className={s.scroll} ref={scrollRef}>
          <div ref={containerRef} className={s.container} />
        </div>
      </div>
    </div>
  )
}
