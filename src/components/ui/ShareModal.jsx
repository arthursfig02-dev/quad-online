import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import s from './ShareModal.module.css'

/**
 * ShareModal
 *
 * <ShareModal
 *   open={bool}
 *   shareUrl={string}
 *   onClose={fn}
 * />
 */
export default function ShareModal({ open, shareUrl, onClose }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open && canvasRef.current && shareUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 220,
          margin: 1,
          color: {
            dark: '#0e097f', // Tom de azul primário do tema
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('[ShareModal] Erro ao desenhar QR Code:', error)
        }
      )
    }
  }, [open, shareUrl])

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  if (!open) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[ShareModal] Falha ao copiar:', err)
    }
  }

  return (
    <div
      className={s.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sm-title"
    >
      <div className={s.box}>
        <button className={s.closeBtn} onClick={onClose} aria-label="Fechar">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <div className={s.iconWrap}>
          <i className="fa-solid fa-share-nodes" aria-hidden="true" />
        </div>

        <h3 className={s.title} id="sm-title">Compartilhar Progresso</h3>
        <p className={s.message}>
          Envie o link abaixo para outro dispositivo ou escaneie o QR Code para continuar preenchendo o formulário de onde parou.
        </p>

        <div className={s.copySection}>
          <input
            type="text"
            className={s.urlInput}
            value={shareUrl}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button className={s.copyBtn} onClick={handleCopy} title="Copiar Link">
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`} aria-hidden="true" />
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <div className={s.qrSection}>
          <div className={s.qrBorder}>
            <canvas ref={canvasRef} className={s.qrCanvas} />
          </div>
          <span className={s.qrLabel}>Escaneie com a câmera do celular</span>
        </div>

        <div className={s.actions}>
          <button className={s.close} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
