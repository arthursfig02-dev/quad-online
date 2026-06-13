import s from './ConfirmDialog.module.css'

/**
 * ConfirmDialog — diálogo de confirmação simples.
 *
 * <ConfirmDialog
 *   open={bool}
 *   title="Substituir dados?"
 *   message="Você tem alterações não salvas. Carregar vai substituí-las."
 *   confirmLabel="Carregar mesmo assim"
 *   cancelLabel="Cancelar"
 *   onConfirm={fn}
 *   onCancel={fn}
 *   danger      // deixa o botão de confirmação vermelho
 * />
 */
export default function ConfirmDialog({
  open,
  title     = 'Tem certeza?',
  message   = '',
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!open) return null

  return (
    <div
      className={s.overlay}
      onClick={e => e.target === e.currentTarget && onCancel?.()}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      aria-describedby="cd-msg"
    >
      <div className={s.box}>
        <div className={s.iconWrap}>
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        </div>
        <h3 className={s.title} id="cd-title">{title}</h3>
        {message && <p className={s.message} id="cd-msg">{message}</p>}
        <div className={s.actions}>
          <button className={s.cancel} onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`${s.confirm} ${danger ? s.danger : ''}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
