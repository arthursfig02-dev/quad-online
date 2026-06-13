import s from './PageHeader.module.css'

export default function PageHeader({ icon, title, subtitle, color }) {
  return (
    <div className={s.header}>
      <div
        className={s.iconWrap}
        style={color ? { background: color } : undefined}
      >
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </div>
      <div className={s.text}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
    </div>
  )
}
