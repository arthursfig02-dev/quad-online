import { useEffect, useRef } from 'react'

/**
 * useAutoSave(saveFn, deps, delay = 2000)
 *
 * Chama `saveFn` automaticamente após `delay` ms de inatividade
 * sempre que qualquer valor em `deps` mudar.
 *
 * - Não dispara na montagem inicial (ignora o primeiro render).
 * - Cancela o timer se o componente desmontar antes do delay.
 * - `saveFn` deve ser estável (useCallback) ou ser uma função inline
 *   simples — o hook não a coloca nas deps para evitar loops.
 */
export function useAutoSave(saveFn, deps, delay = 2000) {
  const saveFnRef   = useRef(saveFn)
  const mountedRef  = useRef(false)
  const timerRef    = useRef(null)

  // Mantém a ref sempre atualizada sem re-criar o efeito
  useEffect(() => { saveFnRef.current = saveFn })

  useEffect(() => {
    // Ignora o primeiro render (montagem)
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveFnRef.current?.()
    }, delay)

    return () => clearTimeout(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])
}
