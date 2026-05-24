import s from './PageActionBar.module.css'

/**
 * <PageActionBar
 *   actions={[
 *     { id: 'salvar',    icon: 'fa-cloud-arrow-up',   label: 'Salvar',        onClick: fn },
 *     { id: 'carregar',  icon: 'fa-cloud-arrow-down',  label: 'Carregar',      onClick: fn },
 *     { id: 'preview',   icon: 'fa-eye',               label: 'Pré-Visualizar',onClick: fn },
 *     { id: 'imprimir',  icon: 'fa-print',             label: 'Imprimir',      onClick: fn },
 *     { id: 'pdf',       icon: 'fa-file-pdf',          label: 'Baixar PDF',    onClick: fn },
 *     { id: 'foto',      icon: 'fa-image',             label: 'Baixar Foto',   onClick: fn },
 *   ]}
 *   unsaved={bool}
 * />
 */
export default function PageActionBar({ actions = [], unsaved = false }) {
  return (
    <div className={s.bar}>
      {unsaved && <span className={s.badge}>● não salvo</span>}
      {actions.map(({ id, icon, label, onClick }) => (
        <button key={id} className={s.btn} onClick={onClick} title={label}>
          <i className={`fa-solid ${icon}`} aria-hidden="true" />
          <span className={s.label}>{label}</span>
        </button>
      ))}
    </div>
  )
}
