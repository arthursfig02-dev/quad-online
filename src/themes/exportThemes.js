// Tema Impressão — preto e branco, sem gradientes, sem sombras, baixo consumo de tinta
export const printTheme = {
  background:    '#FFFFFF',
  text:          '#000000',
  border:        '#666666',
  headerBg:      '#FFFFFF',
  headerText:    '#000000',
  headerBorder:  '#000000',
  rowAltBg:      '#F5F5F5',
  labelBg:       '#EEEEEE',
  labelText:     '#000000',
  titleBarBg:    '#FFFFFF',
  titleBarText:  '#000000',
  titleBarBorder:'#000000',
  shadow:        'none',
  gradient:      'none',
  // Programação de Campo
  docHeaderBg:   '#FFFFFF',
  docThBg:       '#EEEEEE',
  docThText:     '#000000',
  docObsBg:      '#FFFFFF',
  docObsBorder:  '#666666',
}

// Paletas disponíveis para o tema Colorido
export const COLOR_PALETTES = [
  { id: 'blue',   label: 'Azul Institucional', value: '#355C7D' },
  { id: 'green',  label: 'Verde Suave',         value: '#4F6F52' },
  { id: 'wine',   label: 'Bordô Elegante',       value: '#7D3C3C' },
  { id: 'slate',  label: 'Cinza Azulado',        value: '#546A7B' },
  { id: 'brown',  label: 'Marrom Clássico',      value: '#6B5B4D' },
]

// Gera um colorTheme a partir de uma cor primária
export function buildColorTheme(primary = '#355C7D') {
  return {
    background:    '#FFFFFF',
    text:          '#000000',
    border:        '#CCCCCC',
    headerBg:      primary,
    headerText:    '#FFFFFF',
    headerBorder:  primary,
    rowAltBg:      '#FFFFFF',
    labelBg:       hexWithAlpha(primary, 0.12),
    labelText:     primary,
    titleBarBg:    primary,
    titleBarText:  '#FFFFFF',
    titleBarBorder: primary,
    shadow:        'none',
    gradient:      'none',
    // Programação de Campo
    docHeaderBg:   primary,
    docThBg:       hexWithAlpha(primary, 0.18),
    docThText:     '#000000',
    docObsBg:      hexWithAlpha(primary, 0.07),
    docObsBorder:  primary,
  }
}

// Converte hex + alpha em rgba
function hexWithAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
