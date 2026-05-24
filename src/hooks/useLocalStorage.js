import { useState, useCallback } from 'react'

/**
 * useLocalStorage(key, defaultValue)
 * Funciona como useState, mas persiste no localStorage.
 * Serialização/deserialização JSON automática.
 */
export function useLocalStorage(key, defaultValue) {
  const [state, setStateRaw] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setState = useCallback((valueOrUpdater) => {
    setStateRaw(prev => {
      const next = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev)
        : valueOrUpdater
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        console.warn(`useLocalStorage: não foi possível salvar a chave "${key}"`)
      }
      return next
    })
  }, [key])

  const save = useCallback((value) => {
    // salva explicitamente (sem alterar o estado React)
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.warn(`useLocalStorage: não foi possível salvar a chave "${key}"`)
    }
  }, [key])

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [key])

  return [state, setState, { save, load }]
}
