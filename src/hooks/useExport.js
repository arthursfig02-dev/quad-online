import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * useExport(previewRef, options)
 *
 * options:
 *   onStart(msg)          — chamado ao iniciar exportação
 *   onEnd(msg, type)      — chamado ao terminar
 *   onError(msg)          — chamado em caso de erro
 *   onOpenPreview()       — chamado ao abrir preview
 *   onBeforeCapture(el)   — chamado no clone ANTES do html2canvas (injeta tema)
 *   onAfterCapture(el)    — chamado no clone APÓS o html2canvas (remove tema)
 *   filename              — nome base do arquivo exportado
 */
export function useExport(previewRef, {
  onStart,
  onEnd,
  onError,
  onOpenPreview,
  onBeforeCapture,
  onAfterCapture,
  filename = 'documento',
} = {}) {

  /* ── captura via clone temporário ───────────────────────────────── */
  const capture = useCallback(async (scale = 2) => {
    const original = previewRef.current
    if (!original) throw new Error('Preview element not found')

    // Wrapper fora da tela
    const wrapper = document.createElement('div')
    wrapper.style.cssText = [
      'position:fixed', 'top:0', 'left:-9999px', 'width:21cm',
      'background:#fff', 'z-index:-9999', 'visibility:visible',
      'pointer-events:none', 'overflow:visible',
    ].join(';')

    // Clone — remove id para evitar conflito com CSS global (#id { visibility:hidden })
    const clone = original.cloneNode(true)
    clone.removeAttribute('id')
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
    clone.querySelectorAll('style').forEach(el => el.remove())
    clone.style.cssText = [
      'display:block', 'visibility:visible', 'opacity:1',
      'position:static', 'left:auto', 'top:auto',
      'width:21cm', 'min-height:29.7cm',
    ].join(';')

    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)

    // ── Injeta tema ANTES da captura ──
    onBeforeCapture?.(clone)

    // Aguarda imagens do clone
    const imgs = clone.querySelectorAll('img')
    await Promise.all(Array.from(imgs).map(img =>
      new Promise(resolve => {
        img.crossOrigin = 'anonymous'
        if (img.complete && img.naturalWidth > 0) return resolve()
        img.onload  = resolve
        img.onerror = resolve
        const src = img.src; img.src = ''; img.src = src
      })
    ))

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise(r => setTimeout(r, 600))

    let canvas
    try {
      canvas = await html2canvas(clone, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      })
    } finally {
      // ── Remove tema APÓS a captura ──
      onAfterCapture?.(clone)
      document.body.removeChild(wrapper)
    }

    return canvas
  }, [previewRef, onBeforeCapture, onAfterCapture])

  /* ── PDF ─────────────────────────────────────────────────────────── */
  const exportPDF = useCallback(async (msg = 'Gerando PDF…') => {
    onStart?.(msg)
    try {
      const canvas  = await capture(2)
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgData = canvas.toDataURL('image/png')
      const pageW = 210, pageH = 297, imgW = pageW
      const imgH  = (canvas.height * imgW) / canvas.width
      let y = 0
      while (y < imgH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, imgW, imgH)
        y += pageH
      }
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile) {
        const blob = pdf.output('blob')
        const file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' })
        let shared = false
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: filename }); shared = true }
          catch { /* cancelado */ }
        }
        if (!shared) _blobDownload(blob, `${filename}.pdf`)
      } else {
        pdf.save(`${filename}.pdf`)
      }
      onEnd?.('✔ PDF exportado!', 'success')
    } catch (e) {
      console.error(e)
      onEnd?.('Erro ao gerar PDF.', 'error')
      onError?.('Erro ao gerar PDF.')
    }
  }, [capture, filename, onStart, onEnd, onError])

  /* ── Imagem ──────────────────────────────────────────────────────── */
  const exportIMG = useCallback(async (msg = 'Gerando imagem…') => {
    onStart?.(msg)
    try {
      const canvas   = await capture(3)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const blob     = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob falhou')), 'image/png')
      )
      const file = new File([blob], `${filename}.png`, { type: 'image/png' })
      if (isMobile) {
        let shared = false
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: filename }); shared = true }
          catch { /* cancelado */ }
        }
        if (!shared) _blobDownload(blob, `${filename}.png`)
      } else {
        _blobDownload(blob, `${filename}.png`)
      }
      onEnd?.('✔ Imagem exportada!', 'success')
    } catch (e) {
      console.error(e)
      onEnd?.('Erro ao gerar imagem.', 'error')
      onError?.('Erro ao gerar imagem.')
    }
  }, [capture, filename, onStart, onEnd, onError])

  /* ── Impressão ───────────────────────────────────────────────────── */
  const printPreview = useCallback(() => {
    const el = previewRef.current
    if (!el) return
    let styles = ''
    document.querySelectorAll('style').forEach(s => { styles += s.outerHTML })
    document.querySelectorAll('link[rel="stylesheet"]').forEach(l => { styles += l.outerHTML })

    // Gera o CSS de tema para injetar na janela de impressão
    const themeStyle = el.querySelector('#export-theme-override')?.outerHTML || ''

    const win = window.open('', '_blank')
    if (!win) { onError?.('Popup bloqueado. Permita popups para imprimir.'); return }
    win.document.write(`<!DOCTYPE html>
<html lang="pt-br"><head><meta charset="UTF-8"><title>Impressão</title>${styles}
<style>
  body { margin:0; padding:0; background:#fff; }
  #vi-previsu, .rp-previsu, .dm-previsu {
    display:block!important; visibility:visible!important;
    position:static!important; left:auto!important;
    border:none!important; box-shadow:none!important;
    width:21cm!important; min-height:29.7cm!important;
    padding:.5cm!important; margin:0 auto!important;
  }
</style>
${themeStyle}
</head><body>${el.outerHTML}
<script>window.onload=function(){window.print()}</script>
</body></html>`)
    win.document.close()
  }, [previewRef, onError])

  /* ── Pré-visualizar em nova aba ──────────────────────────────────── */
  const openPreview = useCallback(() => {
    onOpenPreview?.()
  }, [onOpenPreview])

  return { exportPDF, exportIMG, printPreview, openPreview }
}

function _blobDownload(blob, name) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
