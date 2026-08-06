import { useNavigate } from 'react-router-dom'
import { useExportConfig } from '../context/ExportConfigContext'
import { COLOR_PALETTES } from '../themes/colorTheme'
import s from './Home.module.css'

const CARDS = [
  {
    to:    '/vida-ministerio',
    icon:  'fa-book',
    color: '#0e097f',
    title: 'Vida e Ministério',
    desc:  'Monte a programação da reunião de meio de semana com editor completo e exportação em PDF.',
  },
  {
    to:    '/reuniao-publica',
    icon:  'fa-person-chalkboard',
    color: '#1e3a6e',
    title: 'Reunião Pública',
    desc:  'Organize a programação mensal da reunião pública com oradores, temas e leitor.',
  },
  {
    to:    '/designacoes-mecanicas',
    icon:  'fa-list-check',
    color: '#237db1',
    title: 'Designações Mecânicas',
    desc:  'Gerencie indicadores, volantes, som e palco semana a semana com exportação em PDF.',
  },
  {
    to:    '/programacao-campo',
    icon:  'fa-calendar-days',
    color: '#3b2d25',
    title: 'Programação de Campo',
    desc:  'Monte o calendário mensal de campo com horários, locais e dirigentes por dia.',
  },
  {
    to:    '/arranjo-limpeza',
    icon:  'fa-broom',
    color: '#2f5c1e',
    title: 'Arranjo de Limpeza',
    desc:  'Gere o quadro mensal de rotação dos grupos de limpeza do Salão do Reino.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { config, setConfig } = useExportConfig()

  const isPrint = config.style === 'print'

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <i className="fa-solid fa-book-open" style={{ fontSize: 48, color: '#4da3ff' }} />
        <h1 className={s.title}>Quadro Online</h1>
        <p className={s.sub}>
          Selecione um módulo para começar a montar a programação da sua congregação.
        </p>
      </div>

      {/* ── Card de Estilo de Exportação ── */}
      <div className={s.exportCard}>
        <div className={s.exportCardHeader}>
          <i className="fa-solid fa-palette" />
          <span>Estilo de Exportação</span>
          <span className={s.exportCardBadge}>PDF · Imagem · Impressão</span>
        </div>

        <p className={s.exportCardDesc}>
          Aplica-se a: <strong>Reunião Pública</strong>, <strong>Designações Mecânicas</strong>, <strong>Programação de Campo</strong> e <strong>Arranjo de Limpeza</strong>.
        </p>

        <div className={s.exportOptions}>
          {/* Impressão */}
          <label className={`${s.exportOption} ${isPrint ? s.exportOptionActive : ''}`}>
            <input
              type="radio"
              name="export-style"
              value="print"
              checked={isPrint}
              onChange={() => setConfig({ style: 'print' })}
            />
            <span className={s.exportOptionDot} />
            <div className={s.exportOptionContent}>
              <span className={s.exportOptionTitle}>
                <i className="fa-solid fa-print" /> Impressão
              </span>
              <span className={s.exportOptionSub}>Preto e branco, baixo consumo de tinta</span>
            </div>
          </label>

          {/* Colorido */}
          <label className={`${s.exportOption} ${!isPrint ? s.exportOptionActive : ''}`}>
            <input
              type="radio"
              name="export-style"
              value="color"
              checked={!isPrint}
              onChange={() => setConfig({ style: 'color' })}
            />
            <span className={s.exportOptionDot} />
            <div className={s.exportOptionContent}>
              <span className={s.exportOptionTitle}>
                <i className="fa-solid fa-droplet" /> Colorido
              </span>
              <span className={s.exportOptionSub}>Cabeçalhos e títulos com cor institucional</span>
            </div>
          </label>
        </div>

        {/* Seletor de cor — só quando colorido */}
        <div className={`${s.colorRow} ${isPrint ? s.colorRowDisabled : ''}`}>
          <label className={s.colorLabel}>
            <i className="fa-solid fa-circle-half-stroke" /> Cor principal
          </label>
          {isPrint ? (
            <span className={s.colorDisabledText}>Disponível no modo Colorido</span>
          ) : (
            <div className={s.colorPalette}>
              {COLOR_PALETTES.map(({ label, value }) => (
                <button
                  key={value}
                  className={`${s.colorSwatch} ${config.color === value ? s.colorSwatchActive : ''}`}
                  style={{ '--swatch-color': value }}
                  onClick={() => setConfig({ color: value })}
                  title={label}
                  aria-label={label}
                >
                  {config.color === value && <i className="fa-solid fa-check" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview da cor selecionada */}
        {!isPrint && (
          <div className={s.colorPreviewRow}>
            <span className={s.colorPreviewLabel}>
              {COLOR_PALETTES.find(p => p.value === config.color)?.label ?? 'Personalizado'}
            </span>
            <span className={s.colorPreviewChip} style={{ background: config.color }} />
          </div>
        )}

        <p className={s.exportNote}>
          <i className="fa-solid fa-lock" style={{ marginRight: 5 }} />
          Vida e Ministério sempre exporta com seu estilo original.
        </p>
      </div>

      {/* ── Cards de módulos ── */}
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
