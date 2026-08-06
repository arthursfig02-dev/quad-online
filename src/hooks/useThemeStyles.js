import { useExportConfig } from '../context/ExportConfigContext'

/**
 * useThemeStyles(module)
 *
 * Retorna uma string CSS que deve ser injetada via <style> DENTRO
 * do documento exportado (preview/clone), sobrescrevendo as cores
 * originais de acordo com o estilo configurado.
 *
 * module: 'rp' | 'dm' | 'pc'
 * Vida e Ministério (vm) é ignorado — retorna string vazia.
 */
export function useThemeStyles(module) {
  const { config } = useExportConfig()

  if (module === 'vm') return ''           // bloqueado — nunca altera
  if (!config || !config.style) return ''

  const color = config.color || '#355C7D'

  if (config.style === 'print') {
    return getPrintCSS(module)
  }

  if (config.style === 'color') {
    return getColorCSS(module, color)
  }

  return ''
}

/* ════════════════════════════════════════════════════════
   IMPRESSÃO — preto e branco, sem gradientes, sem sombras
   ════════════════════════════════════════════════════════ */
function getPrintCSS(module) {
  if (module === 'rp') return `
    .rp-des {
      background: #fff !important;
      color: #000 !important;
      text-shadow: none !important;
      border: 2px solid #666 !important;
      border-radius: 0 !important;
    }
    .rp-cong-bar {
      background: #fff !important;
      color: #000 !important;
      text-shadow: none !important;
      border: 1px solid #666 !important;
      border-radius: 0 !important;
    }
    .rp-semana-titulo th {
      background: #e8e8e8 !important;
      color: #000 !important;
    }
    .rp-cat-label {
      background: #f0f0f0 !important;
      color: #000 !important;
    }
    .rp-semanas-table td {
      border-color: #666 !important;
    }
  `

  if (module === 'dm') return `
    .dm-des {
      background: #fff !important;
      color: #000 !important;
      text-shadow: none !important;
      border: 2px solid #666 !important;
      border-radius: 0 !important;
    }
    .dm-cong-bar {
      background: #fff !important;
      color: #000 !important;
      text-shadow: none !important;
      border: 1px solid #666 !important;
      border-radius: 0 !important;
    }
    .dm-semana-titulo th {
      background: #e8e8e8 !important;
      color: #000 !important;
    }
    .dm-cat-label {
      background: #f0f0f0 !important;
      color: #000 !important;
    }
    .dm-semanas-table td {
      border-color: #666 !important;
    }
  `

  if (module === 'pc') return `
    .pc-doc-cabecalho {
      background: #fff !important;
      border-bottom: 2px solid #000 !important;
    }
    .pc-doc-tabela th {
      background: #e8e8e8 !important;
      color: #000 !important;
      border-color: #666 !important;
    }
    .pc-doc-tabela td {
      border-color: #666 !important;
    }
    .pc-doc-td-vazio {
      background: #f0f0f0 !important;
    }
    .pc-doc-dia-num {
      color: #000 !important;
    }
    .pc-doc-dia-num-dest {
      color: #000 !important;
    }
    .pc-doc-obs {
      background: #f5f5f5 !important;
      border-left-color: #666 !important;
    }
    .pc-doc-horario-entry {
      background: #fff !important;
    }
    .pc-dh-label { color: #555 !important; }
    .pc-dh-val   { color: #000 !important; }
    .pc-doc-semana-obs {
      background: #fff !important;
      border: 1px solid #666 !important;
    }
    .pc-doc-semana-obs-titulo {
      color: #000 !important;
      border-bottom: 1px solid #666 !important;
    }
    .pc-doc-semana-obs-conteudo {
      color: #000 !important;
    }
  `

  if (module === 'al') return `
    .al-doc-titulo {
      color: #000 !important;
    }
    .al-doc-subtitulo {
      color: #333 !important;
    }
    .al-cab-mes td {
      background: #e8e8e8 !important;
      color: #000 !important;
      border-color: #666 !important;
    }
    .al-cab-col td {
      background: #f0f0f0 !important;
      color: #000 !important;
      border-color: #666 !important;
    }
    .al-mes-bloco {
      border-color: #666 !important;
    }
    .al-semanas-table td {
      border-color: #666 !important;
    }
  `

  return ''
}

/* ════════════════════════════════════════════════════════
   COLORIDO — fundo branco, texto preto, cor só em títulos
   ════════════════════════════════════════════════════════ */
function getColorCSS(module, color) {
  // Versão mais clara da cor primária para fundos (opacity ~15%)
  const colorLight = hexToRgba(color, 0.13)
  const colorMid   = hexToRgba(color, 0.22)

  if (module === 'rp') return `
    .rp-des {
      background: ${color} !important;
      color: #fff !important;
      text-shadow: none !important;
    }
    .rp-cong-bar {
      background: ${color} !important;
      color: #fff !important;
      text-shadow: none !important;
      border-bottom-color: ${color} !important;
    }
    .rp-semana-titulo th {
      background: ${colorLight} !important;
      color: #000 !important;
      border-color: ${color} !important;
    }
    .rp-cat-label {
      background: ${colorLight} !important;
      color: #000 !important;
    }
    .rp-semanas-table td {
      border-color: #bbb !important;
    }
  `

  if (module === 'dm') return `
    .dm-des {
      background: ${color} !important;
      color: #fff !important;
      text-shadow: none !important;
    }
    .dm-cong-bar {
      background: ${color} !important;
      color: #fff !important;
      text-shadow: none !important;
      border-bottom-color: ${color} !important;
    }
    .dm-semana-titulo th {
      background: ${colorLight} !important;
      color: #000 !important;
      border-color: ${color} !important;
    }
    .dm-cat-label {
      background: ${colorLight} !important;
      color: #000 !important;
    }
    .dm-semanas-table td {
      border-color: #bbb !important;
    }
  `

  if (module === 'pc') return `
    .pc-doc-cabecalho {
      background: ${color} !important;
      color: #fff !important;
      border-bottom-color: ${color} !important;
    }
    .pc-doc-ano { color: #fff !important; }
    .pc-doc-mes {
      color: #fff !important;
      border-bottom-color: rgba(255,255,255,0.5) !important;
    }
    .pc-doc-porcon h2 { color: #fff !important; }
    .pc-doc-cong {
      background: #fff !important;
      color: ${color} !important;
      border-color: rgba(255,255,255,0.4) !important;
      box-shadow: none !important;
    }
    .pc-doc-tabela th {
      background: ${colorMid} !important;
      color: #000 !important;
      border-color: ${color} !important;
    }
    .pc-doc-tabela td {
      border-color: #bbb !important;
    }
    .pc-doc-td-vazio {
      background: #f8f8f8 !important;
    }
    .pc-doc-dia-num      { color: ${color} !important; }
    .pc-doc-dia-num-dest { color: ${color} !important; }
    .pc-doc-obs {
      background: ${colorLight} !important;
      border-left-color: ${color} !important;
    }
    .pc-doc-semana-obs {
      background: ${colorLight} !important;
      border: 1px solid ${color} !important;
    }
    .pc-doc-semana-obs-titulo {
      color: ${color} !important;
      border-bottom: 1px solid ${color} !important;
    }
    .pc-doc-semana-obs-conteudo {
      color: #111 !important;
    }
  `

  if (module === 'al') return `
    .al-doc-titulo {
      color: ${color} !important;
    }
    .al-cab-mes td {
      background: ${color} !important;
      color: #fff !important;
    }
    .al-cab-col td {
      background: ${colorLight} !important;
      color: #000 !important;
      border-color: ${color} !important;
    }
    .al-mes-bloco {
      border-color: ${color} !important;
    }
    .al-semanas-table td {
      border-color: #bbb !important;
    }
  `

  return ''
}

/* ── helper: hex → rgba ── */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
