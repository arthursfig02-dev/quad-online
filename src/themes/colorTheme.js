/**
 * colorTheme
 * Aparência profissional com cor institucional.
 * Fundo branco, texto preto.
 * Cor aplicada APENAS em títulos, cabeçalhos e divisórias.
 *
 * Paletas disponíveis (cor primária):
 *   Azul Institucional  → #355C7D
 *   Verde Suave         → #4F6F52
 *   Bordô Elegante      → #7D3C3C
 *   Cinza Azulado       → #546A7B
 *   Marrom Clássico     → #6B5B4D
 */
export const colorTheme = {
  background: '#FFFFFF',
  text:       '#000000',
  primary:    '#355C7D', // sobrescrito pelo exportConfig.color
}

export const COLOR_PALETTES = [
  { label: 'Azul Institucional', value: '#355C7D' },
  { label: 'Verde Suave',        value: '#4F6F52' },
  { label: 'Bordô Elegante',     value: '#7D3C3C' },
  { label: 'Cinza Azulado',      value: '#546A7B' },
  { label: 'Marrom Clássico',    value: '#6B5B4D' },
]
