import { useEffect } from 'react'
import { useThemeStyles } from './useThemeStyles'

const STYLE_TAG_ID = 'export-theme-override'

/**
 * useThemeLive(ref, module)
 *
 * Aplica e mantém o tema de exportação sincronizado em tempo real
 * dentro do elemento apontado por `ref` (o previsu lateral visível).
 *
 * Sempre que o config muda (estilo ou cor), o <style> é reinjetado
 * automaticamente — sem precisar chamar applyTheme manualmente.
 *
 * module: 'rp' | 'dm' | 'pc'
 */
export function useThemeLive(ref, module) {
  const themeCSS = useThemeStyles(module)

  useEffect(() => {
    const el = ref?.current
    if (!el) return

    // Remove tag anterior
    el.querySelector(`#${STYLE_TAG_ID}`)?.remove()

    // Só injeta se houver CSS (style !== 'default' / módulo não bloqueado)
    if (!themeCSS) return

    const style = document.createElement('style')
    style.id = STYLE_TAG_ID
    style.textContent = themeCSS
    el.prepend(style)

    return () => {
      el.querySelector(`#${STYLE_TAG_ID}`)?.remove()
    }
  }, [ref, themeCSS])
}
