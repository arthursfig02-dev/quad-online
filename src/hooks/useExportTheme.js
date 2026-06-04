import { useCallback } from 'react'
import { useThemeStyles } from './useThemeStyles'

const STYLE_TAG_ID = 'export-theme-override'

/**
 * useExportTheme(module)
 *
 * Retorna { applyTheme, removeTheme }.
 * applyTheme(el)  → injeta <style> de tema dentro do elemento capturado
 * removeTheme(el) → remove o <style> após a captura
 *
 * module: 'rp' | 'dm' | 'pc' | 'vm'
 *   'vm' → nunca aplica nada (bloqueado pelo useThemeStyles)
 */
export function useExportTheme(module) {
  const themeCSS = useThemeStyles(module)

  const applyTheme = useCallback((el) => {
    if (!el || !themeCSS) return
    el.querySelector(`#${STYLE_TAG_ID}`)?.remove()
    const style = document.createElement('style')
    style.id = STYLE_TAG_ID
    style.textContent = themeCSS
    el.prepend(style)
  }, [themeCSS])

  const removeTheme = useCallback((el) => {
    if (!el) return
    el.querySelector(`#${STYLE_TAG_ID}`)?.remove()
  }, [])

  return { applyTheme, removeTheme }
}
