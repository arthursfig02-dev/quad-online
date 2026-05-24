import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * useExport(previewRef, { onStart, onEnd, onError, filename })
 *
 * previewRef → React ref apontando para o elemento que será capturado.
 * Retorna { exportPDF, exportIMG, printPreview }
 */
export function useExport(previewRef, { onStart, onEnd, onError, filename = 'documento' } = {}) {

  /* ── captura interna ─────────────────────────────────────────── */
  const capture = useCallback(async (scale = 2) => {
    const el = previewRef.current
    if (!el) throw new Error('Preview element not found')

    // Aguarda imagens dentro do clone
    const imgs = el.querySelectorAll('img')
    await Promise.all(Array.from(imgs).map(img =>
      new Promise(resolve => {
        img.crossOrigin = 'anonymous'
        if (img.complete && img.naturalWidth > 0) return resolve()
        img.onload = resolve
        img.onerror = resolve
      })
    ))

    // Dois frames para garantir que o layout foi calculado
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise(r => setTimeout(r, 400))

    return html2canvas(el, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      width: el.scrollWidth,
      height: el.scrollHeight,
    })
  }, [previewRef])

  /* ── PDF ─────────────────────────────────────────────────────── */
  const exportPDF = useCallback(async (msg = 'Gerando PDF…') => {
    onStart?.(msg)
    try {
      const canvas = await capture(2)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgData = canvas.toDataURL('image/png')
      const pageW = 210, pageH = 297
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width

      let y = 0
      while (y < imgH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, imgW, imgH)
        y += pageH
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile && navigator.canShare) {
        const blob = pdf.output('blob')
        const file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename })
        } else {
          _download(URL.createObjectURL(blob), `${filename}.pdf`)
        }
      } else {
        pdf.save(`${filename}.pdf`)
      }
      onEnd?.('✔ PDF exportado!', 'success')
    } catch (e) {
      console.error(e)
      onError?.('Erro ao gerar PDF.')
      onEnd?.('Erro ao gerar PDF.', 'error')
    }
  }, [capture, filename, onStart, onEnd, onError])

  /* ── Imagem ──────────────────────────────────────────────────── */
  const exportIMG = useCallback(async (msg = 'Gerando imagem…') => {
    onStart?.(msg)
    try {
      const canvas = await capture(3)
      const dataUrl = canvas.toDataURL('image/png')

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile && navigator.canShare) {
        const blob = await fetch(dataUrl).then(r => r.blob())
        const file = new File([blob], `${filename}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename })
        } else {
          _download(URL.createObjectURL(blob), `${filename}.png`)
        }
      } else {
        _download(dataUrl, `${filename}.png`)
      }
      onEnd?.('✔ Imagem exportada!', 'success')
    } catch (e) {
      console.error(e)
      onError?.('Erro ao gerar imagem.')
      onEnd?.('Erro ao gerar imagem.', 'error')
    }
  }, [capture, filename, onStart, onEnd, onError])

  /* ── Impressão ───────────────────────────────────────────────── */
  const printPreview = useCallback(() => {
    const el = previewRef.current
    if (!el) return

    // Coleta todos os <style> e <link rel=stylesheet> da página
    let styles = ''
    document.querySelectorAll('style').forEach(s => { styles += s.outerHTML })
    document.querySelectorAll('link[rel="stylesheet"]').forEach(l => { styles += l.outerHTML })

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">
      <title>Impressão</title>${styles}
      <style>
        body { margin:0; padding:20px; background:#fff; }
        #vi-previsu, .previsu {
          display:block!important; position:static!important;
          left:auto!important; visibility:visible!important;
          border:none!important; box-shadow:none!important;
          width:21cm!important; padding:.5cm!important; margin:0 auto!important;
        }
      </style>
    </head><body>${el.outerHTML}
    <script>window.onload=function(){window.print();}<\/script></body></html>`)
    win.document.close()
  }, [previewRef])

  return { exportPDF, exportIMG, printPreview }
}

/* helper interno */
function _download(href, name) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(href), 5000)
}
