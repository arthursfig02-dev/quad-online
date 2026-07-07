import LZString from 'lz-string'

/**
 * checkAndImportFromUrl
 * Intercepta o parâmetro 'import' da URL.
 * Se existir, decodifica via LZString, valida o JSON, salva na chave LS indicada,
 * limpa a URL (replaceState) para manter a navegação limpa, e retorna true.
 *
 * @param {string} lsKey - A chave do localStorage
 * @returns {boolean} true se importou com sucesso, caso contrário false
 */
export function checkAndImportFromUrl(lsKey) {
  try {
    const params = new URLSearchParams(window.location.search)
    const importData = params.get('import')
    if (importData) {
      const decompressed = LZString.decompressFromEncodedURIComponent(importData)
      if (decompressed) {
        // Valida se é um JSON válido
        JSON.parse(decompressed)
        localStorage.setItem(lsKey, decompressed)
        
        // Remove apenas o parâmetro 'import' para manter o resto (ex: ano/mes se houver)
        const url = new URL(window.location.href)
        url.searchParams.delete('import')
        window.history.replaceState({}, document.title, url.pathname + url.search)
        return true
      }
    }
  } catch (e) {
    console.error('[checkAndImportFromUrl] Erro ao importar dados da URL:', e)
  }
  return false
}

/**
 * generateShareUrl
 * Converte um objeto em JSON, comprime via LZString e gera o link completo.
 *
 * @param {object} data - O objeto a ser compartilhado
 * @param {object} extraParams - Parâmetros adicionais para a query (ex: { ano: 2026, mes: 6 })
 * @returns {string} O link de compartilhamento gerado
 */
export function generateShareUrl(data, extraParams = {}) {
  const jsonStr = JSON.stringify(data)
  const compressed = LZString.compressToEncodedURIComponent(jsonStr)
  const url = new URL(window.location.href)
  url.search = '' // limpa parâmetros antigos na URL base de compartilhamento
  url.searchParams.set('import', compressed)
  
  Object.entries(extraParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, val)
    }
  })
  
  return url.toString()
}
