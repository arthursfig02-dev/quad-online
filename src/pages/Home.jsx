import { useNavigate } from 'react-router-dom'
import s from './Home.module.css'

const CARDS = [
  {
    to:      '/vida-ministerio',
    icon:    'fa-book-bible',
    color:   '#0e097f',
    title:   'Vida e Ministério',
    desc:    'Monte a programação da reunião de meio de semana com editor completo e exportação em PDF.',
  },
  {
    to:      '/reuniao-publica',
    icon:    'fa-person-chalkboard',
    color:   '#1e3a6e',
    title:   'Reunião Pública',
    desc:    'Organize a programação mensal da reunião pública com oradores, temas e leitor.',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <i className="fa-solid fa-book-open" style={{ fontSize: 48, color: '#4da3ff' }} />
        <h1 className={s.title}>Reuniões JW</h1>
        <p className={s.sub}>
          Selecione um módulo para começar a montar a programação da sua congregação.
        </p>
      </div>

      <div className={s.grid}>
        {CARDS.map(({ to, icon, color, title, desc }) => (
          <button
            key={to}
            className={s.card}
            onClick={() => navigate(to)}
            style={{ '--card-color': color }}
          >
            <div className={s.cardIcon}>
              <i className={`fa-solid ${icon}`} />
            </div>
            <h2 className={s.cardTitle}>{title}</h2>
            <p className={s.cardDesc}>{desc}</p>
            <span className={s.cardCta}>
              Abrir <i className="fa-solid fa-arrow-right" />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
